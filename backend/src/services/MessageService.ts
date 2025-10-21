import { IMessage } from "../models/Conversation";
import { ChatbotIaProvider } from "../providers/IA/ChatbotIaProvider";
import { WhatsAppProvider } from "../providers/WhatsApp/WhatsAppProvider";
import { ConversationOrchestrator } from "../utils/IA/ContextBuilder";
import { AgendaService } from "./agendaService";
import { databaseService } from "./DatabaseService";
import axios from "axios";

export class MessageService {
  constructor(
    private whatsAppProvider: WhatsAppProvider,
    private iaProvider: ChatbotIaProvider,
    private agendaService: AgendaService
  ) {}

  private orchestrator = new ConversationOrchestrator();

  async sendWhatsAppMessage(to: string, message?: string) {
    await this.whatsAppProvider.sendMessage(to, message);
  }

  async handleUserIncomingMessage2(userId: string, userMessage: string): Promise<{ botResponse?: string; shouldReply: boolean }> {

    await this.salvarMensagemCliente(userId, userMessage);

    console.log(`cliente: ${userId}: mensagem: ${userMessage}
      
      `);
    
    const botResponse = await this.generateBotResponse(userId, userMessage, await this.listarHorariosDisponiveis());    
    
    console.log(`Resposta do bot:  ${botResponse}
      
      `);
    

    await this.salvarMensagemBot(userId, botResponse);

    return {
      botResponse: botResponse,
      shouldReply: true,
    };
  }




  async handleUserIncomingMessage(sender: string, userMessage: string) {
    try {
      // Call Rasa REST API
      const rasaResponse = await axios.post("http://localhost:5005/webhooks/rest/webhook", {
        sender,
        message: userMessage,
      });

          console.log(`cliente: ${sender}: mensagem: ${userMessage}
      
      `);

      // rasaResponse.data is usually an array of messages
      let botResponse = "";
      if (rasaResponse.data && rasaResponse.data.length > 0) {
        botResponse = rasaResponse.data.map((msg: any) => msg.text).join("\n");
      }

       console.log(`Resposta do bot:  ${botResponse}
      
      `);
    

      return { botResponse, shouldReply: true };
    } catch (err) {
      console.error("Error calling Rasa:", err);
      return { botResponse: "❌ Sorry, I’m having trouble right now.", shouldReply: true };
    }
  }



  private async listarHorariosDisponiveis() {
    const slots = await this.agendaService.listAvailableSlots(
       '2025-08-15T09:00:00-03:00',
        '2025-08-15T17:00:00-03:00'
    );
    return slots;
  }

  private async salvarMensagemBot(from: string, botResponse: string) {
    await databaseService.addMessage(from, {
      content: botResponse,
      sender: "bot",
      timestamp: new Date(),
    });
  }

  private async salvarMensagemCliente(from: string, message: string) {
    await databaseService.addMessage(from, {
      content: message,
      sender: "user",
      timestamp: new Date(),
    });
  }

  private async generateBotResponse(userId: string, userMessage: string, horarios: string[]): Promise<string> {
    const conversation = (await databaseService.getChatHystory(userId)) as {
      messages: IMessage[];
    };

    const context = this.orchestrator.buildConversationContext(
      conversation,
      userMessage,
      horarios
    );

    
    return this.generateNaturalResponse(context, horarios);
  }

  private async generateNaturalResponse(context: string, horarios: string[]): Promise<string> {
    const prompt = context;

    const iaResponse = await this.iaProvider.sendMessage(prompt);   
    
    if(iaResponse.function_call) {
      
      return this.handleFunctionCall(iaResponse.function_call, horarios);     
    }      

    const jsonResponse = this.extractJsonFromContent(iaResponse.content);
    if (jsonResponse) {
        return this.handleAgendamento(jsonResponse, horarios);
    }
    
    return iaResponse.content ?? "";

  }

  private extractJsonFromContent(content: string): any {
    try {
        // Handle both ```json\n...\n``` and plain JSON
        const jsonString = content.replace(/```json\n?([\s\S]*?)\n?```/g, '$1');
        return JSON.parse(jsonString);
    } catch (e) {
        return null;
    }
}
 

private async handleFunctionCall(functionCall: any, horarios: string[]): Promise<string> {
    const {name, arguments: args} = functionCall;
    
    if (name === "criarAgendamento") {
        try {
            const parsedArgs = JSON.parse(args);
            return this.handleAgendamento(parsedArgs, horarios);
        } catch (error) {
            console.error('Function arguments parse error:', error);
            return "Ocorreu um erro ao processar seu agendamento.";
        }
    }
    
    return "Função não reconhecida.";
}

private async handleAgendamento(args: any, horarios: string[]): Promise<string> {
    // Normalize parameter names and values
    console.log('parametros do agendamento ', args)
    const agendamentoParams = {
        nomePaciente: args.nome_completo || args.nomePaciente,
        data: this.formatDate(args.data_agendamento || args.data),
        horarioInicio: args.horario_inicio || args.horarioInicio,
        horarioFim: args.horario_fim || args.horarioFim,
        modalidade: this.normalizeModalidade(args.modalidade)
    };
    console.log('parametros do agendamento ', agendamentoParams)
    // Validate required parameters
    if (!agendamentoParams.nomePaciente || 
        !agendamentoParams.data || 
        !agendamentoParams.horarioInicio || 
        !agendamentoParams.horarioFim || 
        !agendamentoParams.modalidade) {
        return "Faltam informações para o agendamento. Por favor forneça: nome completo, data, horário e modalidade.";
    }

    // Validate time slot
    if (!this.isSlotAvailable(agendamentoParams.data, agendamentoParams.horarioInicio, horarios)) {
        return "Desculpe, esse horário não está disponível. Por favor escolha outro.";
    }

    // Create appointment
    try {
        const eventLink = await this.agendaService.criarEvento(agendamentoParams);
        return `Agendamento confirmado para ${agendamentoParams.nomePaciente} em ${this.formatDisplayDate(agendamentoParams.data)} das ${agendamentoParams.horarioInicio} às ${agendamentoParams.horarioFim} (${agendamentoParams.modalidade}).`;
    } catch (error) {
        console.error('Agendamento error:', error);
        return "Erro ao criar agendamento. Por favor tente novamente.";
    }
}

// Helper methods
private formatDate(inputDate: string): string {
    // Convert from DD/MM/YYYY to YYYY-MM-DD
    const [day, month, year] = inputDate.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

private formatDisplayDate(isoDate: string): string {
    // Convert from YYYY-MM-DD to DD/MM/YYYY for display
    const [year, month, day] = isoDate.split('-');
    return `${day}/${month}/${year}`;
}

private normalizeModalidade(modalidade: string): "Presencial" | "Online" {
    const lower = modalidade.toLowerCase();
    return lower === 'presencial' ? 'Presencial' : 'Online';
}
private isSlotAvailable(date: string, time: string, availableSlots: string[]): boolean {
    // Implement your slot validation logic here
    return availableSlots.some(slot => slot.includes(time));
}

  

  async initializeBot(userNumber: string) {
    //await this.sendWhatsAppMessage(userNumber, "Bot inicializado com sucesso!");
  }
}
