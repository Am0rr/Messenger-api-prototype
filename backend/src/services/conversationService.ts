import {v4 as uuidv4} from 'uuid';
import {Conversation} from '../models/types';
import {pool} from '../storage/db';
import {validateNotEmpty} from '../validators/inputValidator';

export const createConversation = async (type: 'direct' | 'group' = 'direct'): Promise<Conversation> => {
    const id = uuidv4();
    await pool.query('INSERT INTO conversations (id, type) VALUES ($1, $2)', [id, type])

    return {id, type};
};