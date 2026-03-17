import {Pool} from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const pool = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

export const initDB = async() => {
    const client = await pool.connect();
    try{
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY,
                name VARCHAR(255) NOT NULL
            );

            CREATE TABLE IF NOT EXISTS converstions (
                id UUID PRIMARY KEY,
                type VARCHAR(50) NOT NULL
            );

            CREATE TABLE IF NOT EXISTS messages (
                id UUID PRIMARY KEY,
                "converationId" UUID REFERENCES conversations(id),
                "senderId" UUID REFERENCES users(id),
                text TEXT NOT NULL,
                "createdAt" BIGINT NOT NULL
            );
        `); 
    } catch(error) {
        throw new Error(`Failed to initialize database: ${error}`);
    } finally {
        client.release();
    }
}