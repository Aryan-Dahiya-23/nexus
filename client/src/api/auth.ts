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
    const response = await apiClient.get("/auth/verify");
    if (response.data && response.data.error === false) {
        return response.data.user;
    }
    throw new Error(response.data?.reason || "Verification failed");
};

export const fetchPeople = async (userId?: string) => {
    const response = await apiClient.get("/auth/people", {
        params: userId ? { userId } : {},
    });
    return response.data;
};

export const logout = async () => {
    const response = await apiClient.post("/auth/logout", {});
    return response.status;
};
