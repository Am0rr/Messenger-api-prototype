import amqp from 'amqplib';
import dotenv from 'dotenv';

dotenv.config();

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
export const REPORT_QUEUE = 'report_queue';
export const MESSAGE_QUEUE = 'message_queue';

let channel: amqp.Channel;

export const connectRabbitMQ = async () => {
    try {
        const connection = await amqp.connect(RABBITMQ_URL);
        channel = await connection.createChannel();

        await channel.assertQueue(REPORT_QUEUE, {durable: true});
        await channel.assertQueue(MESSAGE_QUEUE, {durable: true});
    } catch (error) {
        throw new Error(`RabbitMQ connection failed: ${error}`);
    }
};

export const sendToQueue = (queueName: string, data: any) => {
    if(!channel) {
        throw new Error('RabbitMQ channel is not initialized');
    }

    const messageBuffer = Buffer.from(JSON.stringify(data));

    channel.sendToQueue(queueName, messageBuffer, {
        persistent: true
    });
};

