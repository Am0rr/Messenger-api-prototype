import express, { Request, Response, NextFunction } from 'express';
import { initDB } from './storage/db';
import { userRouter } from './api/userRoutes';
import { conversationRouter } from './api/conversationRoutes';
import { messageRouter } from './api/messageRoutes';
import { reportRouter } from './api/reportRoutes';
import { connectRabbitMQ, startMessageConsumer, startReportConsumer } from './storage/rabbitmq';

const app = express();
const PORT = 3000;

app.use(express.json());

app.use('/api/users', userRouter);
app.use('/api/conversations', conversationRouter);
app.use('/api/messages', messageRouter);
app.use('/api/reports', reportRouter);

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('[Error]: ', err.message);

    res.status(400).json({error: err.message});
});

const bootstrap = async () => {
    try {
    console.log('Connecting to database...');
    await initDB();
    await connectRabbitMQ();
    await startMessageConsumer();
    await startReportConsumer();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Fatal Error during startup:', error);
    process.exit(1);
  }
};

bootstrap();