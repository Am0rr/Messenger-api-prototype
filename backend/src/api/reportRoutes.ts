import {Router, Request, Response} from 'express';
import {asyncHandler} from '../utils/asyncHandler';
import {createReport, getReports, takeReportInWork, resolveAndHideMessage, rejectReport} from '../services/reportService';

export const reportRouter = Router();

reportRouter.post('/', asyncHandler(async(req: Request, res: Response) => {
    const {messageId, conversationId, senderId, text, status} = req.body;
    const message = await createReport(messageId, conversationId, senderId, text, status);
    res.status(201).json({message});
}));

reportRouter.get('/', asyncHandler(async(req: Request, res: Response) => {
    const {status} = req.query;
    const typedStatus = status as 'solved' | 'solving' | 'unsolved' | undefined;
    const reports = await getReports(typedStatus);
    res.status(200).json(reports);
}));

reportRouter.put('/:reportId/take', asyncHandler(async(req: Request, res: Response) => {
    const {reportId} = req.params;
    const message = await takeReportInWork(reportId as string);
    res.status(200).json({message});
}));

reportRouter.put('/:reportId/resolve', asyncHandler(async(req: Request, res: Response) => {
    const {reportId} = req.params;
    const message = await resolveAndHideMessage(reportId as string);
    res.status(200).json({message});
}));

reportRouter.put('/:reportId/reject', asyncHandler(async(req: Request, res: Response) => {
    const {reportId} = req.params;
    const message = await rejectReport(reportId as string);
    res.status(200).json({message});
}));