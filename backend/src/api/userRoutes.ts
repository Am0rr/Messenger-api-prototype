import {Router, Request, Response} from 'express';
import {asyncHandler} from '../utils/asyncHandler';
import {createUser} from '../services/userService';
import {validate} from '../utils/validate';
import { CreateUserSchema } from '../validators/schemas';

export const userRouter = Router();

userRouter.post('/', validate(CreateUserSchema), asyncHandler(async(req: Request, res: Response) => {
    const {name} = req.body;
    const user = await createUser(name);
    res.status(201).json(user);
}));