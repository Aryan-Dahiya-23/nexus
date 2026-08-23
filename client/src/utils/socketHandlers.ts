import { toast } from "react-toastify";
import { queryClient } from "../api/auth";
import { Conversation, Message, User, UserConversationRef } from "../types";

export const handleChatMessage = (
    user: User,
    newMessage: Message,
    conversationId: string,
    toastNotification: boolean
) => {
    const isConversationExists = user.conversations?.some(
        (conversation: UserConversationRef) => conversation.conversation?._id === conversationId
    );

    if (isConversationExists) {
        const senderName = typeof newMessage.senderId === 'object' && newMessage.senderId !== null ? newMessage.senderId.fullName : 'Someone';
        if (toastNotification) toast.success(`New Message received from ${senderName}`);

        const conversation: Conversation | undefined = queryClient.getQueryData(['chats', conversationId]);

        queryClient.cancelQueries({ queryKey: ['chats', conversationId] });

        if (conversation) {
            const newConversation: Conversation = {
                ...conversation,
                messages: [...(conversation.messages || []), newMessage],
            };
            queryClient.setQueryData(['chats', conversationId], newConversation);
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
