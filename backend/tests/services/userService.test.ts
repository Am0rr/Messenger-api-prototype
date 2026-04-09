import { createUser } from '../../src/services/userService';
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

    describe('createUser', () => {
        it('should successfully create user', async() => {
            (pool.query as jest.Mock).mockResolvedValue({rowCount: 1});

            await expect(createUser('Benjamin')).resolves.toMatchObject({
                id: expect.any(String),
                name: 'Benjamin'
            });

            expect(pool.query).toHaveBeenCalledWith(
                expect.stringContaining(`INSERT INTO users`),
                [expect.any(String), 'Benjamin']
            );
        });
    });
});