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
    isDeleted?: boolean;
    deletedAt?: string;
    isEdited?: boolean;
    editedAt?: string;
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
    hasMore?: boolean;
    totalMessagesCount?: number;
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

export interface TypingUser {
    userId: string;
    userName: string;
    userPicture?: string;
}
