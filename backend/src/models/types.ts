export interface User {
    id: string;
    name: string;
}

export interface Conversation {
    id: string;
    type: 'direct' | 'group';
}

export interface Message {
    id: string;
    conversationId: string;
    senderId: string;
    text: string;
    status: 'sent' | 'delivered' | 'read' | 'reported' | 'hidden' | 'verified';
    createdAt: number;
}

export interface Report {
    id: string;
    status: 'solved' | 'solving' | 'unsolved';
    text: string;
    conversationId: string;
    messageId: string;
    senderId: string;
    createdAt: number;
}
