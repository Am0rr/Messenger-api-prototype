import {Router, Request, Response} from 'express';
import {asyncHandler} from '../utils/asyncHandler';
import {createReport, getReports, takeReportInWork, resolveAndHideMessage, rejectReport} from '../services/reportService';
import {validate} from '../utils/validate';
import { CreateReportSchema, GetReportsSchema, RejectReportSchema, ResolveAndHideMessageSchema, TakeReportInWorkSchema } from '../validators/schemas';
import { ReportStatus } from '../models/types';

export const reportRouter = Router();

reportRouter.post('/', validate(CreateReportSchema), asyncHandler(async(req: Request, res: Response) => {
    const {messageId, conversationId, senderId, text, status} = req.body;
    const message = await createReport(messageId, conversationId, senderId, text, status);
    res.status(201).json({message});
}));

reportRouter.get('/', validate(GetReportsSchema), asyncHandler(async(req: Request, res: Response) => {
    const {status} = req.query;
    const typedStatus = status as ReportStatus | undefined;
    const reports = await getReports(typedStatus);
    res.status(200).json(reports);
}));

reportRouter.put('/:reportId/take', validate(TakeReportInWorkSchema), asyncHandler(async(req: Request, res: Response) => {
    const {reportId} = req.params;
    const message = await takeReportInWork(reportId as string);
    res.status(200).json({message});
}));

reportRouter.put('/:reportId/resolve', validate(ResolveAndHideMessageSchema), asyncHandler(async(req: Request, res: Response) => {
    const {reportId} = req.params;
    const message = await resolveAndHideMessage(reportId as string);
    res.status(200).json({message});
}));

reportRouter.put('/:reportId/reject', validate(RejectReportSchema), asyncHandler(async(req: Request, res: Response) => {
    const {reportId} = req.params;
    const message = await rejectReport(reportId as string);
    res.status(200).json({message});
}));