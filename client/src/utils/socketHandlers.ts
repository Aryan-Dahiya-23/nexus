import { queryClient } from "../api/auth";
import { Conversation, Message, User, UserConversationRef } from "../types";

export const handleChatMessage = (
    user: User,
    newMessage: Message,
    conversationId: string
) => {
    const isConversationExists = user.conversations?.some(
        (conversation: UserConversationRef) => conversation.conversation?._id === conversationId
    );

    if (isConversationExists) {
        const conversation: Conversation | undefined = queryClient.getQueryData(['chats', conversationId]);

        queryClient.cancelQueries({ queryKey: ['chats', conversationId] });

        if (conversation && Array.isArray(conversation.messages)) {
            const alreadyExists = conversation.messages.some(
                (m) => (m._id && newMessage._id && m._id === newMessage._id) ||
                       (!m._id && m.content === newMessage.content && m.type === newMessage.type)
            );
            if (!alreadyExists) {
                const newConversation: Conversation = {
                    ...conversation,
                    messages: [...conversation.messages, newMessage],
                    lastMessage: newMessage,
                };
                queryClient.setQueryData(['chats', conversationId], newConversation);
            }
        }
    }
};

export const handleMessageSent = (user: User, userId: string, conversationId: string) => {
    const isConversationExists = user.conversations?.some(
        (conversation: UserConversationRef) => conversation.conversation?._id === conversationId
    );
    if (isConversationExists && userId !== user._id) {
        queryClient.invalidateQueries();
    }
};

export const handleSeenMessage = (id: string | undefined, conversationId: string) => {
    if (id && id === conversationId) {
        queryClient.invalidateQueries({ queryKey: ['chats', id] });
    }
};

export const handleNewConversation = (userId: string, currentUserId: string) => {
    if (userId === currentUserId) {
        queryClient.invalidateQueries({ queryKey: ['user'] });
    }
};

export const handleMessageEdited = (
    conversationId: string,
    updatedMessage: Message
) => {
    const conversation: Conversation | undefined = queryClient.getQueryData(['chats', conversationId]);
    if (conversation && Array.isArray(conversation.messages)) {
        const updatedMessages = conversation.messages.map((m: Message) =>
            m._id === updatedMessage._id ? { ...m, ...updatedMessage } : m
        );
        const lastMsg = conversation.lastMessage?._id === updatedMessage._id
            ? { ...conversation.lastMessage, ...updatedMessage }
            : conversation.lastMessage;

        queryClient.setQueryData(['chats', conversationId], {
            ...conversation,
            messages: updatedMessages,
            lastMessage: lastMsg
        });
    }
};

export const handleMessageDeleted = (
    conversationId: string,
    deletedMessage: Message
) => {
    const conversation: Conversation | undefined = queryClient.getQueryData(['chats', conversationId]);
    if (conversation && Array.isArray(conversation.messages)) {
        const updatedMessages = conversation.messages.map((m: Message) =>
            m._id === deletedMessage._id
                ? { ...m, isDeleted: true, content: 'This message was deleted', deletedAt: deletedMessage.deletedAt }
                : m
        );
        const lastMsg = conversation.lastMessage?._id === deletedMessage._id
            ? { ...conversation.lastMessage, isDeleted: true, content: 'This message was deleted', deletedAt: deletedMessage.deletedAt }
            : conversation.lastMessage;

        queryClient.setQueryData(['chats', conversationId], {
            ...conversation,
            messages: updatedMessages,
            lastMessage: lastMsg
        });
    }
};
