import React, { useContext, useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { verify } from '../../api/auth';
import { AuthContext } from '../../contexts/AuthContext';
import { User } from '../../types';
import LoadingIndicator from '../UI/LoadingIndicator/LoadingIndicator';
import ServerWarmup from '../UI/ServerWarmup';

export const PublicOnlyRoute: React.FC = () => {
    const { user, setUser, setLoggedIn } = useContext(AuthContext);
    const [isSlowLoading, setIsSlowLoading] = useState<boolean>(false);

    const { data, isLoading, isError, error, refetch } = useQuery<
        User,
        { response?: { status?: number }; code?: string; message?: string }
    >({
        queryKey: ['user'],
        queryFn: verify,
        staleTime: 5 * 60 * 1000,
        retry: false,
    });

    useEffect(() => {
        if (data) {
            setUser(data);
            setLoggedIn(true);
        }
    }, [data, setUser, setLoggedIn]);

    // Detect if authentication verification is taking a long time (Render cold-start)
    useEffect(() => {
        if (isLoading && !user) {
            const timer = setTimeout(() => {
                setIsSlowLoading(true);
            }, 1500);
            return () => clearTimeout(timer);
        } else {
            setIsSlowLoading(false);
        }
    }, [isLoading, user]);

    // If user is already active in memory or returned from query, redirect directly to in-app chats
    if (user || (data && data._id)) {
        return <Navigate to="/chats" replace />;
    }

    // Check if error is network / cold-start error vs genuine 401 unauthenticated response
    const status = error?.response?.status;
    const isNetworkOrColdStart = isError && (!status || status >= 500 || error?.code === 'ECONNABORTED' || Boolean(error?.message?.includes('Network Error')));

    // If backend is sleeping / cold-starting, display the warmup screen
    if ((isSlowLoading && isLoading) || isNetworkOrColdStart) {
        return (
            <ServerWarmup
                onServerReady={() => {
                    refetch();
                }}
            />
        );
    }

    // Fast loading spinner for initial < 1.5s
    if (isLoading && !user) {
        return (
            <div className="flex justify-center items-center h-[100dvh] w-full bg-background text-foreground">
                <LoadingIndicator size="lg" />
            </div>
        );
    }

    return <Outlet />;
};

export default PublicOnlyRoute;
