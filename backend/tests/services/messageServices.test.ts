import { sendMessage, deleteMessage, getMessages } from '../../src/services/messageService';
import { pool } from '../../src/storage/db';
import { MESSAGE_QUEUE, sendToQueue } from '../../src/storage/rabbitmq';

jest.mock('../../src/storage/db', () => ({
    pool: {
        connect: jest.fn(),
        query: jest.fn(),
    },
}));

jest.mock('../../src/storage/rabbitmq', () => ({
    sendToQueue: jest.fn(),
    MESSAGE_QUEUE: 'message_queue',
}));

describe('Message Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (pool.query as jest.Mock).mockResolvedValue({ rowCount: 1 });
    });

    describe('sendMessage', () => {
        it('should successfully send a message', async() => {
            const conversationId = '123e4567-e89b-12d3-a456-426614174001';
            const senderId = '123e4567-e89b-12d3-a456-426614174002';

            const message = await sendMessage(conversationId, senderId, 'text', 'sent');

            expect(message).toBeDefined();
            expect(message.text).toBe('text');
            expect(message.conversationId).toBe(conversationId);

            expect(sendToQueue).toHaveBeenCalledWith(
                MESSAGE_QUEUE,
                expect.objectContaining({event: 'MESSAGE_SENT'})
            );
        });
    });

    describe('deleteMessage', () => {
        it("should successfully delete message", async() => {
            const messageId = '123e4567-e89b-12d3-a456-426614174001';
            const senderId = '123e4567-e89b-12d3-a456-426614174002';
            const mockConversationId = '123e4567-e89b-12d3-a456-426614174003';

            (pool.query as jest.Mock).mockResolvedValue({
                rowCount: 1,
                rows: [{conversationId: mockConversationId}]
            });

            await deleteMessage(messageId, senderId);

            expect(pool.query).toHaveBeenCalledWith(
                expect.stringContaining('DELETE FROM messages'),
                [messageId, senderId]
            );

            expect(sendToQueue).toHaveBeenCalledWith(
                MESSAGE_QUEUE,
                expect.objectContaining({
                    event: 'MESSAGE_DELETED',
                    data: expect.objectContaining({
                        messageId,
                        conversationId: mockConversationId,
                        deletedBy: senderId
                    })
                })
            )
        });

        it('should throw an error if message is not found or access denied', async() => {
            const messageId = '123e4567-e89b-12d3-a456-426614174001';
            const senderId = '123e4567-e89b-12d3-a456-426614174002';

            (pool.query as jest.Mock).mockResolvedValue({rowCount: 0, rows: []});

            await expect(
                deleteMessage(messageId, senderId)
            ).rejects.toThrow('Message not found or access denied.');

            expect(sendToQueue).not.toHaveBeenCalled();
        });
    });

    describe('getMessages', () => {

        it('should return messages and mask text for hidden messages', async () => {
            const conversationId = '123e4567-e89b-12d3-a456-426614174001';

            const mockRows = [
                {"id": '1', status: 'sent', text: 'Hello', conversationId},
                {"id": '2', status: 'hidden', text: 'Secret bad word', conversationId},
            ];

            (pool.query as jest.Mock).mockResolvedValue({rows: mockRows});

            const messages = await getMessages(conversationId);

            expect(pool.query).toHaveBeenCalledWith(
                expect.stringContaining(`SELECT * FROM messages WHERE "conversationId" = $1 ORDER BY "createdAt" ASC`),
                [conversationId]
            );

            expect(messages).toHaveLength(2);
            
            expect(messages[0].text).toBe('Hello');
            expect(messages[0].status).toBe('sent');

            expect(messages[1].text).toBe('*** This message was hidden by a moderator ***');
            expect(messages[1].status).toBe('hidden');
        });
    });
});