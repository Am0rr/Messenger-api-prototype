import { Request, Response, NextFunction } from 'express';
import { ZodObject, ZodError } from 'zod';

export const validate = (schema: ZodObject<any, any>, source: 'body' | 'query' | 'params' = 'body') => {
    return(req: Request, res: Response, next: NextFunction) => {
        try {
            req[source] = schema.parse(req[source]);
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