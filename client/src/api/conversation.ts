/* eslint-disable @typescript-eslint/no-explicit-any */
import apiClient from "./client";

interface Participant {
    id: string;
}

export const getConversation = async (userId: string, conversationId: string | undefined) => {
    if (!conversationId) throw new Error("Conversation ID is required");
    try {
        const response = await apiClient.get(`/conversation/${conversationId}`, {
            params: { userId }
        });
        return response.data;
    } catch (error: any) {
        throw error;
    }
};

export const createConversation = async (senderId: string, receiverId: string) => {
    try {
        const response = await apiClient.post("/conversation/create-conversation", { senderId, receiverId });
        return response.data;
    } catch (error: any) {
        throw error;
    }
};

export const createGroupConversation = async (participants: Participant[], name: string, userId: string) => {
    try {
        const updatedParticipants = [...participants.map(participant => participant.id), userId];
        const response = await apiClient.post("/conversation/create-group-conversation", {
            participants: updatedParticipants,
            name: name
        });
        return response.data;
    } catch (error: any) {
        throw error;
    }
};

export const createMessage = async (conversationId: string | undefined, message: object) => {
    if (!conversationId) throw new Error("Conversation ID is required");
    try {
        const response = await apiClient.post(`/conversation/create-message/${conversationId}`, {
            message
        });
        return response.data;
    } catch (error: any) {
        throw error;
    }
};

export const readMessage = async (userId: string, conversationId: string | undefined) => {
    if (!conversationId) throw new Error("Conversation ID is required");
    try {
        const response = await apiClient.put(`/conversation/read-conversation/${conversationId}`, {
            userId
        });
        return response.data;
    } catch (error: any) {
        throw error;
    }
};

export const deleteConversation = async (userId: string, conversationId: string | undefined) => {
    if (!conversationId || !userId) throw new Error("User ID and Conversation ID are required");
    try {
        const response = await apiClient.put(`/conversation/user/${userId}/removeConversation/${conversationId}`);
        return response.data;
    } catch (error: any) {
        throw error;
    }
};