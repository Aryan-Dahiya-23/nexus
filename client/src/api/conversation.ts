import axios from "axios"

const url = import.meta.env.VITE_URL;

interface Participant {
    id: string;
}

export const getConversation = async (userId: string, conversationId: string | undefined) => {
    try {

        const response = await axios.get(`${url}/conversation/${conversationId}`, {
            params: { userId }
        });
        return response.data;
    } catch (error) {
        console.log(error);
    }
}

export const createConversation = async (senderId: string, receiverId: string) => {
    try {
        const response = await axios.post(`${url}/conversation/create-conversation`, { senderId, receiverId });
        return response;
    } catch (error) {
        console.log(error)
    }
}

export const createGroupConversation = async (participants: Participant[], name: string, userId: string) => {
    try {
        const updatedParticipants = [...participants.map(participant => participant.id), userId];
        const response = await axios.post(`${url}/conversation/create-group-conversation`, {
            participants: updatedParticipants,
            name: name
        });
        return response;
    } catch (error) {
        console.log("Error");
    }
}

export const createMessage = async (conversationId: string | undefined, message: object) => {
    try {
        const response = await axios.post(`${url}/conversation/create-message/${conversationId}`, {
            message
        });
        return response.data;
    } catch (error) {
        console.log(error);
    }
}

export const readMessage = async (userId: string, conversationId: string | undefined) => {
    try {
        const response = await axios.put(`${url}/conversation/read-conversation/${conversationId}`, {
            userId
        });
        return response.data;
    } catch (error) {
        console.log(error);
    }
}

export const deleteConversation = async (userId: string, conversationId: string | undefined) => {
    try {
        const response = await axios.put(`${url}/conversation/user/${userId}/removeConversation/${conversationId}`)
        return response.data;
    } catch (error) {
        console.log(error);
    }
}