import { createReport, takeReportInWork, resolveAndHideMessage, rejectReport } from '../../src/services/reportService';
import { pool } from '../../src/storage/db';
import { REPORT_QUEUE, sendToQueue } from '../../src/storage/rabbitmq';

jest.mock('../../src/storage/db', () => ({
    pool: {
        connect: jest.fn(),
        query: jest.fn(),
    },
}));

jest.mock('../../src/storage/rabbitmq', () => ({
    sendToQueue: jest.fn(),
    REPORT_QUEUE: 'report_queue',
}));

describe('Report Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createReport', () => {
        it('should throw an error if text is empty', async() => {
            const messageId = '123e4567-e89b-12d3-a456-426614174000';
            const conversationId = '123e4567-e89b-12d3-a456-426614174001';
            const senderId = '123e4567-e89b-12d3-a456-426614174002';

            await expect(
                createReport(messageId, conversationId, senderId, '', 'unsolved')
            ).rejects.toThrow('Message text cannot be empty');
        });

        it('should throw an error if messageId is not a valid UUID', async() => {
            const invalidMessageId = 'invalid-uuid22ee2ee2e22';
            const conversationId = '123e4567-e89b-12d3-a456-426614174001';
            const senderId = '123e4567-e89b-12d3-a456-426614174002';

            await expect(
                createReport(invalidMessageId, conversationId, senderId, 'text', 'unsolved')
            ).rejects.toThrow(`Inalid UUID format`);
        });

        it('should create a report, update message status, and send to RabbitMQ on success', async() => {
            const messageId = '123e4567-e89b-12d3-a456-426614174000';
            const conversationId = '123e4567-e89b-12d3-a456-426614174001';
            const senderId = '123e4567-e89b-12d3-a456-426614174002';
            const text = 'Spam content';
            const status = 'unsolved';

            const mockClient = {
                query: jest.fn().mockResolvedValue({rowCount: 1}),
                release: jest.fn(),
            };

            (pool.connect as jest.Mock).mockResolvedValue(mockClient);

            await createReport(messageId, conversationId, senderId, text, status);

            expect(pool.connect).toHaveBeenCalledTimes(1);

            expect(mockClient.query).toHaveBeenCalledWith('BEGIN');

            expect(mockClient.query).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO reports'),
                expect.any(Array)
            );

            expect(mockClient.query).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE messages SET status'),
                expect.any(Array)
            );

            expect(mockClient.query).toHaveBeenCalledWith('COMMIT');

            expect(sendToQueue).toHaveBeenCalledWith(
                'report_queue', 
                expect.objectContaining({
                    event: 'REPORT_CREATED',
                    messageId: '123e4567-e89b-12d3-a456-426614174000',
                    reportId: expect.any(String),
                    timestamp: expect.any(Number)
                })
            );
            
            expect(mockClient.release).toHaveBeenCalledTimes(1);
        });

        it('should rollback transaction and release client if a database error occurs', async() => {
            const messageId = '123e4567-e89b-12d3-a456-426614174000';
            const conversationId = '123e4567-e89b-12d3-a456-426614174001';
            const senderId = '123e4567-e89b-12d3-a456-426614174002';
            
            const mockClient = {
                query: jest.fn().mockImplementation(async(queryText: string) => {
                    if(queryText === 'BEGIN') return {};
                    if(queryText === 'COMMIT') return {};
                    throw new Error('Database explosion!');
                }),
                release: jest.fn(),
            };
            
            (pool.connect as jest.Mock).mockResolvedValue(mockClient);

            await expect(
                createReport(messageId, conversationId, senderId, 'Spam', 'unsolved')
            ).rejects.toThrow('Database explosion!');

            expect(pool.connect).toHaveBeenCalledTimes(1);

            expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
            expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');

            expect(mockClient.release).toHaveBeenCalledTimes(1);

            expect(sendToQueue).not.toHaveBeenCalled();
        });
    });

    describe('takeReportInWork', () => {
        it('should update report status to "solving" when success', async() => {
            const reportId = '123e4567-e89b-12d3-a456-426614174099';

            (pool.query as jest.Mock).mockResolvedValue({ rowCount: 1 });

            await takeReportInWork(reportId);

            expect(pool.query).toHaveBeenCalledWith(
                expect.stringContaining("UPDATE reports SET status = 'solving'"),
                [reportId]
            );
        });

        it('should throw an error when report is not found', async() => {
            const reportId = '123e4567-e89b-12d3-a456-426614174099';

            (pool.query as jest.Mock).mockResolvedValue({ rowCount: 0 });

            await expect(
                takeReportInWork(reportId)
            ).rejects.toThrow('Report does not exist');
        });
    });

    describe('resolveAndHideMessage', () => {
        it('should update report and messge status when success', async() => {
            const reportId = '123e4567-e89b-12d3-a456-426614174099';
            const messageId = '119e4567-e89b-12d3-a456-426614174050';

            const mockClient = {
                query: jest.fn().mockResolvedValue({
                    rowCount: 1,
                    rows: [{ messageId: messageId }]
                }),
                release: jest.fn(),
            };

            (pool.connect as jest.Mock).mockResolvedValue(mockClient);

            await resolveAndHideMessage(reportId)

            expect(pool.connect).toHaveBeenCalledTimes(1);

            expect(mockClient.query).toHaveBeenCalledWith('BEGIN');

            expect(mockClient.query).toHaveBeenCalledWith(
                expect.stringContaining("UPDATE messages SET status = 'hidden'"), 
                [messageId]
            );

            expect(mockClient.query).toHaveBeenCalledWith(
                expect.stringContaining("UPDATE reports SET status = 'solved'"),
                [reportId]
            );

            expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
            
            expect(mockClient.release).toHaveBeenCalledTimes(1);
        });

        it('should rollback transaction and release client if a database error occurs', async() => {
            const reportId = '123e4567-e89b-12d3-a456-426614174099';
            
            const mockClient = {
                query: jest.fn().mockImplementation(async(queryText: string) => {
                    if(queryText === 'BEGIN') return {};
                    if(queryText === 'COMMIT') return {};
                    throw new Error('Database explosion!');
                }),
                release: jest.fn(),
            };
            
            (pool.connect as jest.Mock).mockResolvedValue(mockClient);

            await expect(
                resolveAndHideMessage(reportId)
            ).rejects.toThrow('Database explosion!');

            expect(pool.connect).toHaveBeenCalledTimes(1);

            expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
            expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');

            expect(mockClient.release).toHaveBeenCalledTimes(1);

            expect(sendToQueue).not.toHaveBeenCalled();
        });
    });

    describe('rejectReport', () => {
        it('should update report and messge status when success', async() => {
            const reportId = '123e4567-e89b-12d3-a456-426614174099';
            const messageId = '119e4567-e89b-12d3-a456-426614174050';

            const mockClient = {
                query: jest.fn().mockResolvedValue({
                    rowCount: 1,
                    rows: [{ messageId: messageId }]
                }),
                release: jest.fn(),
            };

            (pool.connect as jest.Mock).mockResolvedValue(mockClient);

            await rejectReport(reportId);

            expect(mockClient.query).toHaveBeenCalledWith('BEGIN');

            expect(mockClient.query).toHaveBeenCalledWith(
                expect.stringContaining("UPDATE messages SET status = 'verified'"),
                [messageId]
            );

            expect(mockClient.query).toHaveBeenCalledWith(
                expect.stringContaining("UPDATE reports SET status = 'solved'"),
                [reportId]
            );

            expect(mockClient.query).toHaveBeenCalledWith('COMMIT');

            expect(mockClient.release).toHaveBeenCalledTimes(1);
        });

        it('should rollback transaction and release client if a database error occurs', async() => {
            const reportId = '123e4567-e89b-12d3-a456-426614174099';
            
            const mockClient = {
                query: jest.fn().mockImplementation(async(queryText: string) => {
                    if(queryText === 'BEGIN') return {};
                    if(queryText === 'COMMIT') return {};
                    throw new Error('Database explosion!');
                }),
                release: jest.fn(),
            };
            
            (pool.connect as jest.Mock).mockResolvedValue(mockClient);

            await expect(
                rejectReport(reportId)
            ).rejects.toThrow('Database explosion!');

            expect(pool.connect).toHaveBeenCalledTimes(1);

            expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
            expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');

            expect(mockClient.release).toHaveBeenCalledTimes(1);

            expect(sendToQueue).not.toHaveBeenCalled();
        });
    });
});

