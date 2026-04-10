import { randomUUID } from 'crypto';
import {Message} from '../models/types';
import { sendToQueue, MESSAGE_QUEUE } from '../storage/rabbitmq';
import { checkConversationExists, checkUserExists, deleteMessageFRomDB, insertMessageIntoDB, selectMessagesByConversationId } from '../repositories/messageRepository';

export const sendMessage = async(conversationId: string, senderId: string, text: string, status: 'sent' | 'delivered' | 'read' | 'reported' | 'hidden' | 'verified' = 'sent'): Promise<Message> => {

        const userExists = await checkUserExists(senderId);
        if(!userExists) throw new Error('User does not exist');

        const conversationExists = await checkConversationExists(conversationId);
        if(!conversationExists) throw new Error('Conversation does not exist');

    const message: Message = {
        id: randomUUID(),
        status,
        conversationId,
        senderId,
        text,
        createdAt: Date.now(),
    };

    await insertMessageIntoDB(message);

    await sendToQueue(MESSAGE_QUEUE, {
        event: 'MESSAGE_SENT', 
        messageId: message.id,
        conversationId: conversationId,
        timestamp: Date.now()
    });

    return message;
};

export const getMessages = async (conversationId: string): Promise<Message[]> => {

    const rows = await selectMessagesByConversationId(conversationId);

    const messages = rows.map(row => {
        if(row.status === 'hidden') {
            return { ...row, text: '*** This message was hidden by a moderator ***'};
        }
        return row;
    });

    return messages as Message[];
};

export const deleteMessage = async(messageId: string, senderId: string) => {

    const conversationId = await deleteMessageFRomDB(messageId, senderId);

    if(!conversationId)
        throw new Error("Message not found or access denied.");

    await sendToQueue(MESSAGE_QUEUE, {
        event: 'MESSAGE_DELETED',
        data: {
            messageId,
            conversationId,
            deletedBy: senderId,
            timeStamp: Date.now()
        }
    });
};