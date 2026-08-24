import { QueryClient } from "@tanstack/react-query";
import apiClient from "./client";
import { Participant, User } from "../types";

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
            refetchOnWindowFocus: false,
            staleTime: 5 * 60 * 1000,
            gcTime: 10 * 60 * 1000,
        },
    },
});

export interface RegisterPayload {
    fullName: string;
    email: string;
    password: string;
    picture?: string;
}

export interface LoginPayload {
    email: string;
    password: string;
}

export interface AuthResponse {
    error: boolean;
    message: string;
    user: User;
}

export const registerWithEmail = async (payload: RegisterPayload): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>("/auth/register", payload);
    return response.data;
};

export const loginWithEmail = async (payload: LoginPayload): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>("/auth/login", payload);
    return response.data;
};

export const verify = async (): Promise<User> => {
    const response = await apiClient.get("/auth/verify");
    if (response.data && response.data.error === false) {
        return response.data.user;
    }
    throw new Error(response.data?.reason || "Verification failed");
};

export interface PaginatedPeopleResponse {
    error: boolean;
    users: Participant[];
    totalUsers: number;
    totalPages: number;
    currentPage: number;
    hasMore: boolean;
}

export interface FetchPeopleOptions {
    page?: number;
    limit?: number;
    search?: string;
    tab?: 'all' | 'online' | string;
}

export const fetchPeople = async (userId?: string, options?: FetchPeopleOptions): Promise<PaginatedPeopleResponse> => {
    const params: Record<string, string | number> = {};
    if (userId) params.userId = userId;
    if (options?.page) params.page = options.page;
    if (options?.limit) params.limit = options.limit;
    if (options?.search) params.search = options.search;
    if (options?.tab) params.tab = options.tab;

    const response = await apiClient.get("/auth/people", { params });
    if (Array.isArray(response.data)) {
        return {
            error: false,
            users: response.data,
            totalUsers: response.data.length,
            totalPages: 1,
            currentPage: 1,
            hasMore: false,
        };
    }
    return response.data;
};

export const logout = async () => {
    const response = await apiClient.post("/auth/logout", {});
    return response.status;
};
