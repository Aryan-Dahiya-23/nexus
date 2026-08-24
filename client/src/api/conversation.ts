import apiClient from "./client";

interface Participant {
    id: string;
}

export const getConversation = async (userId: string, conversationId: string | undefined) => {
    if (!conversationId) throw new Error("Conversation ID is required");
    const response = await apiClient.get(`/conversation/${conversationId}`, {
        params: { userId }
    });
    return response.data;
};

export const createConversation = async (senderId: string, receiverId: string) => {
    const response = await apiClient.post("/conversation/create-conversation", { senderId, receiverId });
    return response.data;
};

export const createGroupConversation = async (participants: Participant[], name: string, userId: string) => {
    const updatedParticipants = [...participants.map(participant => participant.id), userId];
    const response = await apiClient.post("/conversation/create-group-conversation", {
        participants: updatedParticipants,
        name: name
    });
    return response.data;
};

export const createMessage = async (conversationId: string | undefined, message: Record<string, unknown>) => {
    if (!conversationId) throw new Error("Conversation ID is required");
    const response = await apiClient.post(`/conversation/create-message/${conversationId}`, {
        message
    });
    return response.data;
};

export const readMessage = async (userId: string, conversationId: string | undefined) => {
    if (!conversationId) throw new Error("Conversation ID is required");
    const response = await apiClient.put(`/conversation/read-conversation/${conversationId}`, {
        userId
    });
    return response.data;
};

export const deleteConversation = async (userId: string, conversationId: string | undefined) => {
    if (!conversationId || !userId) throw new Error("User ID and Conversation ID are required");
    const response = await apiClient.put(`/conversation/user/${userId}/removeConversation/${conversationId}`);
    return response.data;
};

export const editMessage = async (
    conversationId: string | undefined,
    messageId: string | undefined,
    content: string
) => {
    if (!conversationId || !messageId) throw new Error("Conversation ID and Message ID are required");
    const response = await apiClient.put(`/conversation/${conversationId}/message/${messageId}`, {
        content
    });
    return response.data;
};

export const deleteMessage = async (
    conversationId: string | undefined,
    messageId: string | undefined
) => {
    if (!conversationId || !messageId) throw new Error("Conversation ID and Message ID are required");
    const response = await apiClient.delete(`/conversation/${conversationId}/message/${messageId}`);
    return response.data;
};

export const fetchConversationMessages = async (
    conversationId: string | undefined,
    before?: string | null,
    limit: number = 30
) => {
    if (!conversationId) throw new Error("Conversation ID is required");
    const response = await apiClient.get(`/conversation/${conversationId}/messages`, {
        params: {
            ...(before ? { before } : {}),
            limit
        }
    });
    return response.data;
};
