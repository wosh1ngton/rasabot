import { ChatbotIaProvider } from "./ChatbotIaProvider";

export class ChatGptProvider implements ChatbotIaProvider {
  private apiKey: string | undefined;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.CHATGPT_API_KEY;
    this.baseUrl = "https://api.openai.com/v1/chat/completions";;
  }  

  async sendMessage(message: string, context?: any): Promise<any> {
    try {     

      const response = await fetch(`${this.baseUrl}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4",
          messages: [
            {
              role: "user",
              content: message, 
            },

          ],
          temperature: 0.5,  
          functions: [
            {
              name: "criarAgendamento",
              description: "Agendar um horário para um paciente",
              parameters: {
                type: "object",
                properties: {
                  nomePaciente: { type: "string" },
                  data: { type: "string", format: "date" },
                  horarioInicio: { type: "string", pattern: "^\\d{2}:\\d{2}$" },
                  horarioFim: { type: "string", pattern: "^\\d{2}:\\d{2}$" },
                  modalidade: { type: "string", enum: ["PRESENCIAL", "ONLINE"] },
                },
                required: ["nomePaciente", "data", "horarioInicio", "horarioFim", "modalidade"],
              },
            },
          ], 
          function_call: {name: "criarAgendamento"},
          ...context,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0].message;      

    } catch (error) {
      console.error("Error ao chamar a API do OpenAI: ", error);
      throw error;
    }
  }
}
