/* eslint-disable @typescript-eslint/no-explicit-any */
import { QueryClient } from "@tanstack/react-query";
import apiClient from "./client";

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
            refetchOnWindowFocus: false,
        },
    },
});

export const verify = async () => {
    try {
        const response = await apiClient.get("/auth/verify");
        if (response.data && response.data.error === false) {
            return response.data.user;
        }
        throw new Error(response.data?.reason || "Verification failed");
    } catch (error: any) {
        // Re-throw so React Query is aware of the failure
        throw error;
    }
};

export const fetchPeople = async (userId?: string) => {
    try {
        const response = await apiClient.get("/auth/people", {
            params: userId ? { userId } : {},
        });
        return response.data;
    } catch (error: any) {
        throw error;
    }
};

export const logout = async () => {
    try {
        const response = await apiClient.post("/auth/logout", {});
        return response.status;
    } catch (error: any) {
        throw error;
    }
};