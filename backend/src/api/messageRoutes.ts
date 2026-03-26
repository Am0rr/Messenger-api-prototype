import {Router, Request, Response} from 'express';
import {asyncHandler} from '../utils/asyncHandler';
import {sendMessage} from '../services/messageService';
import {getMessages} from '../services/messageService';

export const messageRouter = Router();

messageRouter.post('/', asyncHandler(async(req: Request, res: Response) => {
    const {conversationId, senderId, text, status} = req.body;
    const message = await sendMessage(conversationId, senderId, text, status);
    res.status(201).json(message);
}));

messageRouter.get('/:conversationId', asyncHandler(async (req: Request, res: Response) => {
    const {conversationId} = req.params;
    const messages = await getMessages(conversationId as string);
    res.status(200).json(messages);
}));