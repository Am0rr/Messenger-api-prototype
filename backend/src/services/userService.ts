import { randomUUID } from 'crypto';
import {User} from '../models/types';
import {pool} from '../storage/db';
import {validateNotEmpty} from '../validators/inputValidator';

export const createUser = async (name: string): Promise<User> => {
    validateNotEmpty(name, "User name");

    const id = randomUUID();
    await pool.query('INSERT INTO users (id, name) VALUES ($1, $2)', [id, name]);

    return {id, name};
};