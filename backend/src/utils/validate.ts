import { Request, Response, NextFunction } from 'express';
import { ZodObject, ZodError } from 'zod';

export const validate = (schema: ZodObject<any, any>) => {
    return async(req: Request, res: Response, next: NextFunction) => {
        try {
            const dataToValidate = {
                ...req.body,
                ...req.query,
                ...req.params
            };

            await schema.parse(dataToValidate);
            next(); 
        } catch(error) {
            if(error instanceof ZodError) {
                return res.status(400).json({
                    success: false,
                    message: "Validation failed",
                    errors: error.issues.map(err => ({
                        path: err.path.join('.'),
                        message: err.message
                    }))
                });
            }
            next(error);
        }
    }
}