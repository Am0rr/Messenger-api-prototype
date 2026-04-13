import { randomUUID } from 'crypto';
import {Report} from '../models/types';
import { sendToQueue, REPORT_QUEUE } from '../storage/rabbitmq';
import {
    checkMessageExists,
    checkUserExists,
    checkConversationExists,
    selectReportsByStatus,
    checkReportExists,
    updateReportStatus,
    createReportTransaction,
    resolveAndHideTransaction,
    rejectReportTransaction,
} from '../repositories/reportRepository'

export const createReport = async(messageId: string, conversationId: string, senderId: string, text: string, status: 'solved' | 'solving' | 'unsolved' = 'unsolved'): Promise<string> => {

    const messageExists = await checkMessageExists(messageId);
    if(!messageExists) throw new Error('Message does not exist');

    const userExists = await checkUserExists(senderId);
    if(!userExists) throw new Error('User does not exist');

    const conversationExists = await checkConversationExists(conversationId);
    if(!conversationExists) throw new Error('Conversation does not exist');

    const report: Report = {
        id: randomUUID(),
        status,
        messageId,
        conversationId,
        senderId,
        text,
        createdAt: Date.now(),
    };

    await createReportTransaction(report);

    await sendToQueue(REPORT_QUEUE, {
        event: 'REPORT_CREATED', 
        reportId: report.id,
        messageId: messageId,
        timestamp: Date.now()
    });

    return 'Your report was created successfully.';
};

export const getReports = async(status: 'solved' | 'solving' | 'unsolved' = 'unsolved'): Promise<Report[]> => {
    return selectReportsByStatus(status);
};

export const takeReportInWork = async(reportId: string): Promise<string> => {

    const reportExists = await checkReportExists(reportId);
    if(!reportExists) throw new Error('Report does not exist');

    await updateReportStatus(reportId);

    return `Report ${reportId} was marked as 'solving'.`
};

export const resolveAndHideMessage = async(reportId: string): Promise<string> => {
    const reportExists = await checkReportExists(reportId);
    if(!reportExists) throw new Error('Report does not exist');
    
    await resolveAndHideTransaction(reportId);

    return `Report ${reportId} was solved and the message was hidden.`;
};

export const rejectReport = async(reportId: string): Promise<string> => {
    const reportExists = await checkReportExists(reportId);
    if(!reportExists) throw new Error('Report does not exist');

    await rejectReportTransaction(reportId);

    return `Report ${reportId} was solved and the message was verified.`;
};