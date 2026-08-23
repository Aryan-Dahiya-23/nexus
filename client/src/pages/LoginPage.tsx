import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Login from "../components/Login/Login";
import LoadingIndicator from "../components/UI/LoadingIndicator/LoadingIndicator";
import { verify } from "../api/auth";

const LoginPage = () => {
    const navigate = useNavigate();

    const { data, isSuccess, isLoading } = useQuery({
        queryKey: ['user'],
        queryFn: () => verify(),
        retry: false,
    });

    useEffect(() => {
        if (isSuccess && data) {
            navigate("/");
        }
    }, [data, isSuccess, navigate]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <LoadingIndicator />
            </div>
        );
    }

    return !isSuccess ? <Login /> : null;
};

export default LoginPage;
