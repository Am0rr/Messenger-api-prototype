import request from 'supertest';
import express from 'express';
import { conversationRouter } from '../../src/api/conversationRoutes'; 
import { createConversation } from '../../src/services/conversationService';

jest.mock('../../src/services/conversationService', () => ({
    createConversation: jest.fn(),
}));

const app = express();
app.use(express.json());
app.use('/conversations', conversationRouter);

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    res.status(err.status || 500).json({ success: false, message: err.message });
});

describe('Conversation Router', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /', () => {
        it('should return 400 if validation fails (Zod Middleware)', async () => {
            const res = await request(app)
                .post('/conversations')
                .send({ type: 'invalid_type_123' }); 

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.errors).toBeDefined();
            
            expect(createConversation).not.toHaveBeenCalled();
        });

        it('should return 201 and the created conversation on success', async () => {
            const mockConversation = { 
                id: '123e4567-e89b-12d3-a456-426614174001', 
                type: 'direct' 
            };
            
            (createConversation as jest.Mock).mockResolvedValue(mockConversation);

            const res = await request(app)
                .post('/conversations')
                .send({ type: 'direct' });

            expect(res.status).toBe(201);
            expect(res.body).toEqual(mockConversation);
            
            expect(createConversation).toHaveBeenCalledTimes(1);
            expect(createConversation).toHaveBeenCalledWith('direct');
        });

        it('should handle service errors and return 500 via asyncHandler', async () => {
            (createConversation as jest.Mock).mockRejectedValue(new Error('Database error'));

            const res = await request(app)
                .post('/conversations')
                .send({ type: 'group' });

            expect(res.status).toBe(500);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Database error');
        });
    });
});