import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Login from "../components/Login/Login";
import { verify } from "../api/auth";

const LoginPage = () => {

    const navigate = useNavigate();

    const { data, isSuccess, isError } = useQuery({
        queryKey: ['user'],
        queryFn: () => verify(),
    });

    useEffect(() => {
        if(isSuccess && data) {
            navigate("/");
        }
    }, [data, isSuccess]);

    return (
        <>
            {isError && <Login />}
        </>

    )
}

export default LoginPage;