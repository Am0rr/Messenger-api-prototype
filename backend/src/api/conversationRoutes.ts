import {Router, Request, Response} from 'express';
import {asyncHandler} from '../utils/asyncHandler';
import {createConversation} from '../services/conversationService';
import {validate} from '../utils/validate';
import { CreateConversationSchema } from '../validators/schemas';

export const conversationRouter = Router();

conversationRouter.post('/', validate(CreateConversationSchema), asyncHandler(async(req: Request, res: Response) => {
    const {type} = req.body;
    const conv = await createConversation(type);
    res.status(201).json(conv);
}));