import {v4 as uuidv4 } from 'uuid';
import {Report} from '../models/types';
import {pool} from '../storage/db';
import {validateNotEmpty, validateUUID} from '../validators/inputValidator';

export const createReport = async(messageId: string, conversationId: string, senderId: string, text: string, status: 'solved' | 'solving' | 'unsolved'): Promise<string> => {
    validateNotEmpty(text, 'Message text');

    validateNotEmpty(messageId, 'Message ID');
    validateUUID(messageId, 'Message ID');

    validateNotEmpty(conversationId, 'Conversation ID');
    validateUUID(conversationId, 'Conversation ID');

    validateNotEmpty(senderId, 'Sender ID');
    validateUUID(senderId, 'Sender ID');

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const messageResult = await client.query('SELECT id FROM messages WHERE id = $1', [messageId]);
            if(messageResult.rowCount === 0) throw new Error('Message does not exist');

        const userResult = await client.query('SELECT id FROM users WHERE id = $1', [senderId]);
            if(userResult.rowCount === 0) throw new Error('User does not exist');

        const conversationResult = await client.query('SELECT id FROM conversations WHERE id = $1', [conversationId]);
            if(conversationResult.rowCount === 0) throw new Error('Conversation does not exist');

        const report: Report = {
            id: uuidv4(),
            status,
            messageId,
            conversationId,
            senderId,
            text,
            createdAt: Date.now(),
        };

        await client.query(
        `INSERT INTO reports (id, status, "messageId", "conversationId", "senderId", text, "createdAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [report.id, report.status, report.messageId, report.conversationId, report.senderId, report.text, report.createdAt]
        );

        await client.query(
            `UPDATE messages SET status = 'reported' WHERE id = $1`,
            [messageId]
        );

        await client.query('COMMIT');

        return 'Your report was created successfully.';
    } catch(error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

export const getReports = async(status: 'solved' | 'solving' | 'unsolved' = 'unsolved'): Promise<Report[]> => {
    validateNotEmpty(status, 'Status');

    const result = await pool.query(
        `SELECT * FROM reports WHERE status = $1 ORDER BY "createdAt" ASC`,
        [status]
    );

    return result.rows as Report[];
}

export const takeReportInWork = async(reportId: string): Promise<string> => {
    validateNotEmpty(reportId, "Report ID");
    validateUUID(reportId, "Report ID");

    const reportResult = await pool.query(`SELECT id FROM reports WHERE id = $1`, [reportId]);
        if(reportResult.rowCount === 0) throw new Error('Report does not exist');

    await pool.query(
        `UPDATE reports SET status = 'solving' WHERE id = $1`,
        [reportId]
    )

    return `Report ${reportId} was marked as 'solving'.`
}

export const resolveAndHideMessage = async(reportId: string): Promise<string> => {
    validateNotEmpty(reportId, "Report ID");
    validateUUID(reportId, "Report ID");

    const client = await pool.connect();

    try{
        await client.query('BEGIN');

        const reportResult = await client.query(`SELECT "messageId" FROM reports WHERE id = $1`,
            [reportId]
        );

        if(reportResult.rowCount === 0 ) throw new Error('Report does not exist');

        const messageId = reportResult.rows[0].messageId;

        await client.query(
            `UPDATE messages SET status = 'hidden' WHERE id = $1`,
            [messageId]
        )

        await client.query(
            `UPDATE reports SET status = 'solved' WHERE id = $1`,
            [reportId]
        )

        await client.query('COMMIT');

        return `Report ${reportId} was solved and the message was hidden.`;
    }catch(error){
        await client.query('ROLLBACK');
        throw error;
    } finally{
        client.release();
    }
}

export const rejectReport = async(reportId: string): Promise<string> => {
    validateNotEmpty(reportId, "Report ID");
    validateUUID(reportId, "Report ID");

        const client = await pool.connect();

    try{
        await client.query('BEGIN');

        const reportResult = await client.query(`SELECT "messageId" FROM reports WHERE id = $1`,
            [reportId]
        );

        if(reportResult.rowCount === 0 ) throw new Error('Report does not exist');

        const messageId = reportResult.rows[0].messageId;

        await client.query(
            `UPDATE messages SET status = 'verified' WHERE id = $1`,
            [messageId]
        )

        await client.query(
            `UPDATE reports SET status = 'solved' WHERE id = $1`,
            [reportId]
        )

        await client.query('COMMIT');

        return `Report ${reportId} was solved and the message was verified.`;
    }catch(error){
        await client.query('ROLLBACK');
        throw error;
    } finally{
        client.release();
    }
}