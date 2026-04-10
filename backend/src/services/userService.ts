import { randomUUID } from 'crypto';
import {User} from '../models/types';
import { insertUserIntoDB } from '../repositories/userRepository';

export const createUser = async (name: string): Promise<User> => {

    const id = randomUUID();
    await insertUserIntoDB(id, name);

    return {id, name};
};