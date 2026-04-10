import {pool} from '../storage/db';
import { Message } from '../../src/models/types';
import { NullSchema } from 'zod/v4/core/json-schema.cjs';

export const checkUserExists = async(senderId: string): Promise<boolean> => {
    const result = await pool.query('SELECT id FROM users WHERE id = $1', [senderId]);
    return result.rowCount !== null && result.rowCount > 0;
};

export const checkConversationExists = async(conversationId: string): Promise<boolean> => {
    const result = await pool.query('SELECT id FROM conversations WHERE id = $1', [conversationId]);
    return result.rowCount !== null && result.rowCount > 0;
};

export const insertMessageIntoDB = async(message: Message): Promise<void> => {
    await pool.query(`INSERT INTO messages (id, status, "conversationId", "senderId", text, "createdAt")
        VALUES ($1, $2, $3, $4, $5, $6)`,
        [message.id, message.status, message.conversationId, message.senderId, message.text, message.createdAt]
    );
};

export const selectMessagesByConversationId = async(conversationId: string): Promise<Message[]> => {
        const result = await pool.query(
        `SELECT * FROM messages WHERE "conversationId" = $1 ORDER BY "createdAt" ASC`,
        [conversationId]
    );

    return result.rows as Message[];
};

export const deleteMessageFRomDB = async(messageId: string, senderId: string): Promise<string | null> => {
    const result = await pool.query(
        `DELETE FROM messages WHERE id = $1 AND "senderId" = $2 RETURNING "conversationId"`,
        [messageId, senderId]
    );

    if (result.rowCount === 0) return null;
    return result.rows[0].conversationId;
};