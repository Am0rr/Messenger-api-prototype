import { randomUUID } from 'crypto';
import {Conversation} from '../models/types';
import {pool} from '../storage/db';

export const createConversation = async (type: 'direct' | 'group' = 'direct'): Promise<Conversation> => {
    const id = randomUUID();
    await pool.query('INSERT INTO conversations (id, type) VALUES ($1, $2)', [id, type])

    return {id, type};
};