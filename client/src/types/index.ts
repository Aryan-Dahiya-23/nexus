export interface Participant {
    _id: string;
    fullName: string;
    picture: string;
    email?: string;
}

export interface Message {
    _id?: string;
    senderId: Participant | string;
    content: string;
    type: 'text' | 'image' | 'video';
    seenBy: string[];
    createdAt?: string;
    updatedAt?: string;
}

export interface Conversation {
    _id: string;
    type: 'personal' | 'group';
    name?: string;
    participants: Participant[];
    messages: Message[];
    lastMessage?: Message;
    createdAt?: string;
    updatedAt?: string;
}

export interface UserConversationRef {
    conversation: Conversation;
    _id?: string;
}

export interface User {
    _id: string;
    fullName: string;
    email: string;
    picture: string;
    conversations: UserConversationRef[];
    googleId?: string;
    facebookId?: string;
    createdAt?: string;
    updatedAt?: string;
}
