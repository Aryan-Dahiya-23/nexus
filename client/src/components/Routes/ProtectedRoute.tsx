import React, { useContext, useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { verify } from '../../api/auth';
import { AuthContext } from '../../contexts/AuthContext';
import { User } from '../../types';
import LoadingIndicator from '../UI/LoadingIndicator/LoadingIndicator';
import ServerWarmup from '../UI/ServerWarmup';

export const ProtectedRoute: React.FC = () => {
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

    // Detect if initial auth verification is taking a long time (cold-start indicator)
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

    // If we already have the user in memory, render immediately
    if (user) {
        return <Outlet />;
    }

    // Check if error is network / cold-start error vs genuine 401 unauthorized
    const status = error?.response?.status;
    const isNetworkOrColdStart = isError && (!status || status >= 500 || error?.code === 'ECONNABORTED' || Boolean(error?.message?.includes('Network Error')));

    // If server is cold-starting or taking long, display the warmup screen
    if ((isSlowLoading && isLoading) || isNetworkOrColdStart) {
        return (
            <ServerWarmup
                onServerReady={() => {
                    refetch();
                }}
            />
        );
    }

    // Normal fast loading spinner for the first 1.5 seconds
    if (isLoading && !user) {
        return (
            <div className="flex justify-center items-center h-[100dvh] w-full bg-background text-foreground">
                <LoadingIndicator size="lg" />
            </div>
        );
    }

    // Explicit 401 Unauthorized -> redirect to public home
    if (isError && !user) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
