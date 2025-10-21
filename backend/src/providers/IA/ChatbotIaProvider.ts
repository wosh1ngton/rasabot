export interface ChatbotIaProvider {
    sendMessage(message: string, context?: any): Promise<any>;
}