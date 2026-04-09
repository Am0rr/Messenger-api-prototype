import request from 'supertest';
import express from 'express';
import { messageRouter } from '../../src/api/messageRoutes';
import { sendMessage, getMessages, deleteMessage } from '../../src/services/messageService';

jest.mock('../../src/services/messageService', () => ({
    sendMessage: jest.fn(),
    getMessages: jest.fn(),
    deleteMessage: jest.fn(),
}));

const app = express();
app.use(express.json());
app.use('/messages', messageRouter);

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    res.status(err.status || 500).json({ success: false, message: err.message });
});

describe('Message Router', () => {
    const mockConversationId = '123e4567-e89b-12d3-a456-426614174001';
    const mockSenderId = '123e4567-e89b-12d3-a456-426614174002';
    const mockMessageId = '123e4567-e89b-12d3-a456-426614174003';

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /', () => {
        it('should return 400 if validation fails (e.g. invalid senderId)', async () => {
            const res = await request(app)
                .post('/messages')
                .send({
                    conversationId: mockConversationId,
                    senderId: 'invalid-id', 
                    text: 'Hello'
                });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(sendMessage).not.toHaveBeenCalled();
        });

        it('should return 201 and send a message on success', async () => {
            const mockMessage = { id: mockMessageId, text: 'Hello', status: 'sent' };
            (sendMessage as jest.Mock).mockResolvedValue(mockMessage);

            const res = await request(app)
                .post('/messages')
                .send({
                    conversationId: mockConversationId,
                    senderId: mockSenderId,
                    text: 'Hello',
                    status: 'sent'
                });

            expect(res.status).toBe(201);
            expect(res.body).toEqual(mockMessage);
            expect(sendMessage).toHaveBeenCalledWith(mockConversationId, mockSenderId, 'Hello', 'sent');
        });

        it('should handle service errors and return 500', async () => {
            (sendMessage as jest.Mock).mockRejectedValue(new Error('DB Error'));

            const res = await request(app)
                .post('/messages')
                .send({
                    conversationId: mockConversationId,
                    senderId: mockSenderId,
                    text: 'Hello'
                });

            expect(res.status).toBe(500);
        });
    });

    describe('GET /:conversationId', () => {
        it('should return 200 and a list of messages on success', async () => {
            const mockMessagesList = [{ id: mockMessageId, text: 'Hello' }];
            (getMessages as jest.Mock).mockResolvedValue(mockMessagesList);

            const res = await request(app).get(`/messages/${mockConversationId}`);

            expect(res.status).toBe(200);
            expect(res.body).toEqual(mockMessagesList);
            expect(getMessages).toHaveBeenCalledWith(mockConversationId);
        });

        it('should handle service errors and return 500', async () => {
            (getMessages as jest.Mock).mockRejectedValue(new Error('DB Error'));

            const res = await request(app).get(`/messages/${mockConversationId}`);

            expect(res.status).toBe(500);
        });
    });

    describe('DELETE /:messageId', () => {
        it('should return 200 and a success message when deleted', async () => {
            (deleteMessage as jest.Mock).mockResolvedValue(undefined);

            const res = await request(app)
                .delete(`/messages/${mockMessageId}`)
                .send({ senderId: mockSenderId });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe("Message deleted.");
            expect(deleteMessage).toHaveBeenCalledWith(mockMessageId, mockSenderId);
        });

        it('should handle service errors and return 500', async () => {
            (deleteMessage as jest.Mock).mockRejectedValue(new Error('Access denied'));

            const res = await request(app)
                .delete(`/messages/${mockMessageId}`)
                .send({ senderId: mockSenderId });
                
            expect(res.status).toBe(500);
        });
    });
});