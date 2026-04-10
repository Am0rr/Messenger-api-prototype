import {pool} from '../storage/db';

export const insertConversationIntoDB = async(id: string, type: 'direct' | 'group') => {
    await pool.query('INSERT INTO conversations (id, type) VALUES ($1, $2)', [id, type]);
};