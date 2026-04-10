import { randomUUID } from 'crypto';
import {Conversation} from '../models/types';
import { insertConversationIntoDB } from '../repositories/conversationRepository';

export const createConversation = async (type: 'direct' | 'group' = 'direct'): Promise<Conversation> => {
    const id = randomUUID();

    await insertConversationIntoDB(id, type);

    return {id, type};
};