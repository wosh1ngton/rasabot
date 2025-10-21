import { WhatsAppProvider } from "./WhatsAppProvider";
import twilio from "twilio";
import dotenv from "dotenv";
import { NextFunction, urlencoded } from 'express';

dotenv.config();

export class TwilioProvider implements WhatsAppProvider {
  private client: twilio.Twilio;
  public readonly webhookMiddleware: any[];

  constructor() {
    this.client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN,      
    );
   this.webhookMiddleware = [      
      urlencoded({ extended: false }),        
      process.env.NODE_ENV === "production"
        ? twilio.webhook()
        : (req: Request, res: Response, next: NextFunction) => next()
    ];
  }

  async sendMessage(to: string, message: string): Promise<void> {
    await this.client.messages.create({
      from: process.env.TWILIO_NUMBER,
      to: `whatsapp:${to}`,
      body: message,
    });
  }
}
