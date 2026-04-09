import { createConversation } from '../../src/services/conversationService';
import { pool } from '../../src/storage/db';

jest.mock('../../src/storage/db', () => ({
    pool: {
        query: jest.fn(),
    },
}));

describe('Conversation Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createConversation', () => {
        it('should successfully create conversation', async() => {
            (pool.query as jest.Mock).mockResolvedValue({rowCount: 1});

            await expect(createConversation('direct')).resolves.toMatchObject({
                id: expect.any(String),
                type: 'direct'
            });

            expect(pool.query).toHaveBeenCalledWith(
                expect.stringContaining(`INSERT INTO conversations`),
                [expect.any(String), 'direct']
            );
        });
    });
});