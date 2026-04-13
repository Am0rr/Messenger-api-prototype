import { randomUUID } from 'crypto';
import {Conversation, ConversationType} from '../models/types';
import { insertConversationIntoDB } from '../repositories/conversationRepository';

export const createConversation = async (type: ConversationType = ConversationType.DIRECT): Promise<Conversation> => {
    const id = randomUUID();

    await insertConversationIntoDB(id, type);

    return {id, type};
};