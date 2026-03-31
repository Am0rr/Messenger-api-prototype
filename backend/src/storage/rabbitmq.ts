import amqp from 'amqplib';
import dotenv from 'dotenv';
import {pool} from '../storage/db';

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

export const startMessageConsumer = async () => {
    if(!channel) return;

    channel.consume(MESSAGE_QUEUE, async(msg) => {
        if(msg !== null) {
            try {
                const data = JSON.parse(msg.content.toString());
                const {messageId} = data;

                await pool.query(
                    `UPDATE messages SET status = $1 WHERE id = $2`,
                    ['delivered', messageId]
                );

                channel.ack(msg);
            } catch {
                channel.nack(msg, false, true);
            }
        };
    });
};

export const startReportConsumer = async() => {
    if(!channel) return;

    channel.consume(REPORT_QUEUE, async(report) => {
        if(report !== null) {
            try {
                const data = JSON.parse(report.content.toString());
                const {reportId} = data;

                channel.ack(report);
            } catch {
                channel.nack(report, false, true);
            }
        };
    });
};

