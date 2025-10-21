import express from 'express';
import { configureApp } from './compositionRoot';

export async function startServer() {

    const app = express();    
    app.use(express.json());

    const { whatsAppRouter, messageService } = configureApp();
    
    app.use('/whatsapp', whatsAppRouter);       
    
    const PORT = process.env.PORT || 3000;
    const server = app.listen(PORT, () => {
        console.log(`Server está rodando na porta ${PORT}`);
        console.log(`Webhook URL: http://localhost:${PORT}/whatsapp/webhook`);
    });

    return { server, messageService }
}