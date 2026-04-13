import { createReport, takeReportInWork, resolveAndHideMessage, rejectReport } from '../../src/services/reportService';
import * as reportRepository from '../../src/repositories/reportRepository';
import { REPORT_QUEUE, sendToQueue } from '../../src/storage/rabbitmq';

jest.mock('../../src/repositories/reportRepository');

jest.mock('../../src/storage/rabbitmq', () => ({
    sendToQueue: jest.fn(),
    REPORT_QUEUE: 'report_queue',
}));

describe('Report Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createReport', () => {
        const messageId = '123e4567-e89b-12d3-a456-426614174000';
        const conversationId = '123e4567-e89b-12d3-a456-426614174001';
        const senderId = '123e4567-e89b-12d3-a456-426614174002';
        const text = 'Spam content';
        const status = 'unsolved';

        it('should create a report, update message status, and send to RabbitMQ on success', async() => {
            (reportRepository.checkMessageExists as jest.Mock).mockResolvedValue(true);
            (reportRepository.checkUserExists as jest.Mock).mockResolvedValue(true);
            (reportRepository.checkConversationExists as jest.Mock).mockResolvedValue(true);
            (reportRepository.createReportTransaction as jest.Mock).mockResolvedValue(undefined);

            await createReport(messageId, conversationId, senderId, text, status);

            expect(reportRepository.createReportTransaction).toHaveBeenCalledTimes(1);
            expect(reportRepository.createReportTransaction).toHaveBeenCalledWith(
                expect.objectContaining({
                    messageId,
                    conversationId,
                    senderId,
                    text,
                    status
                })
            );

            expect(sendToQueue).toHaveBeenCalledWith(
                'report_queue', 
                expect.objectContaining({
                    event: 'REPORT_CREATED',
                    messageId: '123e4567-e89b-12d3-a456-426614174000',
                    reportId: expect.any(String),
                    timestamp: expect.any(Number)
                })
            );
        });

        it('should throw an error if database transaction fails', async() => {
            (reportRepository.checkMessageExists as jest.Mock).mockResolvedValue(true);
            (reportRepository.checkUserExists as jest.Mock).mockResolvedValue(true);
            (reportRepository.checkConversationExists as jest.Mock).mockResolvedValue(true);
    
            (reportRepository.createReportTransaction as jest.Mock).mockRejectedValue(new Error('Database explosion!'));

            await expect(
                createReport(messageId, conversationId, senderId, 'Spam', 'unsolved')
            ).rejects.toThrow('Database explosion!');

            expect(sendToQueue).not.toHaveBeenCalled();
        });
    });

    describe('takeReportInWork', () => {
        const reportId = '123e4567-e89b-12d3-a456-426614174099';

        it('should update report status to "solving" when success', async() => {
            (reportRepository.checkReportExists as jest.Mock).mockResolvedValue(true);

            await takeReportInWork(reportId);

            expect(reportRepository.updateReportStatus).toHaveBeenCalledWith(reportId);
        });

        it('should throw an error when report is not found', async() => {
            (reportRepository.checkReportExists as jest.Mock).mockResolvedValue(false);

            await expect(
                takeReportInWork(reportId)
            ).rejects.toThrow('Report does not exist');
        });
    });

    describe('resolveAndHideMessage', () => {
        const reportId = '123e4567-e89b-12d3-a456-426614174099';

        it('should call resolve transaction when success', async() => {
            (reportRepository.checkReportExists as jest.Mock).mockResolvedValue(true);

            await resolveAndHideMessage(reportId)

            expect(reportRepository.resolveAndHideTransaction).toHaveBeenCalledTimes(1);
            expect(reportRepository.resolveAndHideTransaction).toHaveBeenCalledWith(reportId);
        });

        it('should throw error if repository fails', async() => {
            (reportRepository.checkReportExists as jest.Mock).mockResolvedValue(true);
            (reportRepository.resolveAndHideTransaction as jest.Mock).mockRejectedValue(new Error('Database explosion!'));
            
            await expect(resolveAndHideMessage(reportId)).rejects.toThrow('Database explosion!');
        });
    });

    describe('rejectReport', () => {
        const reportId = '123e4567-e89b-12d3-a456-426614174099';

        it('should call reject transaction when success', async() => {
            (reportRepository.checkReportExists as jest.Mock).mockResolvedValue(true);

            await rejectReport(reportId);
            
            expect(reportRepository.rejectReportTransaction).toHaveBeenCalledTimes(1);
            expect(reportRepository.rejectReportTransaction).toHaveBeenCalledWith(reportId);
        });

        it('should throw error if repository fails', async() => {
            (reportRepository.checkReportExists as jest.Mock).mockResolvedValue(true);
            (reportRepository.rejectReportTransaction as jest.Mock).mockRejectedValue(new Error('Database explosion!'));
            
            await expect(rejectReport(reportId)).rejects.toThrow('Database explosion!');
        });
    });
});

