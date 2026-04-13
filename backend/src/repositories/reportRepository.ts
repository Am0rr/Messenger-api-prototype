import {pool} from '../storage/db';
import { Report } from '../../src/models/types';

export const checkMessageExists = async(messageId: string): Promise<boolean> => {
    const result = await pool.query('SELECT id FROM messages WHERE id = $1', [messageId]);
    return result.rowCount !== null && result.rowCount > 0;
};

export const checkUserExists = async(senderId: string): Promise<boolean> => {
    const result = await pool.query('SELECT id FROM users WHERE id = $1', [senderId]);
    return result.rowCount !== null && result.rowCount > 0;
};

export const checkConversationExists = async(conversationId: string): Promise<boolean> => {
    const result = await pool.query('SELECT id FROM conversations WHERE id = $1', [conversationId]);
    return result.rowCount !== null && result.rowCount > 0;
};

export const checkReportExists = async(reportId: string): Promise<boolean> => {
    const result = await pool.query('SELECT id FROM reports WHERE id = $1', [reportId]);
    return result.rowCount !== null && result.rowCount > 0;
};

export const createReportTransaction = async(report: Report): Promise<void> => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        await client.query(
            `INSERT INTO reports (id, status, "messageId", "conversationId", "senderId", text, "createdAt")
            VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [report.id, report.status, report.messageId, report.conversationId, report.senderId, report.text, report.createdAt]
        );

        await client.query(`UPDATE messages SET status = 'reported' WHERE id = $1`, [report.messageId]);
    
        await client.query('COMMIT');
    }catch(error) {
        await client.query('ROLLBACK');
        throw error;
    }finally {
        client.release();
    };
};

export const selectReportsByStatus = async(status: string): Promise<Report[]> => {
    const result = await pool.query(
        `SELECT * FROM reports WHERE status = $1 ORDER BY "createdAt" ASC`,
        [status]
    );

    return result.rows as Report[];
};

export const updateReportStatus = async(reportId: string): Promise<void> => {
    await pool.query(
        `UPDATE reports SET status = 'solving' WHERE id = $1`,
        [reportId]
    );
};

export const resolveAndHideTransaction = async(reportId: string): Promise<void> => {
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
        );

        await client.query(
            `UPDATE reports SET status = 'solved' WHERE id = $1`,
            [reportId]
        );

        await client.query('COMMIT');

    }catch(error){
        await client.query('ROLLBACK');
        throw(error);
    }finally{
        client.release();
    };
};

export const rejectReportTransaction = async(reportId: string): Promise<void> => {
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
        );

        await client.query(
            `UPDATE reports SET status = 'solved' WHERE id = $1`,
            [reportId]
        );

        await client.query('COMMIT');

    }catch(error){
        await client.query('ROLLBACK');
        throw(error);
    }finally{
        client.release();
    };
};