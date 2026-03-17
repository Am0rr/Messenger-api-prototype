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
    createdAt: number;
}
