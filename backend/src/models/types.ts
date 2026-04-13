export enum ConversationType {
    DIRECT = 'direct',
    GROUP = 'group'
}

export enum MessageStatus {
    SENT = 'sent',
    DELIVERED = 'delivered',
    READ = 'read',
    REPORTED = 'reported',
    HIDDEN = 'hidden',
    VERIFIED = 'verified'
}

export enum ReportStatus {
    SOLVED = 'solved',
    SOLVING = 'solving',
    UNSOLVED = 'unsolved'
}

export interface User {
    id: string;
    name: string;
}

export interface Conversation {
    id: string;
    type: ConversationType;
}

export interface Message {
    id: string;
    conversationId: string;
    senderId: string;
    text: string;
    status: MessageStatus;
    createdAt: number;
}

export interface Report {
    id: string;
    status: ReportStatus;
    text: string;
    conversationId: string;
    messageId: string;
    senderId: string;
    createdAt: number;
}
