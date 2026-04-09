import request from 'supertest';
import express from 'express';
import { reportRouter } from '../../src/api/reportRoutes';
import { 
    createReport, 
    getReports, 
    takeReportInWork, 
    resolveAndHideMessage, 
    rejectReport 
} from '../../src/services/reportService';

jest.mock('../../src/services/reportService', () => ({
    createReport: jest.fn(),
    getReports: jest.fn(),
    takeReportInWork: jest.fn(),
    resolveAndHideMessage: jest.fn(),
    rejectReport: jest.fn(),
}));

const app = express();
app.use(express.json());
app.use('/reports', reportRouter);

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    res.status(err.status || 500).json({ success: false, message: err.message });
});

describe('Report Router', () => {
    const mockMessageId = '123e4567-e89b-12d3-a456-426614174000';
    const mockConversationId = '123e4567-e89b-12d3-a456-426614174001';
    const mockSenderId = '123e4567-e89b-12d3-a456-426614174002';
    const mockReportId = '123e4567-e89b-12d3-a456-426614174099';

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /', () => {
        it('should return 400 if validation fails (missing fields)', async () => {
            const res = await request(app)
                .post('/reports')
                .send({ text: 'Spam' }); 

            expect(res.status).toBe(400);
            expect(createReport).not.toHaveBeenCalled();
        });

        it('should return 201 and create a report on success', async () => {
            const mockServiceResponse = { id: mockReportId, text: 'Spam' };
            (createReport as jest.Mock).mockResolvedValue(mockServiceResponse);

            const res = await request(app)
                .post('/reports')
                .send({
                    messageId: mockMessageId,
                    conversationId: mockConversationId,
                    senderId: mockSenderId,
                    text: 'Spam',
                    status: 'unsolved'
                });

            expect(res.status).toBe(201);
            expect(res.body).toEqual({ message: mockServiceResponse });
            expect(createReport).toHaveBeenCalledWith(
                mockMessageId, mockConversationId, mockSenderId, 'Spam', 'unsolved'
            );
        });

        it('should handle service errors and return 500', async () => {
            (createReport as jest.Mock).mockRejectedValue(new Error('DB Error'));

            const res = await request(app)
                .post('/reports')
                .send({
                    messageId: mockMessageId,
                    conversationId: mockConversationId,
                    senderId: mockSenderId,
                    text: 'Spam',
                    status: 'unsolved'
                });

            expect(res.status).toBe(500);
        });
    });

    describe('GET /', () => {
        it('should return 200 and a list of reports', async () => {
            const mockReports = [{ id: mockReportId, status: 'unsolved' }];
            (getReports as jest.Mock).mockResolvedValue(mockReports);

            const res = await request(app).get('/reports?status=unsolved');

            expect(res.status).toBe(200);
            expect(res.body).toEqual(mockReports);
            expect(getReports).toHaveBeenCalledWith('unsolved');
        });

        it('should return 500 on service error', async () => {
            (getReports as jest.Mock).mockRejectedValue(new Error('Error'));
            const res = await request(app).get('/reports');
            expect(res.status).toBe(500);
        });
    });

    describe('PUT /:reportId/take', () => {
        it('should return 400 if validation fails (e.g., invalid UUID)', async () => {
            const res = await request(app).put('/reports/invalid-id/take');
            expect(res.status).toBe(400);
            expect(takeReportInWork).not.toHaveBeenCalled();
        });

        it('should return 200 on success', async () => {
            const mockResponse = { id: mockReportId, status: 'solving' };
            (takeReportInWork as jest.Mock).mockResolvedValue(mockResponse);

            const res = await request(app).put(`/reports/${mockReportId}/take`);

            expect(res.status).toBe(200);
            expect(res.body).toEqual({ message: mockResponse });
            expect(takeReportInWork).toHaveBeenCalledWith(mockReportId);
        });

        it('should return 500 on service error', async () => {
            (takeReportInWork as jest.Mock).mockRejectedValue(new Error('Error'));
            const res = await request(app).put(`/reports/${mockReportId}/take`);
            expect(res.status).toBe(500);
        });
    });

    describe('PUT /:reportId/resolve', () => {
        it('should return 200 on success', async () => {
            const mockResponse = { id: mockReportId, status: 'solved' };
            (resolveAndHideMessage as jest.Mock).mockResolvedValue(mockResponse);

            const res = await request(app).put(`/reports/${mockReportId}/resolve`);

            expect(res.status).toBe(200);
            expect(res.body).toEqual({ message: mockResponse });
            expect(resolveAndHideMessage).toHaveBeenCalledWith(mockReportId);
        });

        it('should return 500 on service error', async () => {
            (resolveAndHideMessage as jest.Mock).mockRejectedValue(new Error('Error'));
            const res = await request(app).put(`/reports/${mockReportId}/resolve`);
            expect(res.status).toBe(500);
        });
    });

    describe('PUT /:reportId/reject', () => {
        it('should return 200 on success', async () => {
            const mockResponse = { id: mockReportId, status: 'solved' };
            (rejectReport as jest.Mock).mockResolvedValue(mockResponse);

            const res = await request(app).put(`/reports/${mockReportId}/reject`);

            expect(res.status).toBe(200);
            expect(res.body).toEqual({ message: mockResponse });
            expect(rejectReport).toHaveBeenCalledWith(mockReportId);
        });

        it('should return 500 on service error', async () => {
            (rejectReport as jest.Mock).mockRejectedValue(new Error('Error'));
            const res = await request(app).put(`/reports/${mockReportId}/reject`);
            expect(res.status).toBe(500);
        });
    });
});