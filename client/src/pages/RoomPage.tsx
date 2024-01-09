import { useContext, useEffect } from "react";
import Room from "../components/Room/Room";
import { AuthContext } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const RoomPage = () => {

    const navigate = useNavigate();

    const { user } = useContext(AuthContext);

    useEffect(() => {
        if (!user) {
            navigate("/");
        }
    }, []);

    return (
        <>
            <Room />
        </>
    )
}

export default RoomPage;