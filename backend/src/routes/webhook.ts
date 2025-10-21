import { Router } from "express";
import { MessageService } from "../services/MessageService";
import { TwilioProvider } from "../providers/WhatsApp/TwilioProvider";
import { AgendaService } from "../services/agendaService";

export const createWhatsAppRouter = (messageService: MessageService, twilioProvider: TwilioProvider, agendaService: AgendaService) => {
  
  const router = Router();

  router.post('/webhook', ...twilioProvider.webhookMiddleware, async (req, res) => {
    try {
      
      const incomingUserMessage = req.body.Body;
      const sender = req.body.From.replace('whatsapp:', '');      
      
      let { botResponse, shouldReply} = await messageService.handleUserIncomingMessage(sender, incomingUserMessage); 
      shouldReply = false;
      if(shouldReply) {
        await messageService.sendWhatsAppMessage(sender, botResponse!);
      }
      res.status(200).send();

    } catch(error) {
      console.error('Erro ao processar a mensagem:', error);
      res.status(500).send();
    }
  });

  router.post("/schedule-event", async (req, res) => {
  try {
    const { nomePaciente, data, horarioInicio, horarioFim, modalidade } = req.body;
    const link = await agendaService.criarEvento({
      nomePaciente,
      data,
      horarioInicio,
      horarioFim,
      modalidade,
    });
    res.json({ eventLink: link });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to schedule event" });
  }
});

  return router;
};