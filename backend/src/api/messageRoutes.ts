import {Router, Request, Response} from 'express';
import {asyncHandler} from '../utils/asyncHandler';
import {deleteMessage, sendMessage} from '../services/messageService';
import {getMessages} from '../services/messageService';
import { SendMessageSchema, GetMessagesSchema, DeleteMessageSchema } from '../validators/schemas';
import {validate} from '../utils/validate';

export const messageRouter = Router();

messageRouter.post('/', validate(SendMessageSchema), asyncHandler(async(req: Request, res: Response) => {
    const {conversationId, senderId, text, status} = req.body;
    const message = await sendMessage(conversationId, senderId, text, status);
    res.status(201).json(message);
}));

messageRouter.get('/:conversationId', validate(GetMessagesSchema), asyncHandler(async (req: Request, res: Response) => {
    const {conversationId} = req.params;
    const messages = await getMessages(conversationId as string);
    res.status(200).json(messages);
}));

messageRouter.delete('/:messageId', validate(DeleteMessageSchema), asyncHandler(async (req: Request, res: Response) => {
    const {messageId} = req.params;
    const {senderId} = req.body;
    await deleteMessage(messageId as string, senderId as string)
    res.status(200).json({
        success: true,
        message: "Message deleted."
    });
}));