import {v4 as uuidv4 } from 'uuid';
import {Message} from '../models/types';
import {pool} from '../storage/db';
import {validateNotEmpty, validateUUID} from '../validators/inputValidator';

export const sendMessage = async(conversationId: string, senderId: string, text: string, status: 'sent' | 'delivered' | 'read' | 'reported' | 'hidden' | 'verified' = 'sent'): Promise<Message> => {
    validateNotEmpty(text, 'Message text');

    validateNotEmpty(conversationId, 'Conversation ID');
    validateUUID(conversationId, 'COnversation ID');

    validateNotEmpty(senderId, 'Sender ID');
    validateUUID(senderId, 'Sender ID');

    const userResult = await pool.query('SELECT id FROM users WHERE id = $1', [senderId]);
        if(userResult.rowCount === 0) throw new Error('User does not exist');

    const conversationResult = await pool.query('SELECT id FROM conversations WHERE id = $1', [conversationId]);
        if(conversationResult.rowCount === 0) throw new Error('Conversation does not exist');

    const message: Message = {
        id: uuidv4(),
        status,
        conversationId,
        senderId,
        text,
        createdAt: Date.now(),
    };

    await pool.query(
        `INSERT INTO messages (id, status, "conversationId", "senderId", text, "createdAt")
        VALUES ($1, $2, $3, $4, $5, $6)`,
        [message.id, message.status, message.conversationId, message.senderId, message.text, message.createdAt]
    );

    return message;
};

export const getMessages = async (conversationId: string): Promise<Message[]> => {
    validateNotEmpty(conversationId, 'Conversation ID');
    validateUUID(conversationId, 'Conversation ID')

    const result = await pool.query(
        `SELECT * FROM messages WHERE "conversationId" = $1 ORDER BY "createdAt" ASC`,
        [conversationId]
    );

    const messages = result.rows.map(row => {
        if(row.status === 'hidden') {
            return { ...row, text: '*** This message was hidden by a moderator ***'};
        }
        return row;
    });

    return messages as Message[];
};