import request from 'supertest';
import express from 'express';
import { userRouter } from '../../src/api/userRoutes';
import { createUser } from '../../src/services/userService';

jest.mock('../../src/services/userService', () => ({
    createUser: jest.fn(),
}));

const app = express();
app.use(express.json());
app.use('/users', userRouter);

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    res.status(err.status || 500).json({success: false, message: err.message});
});

describe('User Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /', () => {
        it('should return 400 if validation fails (Zod Middleware)', async() => {
            const res = await request(app)
                .post('/users')
                .send({});

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.errors).toBeDefined();

            expect(createUser).not.toHaveBeenCalled();
        });

        it('should retrun 201 and the created user on success', async() => {
            const mockUser = { id: '123e4567-e89b-12d3-a456-426614174000', name: 'Alex' };
            
            (createUser as jest.Mock).mockResolvedValue(mockUser);

            const res = await request(app)
                .post('/users')
                .send({ name: 'Alex' });

            expect(res.status).toBe(201);
            expect(res.body).toEqual(mockUser);
            
            expect(createUser).toHaveBeenCalledTimes(1);
            expect(createUser).toHaveBeenCalledWith('Alex');
        });

        it('should handle service errors and return 500 via asyncHandler', async () => {
            (createUser as jest.Mock).mockRejectedValue(new Error('Database connection lost'));

            const res = await request(app)
                .post('/users')
                .send({ name: 'Alex' });

            expect(res.status).toBe(500);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Database connection lost');
        });
    });
});
