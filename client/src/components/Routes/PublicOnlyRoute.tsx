import React, { useContext, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { verify } from '../../api/auth';
import { AuthContext } from '../../contexts/AuthContext';
import { User } from '../../types';
import LoadingIndicator from '../UI/LoadingIndicator/LoadingIndicator';

export const PublicOnlyRoute: React.FC = () => {
    const { user, setUser, setLoggedIn } = useContext(AuthContext);

    const { data, isLoading, isSuccess } = useQuery<User>({
        queryKey: ['user'],
        queryFn: verify,
        staleTime: 30000,
        retry: false,
    });

    useEffect(() => {
        if (data) {
            setUser(data);
            setLoggedIn(true);
        }
    }, [data, setUser, setLoggedIn]);

    if (isLoading && !user) {
        return (
            <div className="flex justify-center items-center h-screen w-full bg-slate-900 text-white">
                <LoadingIndicator />
            </div>
        );
    }

    if (isSuccess || user) {
        const destination = (data?.conversations && data.conversations.length > 0) || (user?.conversations && user.conversations.length > 0)
            ? '/chats'
            : '/people';
        return <Navigate to={destination} replace />;
    }

    return <Outlet />;
};

export default PublicOnlyRoute;
