import {pool} from '../storage/db';

export const insertUserIntoDB = async(id: string, name: string) => {
    await pool.query('INSERT INTO users (id, name) VALUES ($1, $2)', [id, name]);
};