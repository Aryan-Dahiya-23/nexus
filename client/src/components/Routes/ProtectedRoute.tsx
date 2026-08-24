import React, { useContext, useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { verify } from '../../api/auth';
import { AuthContext } from '../../contexts/AuthContext';
import { User } from '../../types';
import LoadingIndicator from '../UI/LoadingIndicator/LoadingIndicator';

export const ProtectedRoute: React.FC = () => {
    const location = useLocation();
    const { user, setUser, setLoggedIn } = useContext(AuthContext);

    const { data, isLoading, isError } = useQuery<User>({
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

    if (isLoading && !user) {
        return (
            <div className="flex justify-center items-center h-[100dvh] w-full bg-background text-foreground">
                <LoadingIndicator size="lg" />
            </div>
        );
    }

    if (isError && !user) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
