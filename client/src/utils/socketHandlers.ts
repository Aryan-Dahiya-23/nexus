import { toast } from "react-toastify";
import { queryClient } from "../api/auth";

type Conversation = {
    lastMessage: object,
    messages: object[],
    participants: object[],
    type: string,
    _id: string,
}

export const handleChatMessage =  (user, newMessage, conversationId, toastNotification) => {
    const isConversationExists = user.conversations.some(conversation => conversation.conversation._id === conversationId);

    if (isConversationExists) {
        if (toastNotification) toast.success(`New Message received from ${newMessage.senderId.fullName}`);

        const conversation: Conversation | undefined = queryClient.getQueryData(['chats', conversationId]);

        queryClient.cancelQueries({ queryKey: ['chats', conversationId] });

        const newConversation = {
            ...conversation,
            messages: [...(conversation?.messages as object[]), newMessage],
        };

        queryClient.setQueryData(['chats', conversationId], newConversation);
    }
};

export const handleMessageSent = (user, userId, conversationId) => {
    const isConversationExists = user.conversations.some(conversation => conversation.conversation._id === conversationId);
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
}