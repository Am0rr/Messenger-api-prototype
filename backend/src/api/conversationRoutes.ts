import {Router, Request, Response} from 'express';
import {asyncHandler} from '../utils/asyncHandler';
import {createConversation} from '../services/conversationService';


export const userRouter = Router();

userRouter.post('/', asyncHandler(async(req: Request, res: Response) => {
    const {type} = req.body;
    const conv = await createConversation(type);
    res.status(201).json(conv);
}));