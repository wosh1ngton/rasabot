import { Conversation } from "../models/Conversation";
import { IMessage } from "../models/Conversation";

export class DatabaseService {
  async upsertConversation(
    userId: string,
    update: {      
      message?: IMessage;      
      metadata?: {
        nameLastAsked?: Date;
        lastUpdated?: Date;        
      };
    }
  ) {
    
    const updateQuery: any = {
      $set: {
        "metadata.lastUpdated": new Date(), 
      },
      $setOnInsert: {
        "metadata.createdAt": new Date(), 
        "metadata.expiresAt": new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    };   
    

    if (update.message) {
      updateQuery.$push = { messages: update.message };
    }
    
    return Conversation.findOneAndUpdate({ userId }, updateQuery, {
      upsert: true,
      new: true,
    });
  }


  async getChatHystory(userId: string) {
    return Conversation.findOne({ userId })
      .select("userId messages")
      .lean(); 
  } 

  
  async addMessage(userId: string, message: IMessage) {
    return this.upsertConversation(userId, { message });
  }
}

export const databaseService = new DatabaseService();
