import { randomUUID } from 'crypto';
import {User} from '../models/types';
import {pool} from '../storage/db';

export const createUser = async (name: string): Promise<User> => {

    const id = randomUUID();
    await pool.query('INSERT INTO users (id, name) VALUES ($1, $2)', [id, name]);

    return {id, name};
};