/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { QueryClient } from "@tanstack/react-query";
import axios from "axios"

const url = import.meta.env.VITE_URL;

export const queryClient = new QueryClient();

export const verify = async () => {
    try {
        const response = await axios.get(`${url}/auth/verify`, {
            withCredentials: true,
        });

        if (response.data.error === false) {
            return response.data.user;
        } else {
            console.error("Not Authorized", response.data.reason);
        }
    } catch (error: any) {
        console.error("Error verifying authentication:", error.message);
    }
};

export const fetchPeople = async (userId: string) => {
    try {
        const response = await axios.get(`${url}/auth/people`, {
            params: { userId },
        });
        return response.data;
    } catch (error) {
        console.log(error);
    }
};

export const logout = async () => {
    try {
        const response = await axios.post(`${url}/auth/logout`, {}, {
            withCredentials: true,
        });

        if (response.status === 204) {
            return (response.status);
        } else {
            console.error("Logout failed:", response.data.message);
        }
    } catch (error: any) {
        console.error("Error during logout:", error.message);
    }
};