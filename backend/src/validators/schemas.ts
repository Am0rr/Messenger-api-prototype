import {z} from 'zod';

export const CreateUserSchema = z.object({
    name: z.string().min(3, { message: "Username must be at least 3 characters."})
});

export const CreateConversationSchema = z.object({
    type: z.enum(['direct', 'group'], {message: "Conversation type must be either 'direct' or 'group'."})
});

export const SendMessageSchema = z.object({
    conversationId: z.string().uuid({message: "Invalid conversation ID type."}),
    senderId: z.string().uuid({message: "Invalid sender ID type."}),
    text: z.string().trim().min(1, { message: "Message cannot be empty."}),
    status: z.enum(['sent', 'delivered', 'read', 'reported', 'hidden', 'verified'], {
        message: "Invalid message status."
    }).optional().default('sent'),
});

export const GetMessagesSchema = z.object({
    conversationId: z.string().uuid({message: "Invalid conversation ID type."})
});

export const DeleteMessageSchema = z.object({
    messageId: z.string().uuid({message: "Invalid message ID type."}),
    senderId: z.string().uuid({message: "Invalid sender ID type."}),
});

export const CreateReportSchema = z.object({
    messageId: z.string().uuid({message: "Invalid message ID type."}),
    conversationId: z.string().uuid({message: "Invalid conversation ID type."}),
    senderId: z.string().uuid({message: "Invalid sender ID type."}),
    text: z.string().trim().min(1, { message: "Message cannot be empty."}),
    status: z.enum(['solved', 'solving', 'unsolved'], {
        message: "Invalid report status."
    }).optional().default('unsolved'),
});

export const GetReportsSchema = z.object({
    status: z.enum(['solved', 'solving', 'unsolved'], {
        message: "Invalid report status."
    }).optional().default('unsolved'),
});

export const TakeReportInWorkSchema = z.object({
    reportId: z.string().uuid({message: "Invalid report ID format."})
});

export const ResolveAndHideMessageSchema = z.object({
    reportId: z.string().uuid({message: "Invalid report ID format."})
});

export const RejectReportSchema = z.object({
    reportId: z.string().uuid({message: "Invalid report ID format."})
});