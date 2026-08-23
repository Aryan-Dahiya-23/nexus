import React, { useContext, useEffect, lazy, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { verify } from '../../api/auth';
import { AuthContext } from '../../contexts/AuthContext';
import { User } from '../../types';
import LoadingIndicator from '../UI/LoadingIndicator/LoadingIndicator';

const LandingPage = lazy(() => import('../../pages/LandingPage'));
const HomePage = lazy(() => import('../../pages/HomePage'));

export const HomeOrLanding: React.FC = () => {
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

    const fallback = (
        <div className="flex justify-center items-center h-screen w-full bg-slate-950 text-white">
            <LoadingIndicator />
        </div>
    );

    if (isLoading && !user) {
        return fallback;
    }

    return (
        <Suspense fallback={fallback}>
            {isSuccess || user ? <HomePage /> : <LandingPage />}
        </Suspense>
    );
};

export default HomeOrLanding;
