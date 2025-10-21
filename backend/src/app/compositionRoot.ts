import conectar from "../config/dbConnect";
// import { ChatGptProvider } from "../providers/IA/DeepSeekProvider";
import { DeepSeekProvider } from "../providers/IA/DeepSeekProvider";
import { TwilioProvider } from "../providers/WhatsApp/TwilioProvider";
import { createWhatsAppRouter } from "../routes/webhook";
import { AgendaService } from "../services/agendaService";
import { MessageService } from "../services/MessageService";

export function configureApp() {

    conectar().catch(console.error);

    const whatsAppProvider = new TwilioProvider();
    const iaProvider = new DeepSeekProvider();
    //const iaProvider = new ChatGptProvider();
    const agendaService = new AgendaService();
    const messageService = new MessageService(whatsAppProvider, iaProvider, agendaService);

    const whatsAppRouter = createWhatsAppRouter(messageService, whatsAppProvider, agendaService);
    return {
        whatsAppRouter,
        messageService,
        whatsAppProvider,
        agendaService 
    };

}