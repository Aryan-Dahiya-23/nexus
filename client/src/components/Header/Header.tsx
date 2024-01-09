import { useContext, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { io, Socket } from "socket.io-client";
import { toast } from "react-toastify";
import { MdOutlineGroupAdd } from "react-icons/md";
import IncomingVideoCallWidget from "../Widgets/IncomingVideoCallWidget";
import { ThemeContext } from "../../contexts/ThemeContext";
import { AuthContext } from "../../contexts/AuthContext";
import { verify } from "../../api/auth";
import { handleChatMessage, handleMessageSent, handleSeenMessage, handleNewConversation } from "../../utils/socketHandlers";

interface HeaderProps {
    message: string,
}

const socket: Socket = io(import.meta.env.VITE_URL);

const Header: React.FC<HeaderProps> = ({ message }) => {

    const location = useLocation();
    const navigate = useNavigate();
    const { id } = useParams();

    const pathname = window.location.pathname;

    const { theme, setTheme } = useContext(ThemeContext);
    const { loginToast, setLoginToast } = useContext(ThemeContext);
    const { setGroupChatWidget } = useContext(ThemeContext);
    const { incomingVideoCall, setIncomingVideoCall } = useContext(ThemeContext);
    const { videoCallName, setVideoCallName } = useContext(ThemeContext);
    const { videoCallAvatarSrc, setVideoCallAvatarSrc } = useContext(ThemeContext);
    const { videoCallId, setVideoCallId } = useContext(ThemeContext);
    const { videoCallUserId, setVideoCallUserId } = useContext(ThemeContext);
    const { outgoingCall } = useContext(ThemeContext);
    const { user, setUser } = useContext(AuthContext);
    const { userConnected, setUserConnected } = useContext(AuthContext);
    const { setConnectedUsers } = useContext(AuthContext);

    const { data, isSuccess, isError, error } = useQuery({
        queryKey: ['user'],
        queryFn: () => verify(),
        staleTime: 10000,
    });

    useEffect(() => {
        if (isError && error !== null) {
            navigate("/login");
        }
    }, [isError, error]);

    useEffect(() => {
        if (isSuccess && data.conversations.length < 1) {
            navigate('/people');
        }
    }, [isSuccess]);

    useEffect(() => {
        if (isSuccess && data) {
            setUser(data)
            if (!loginToast) {
                setLoginToast(true);
                toast.success("Welcome back!");
            }
        }
    }, [data, isSuccess]);

    useEffect(() => {

        socket.on("connect", () => {
        });

        socket.on('connected users', (connectedUserIds) => {
            setConnectedUsers(connectedUserIds);
        });

        if (!userConnected && user && user._id) {
            const userId: string = user._id;
            socket.emit('user connected', userId);
            setUserConnected(true);
        }

        socket.on('chat message', (userId, newMessage, conversationId) => {

            if (userId !== user._id) {

                const newUser = { ...user }
                const conversationIndex = newUser.conversations.findIndex(conv => conv.conversation._id === conversationId);

                if (conversationIndex !== -1) {
                    const currentDate = new Date();
                    const message = {
                        ...newMessage,
                        createdAt: currentDate.toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                            timeZoneName: "short"
                        })
                    }

                    if (id === conversationId) {
                        message.seenBy.push(user._id);
                    }

                    // newUser.conversations[conversationIndex].conversation.lastMessage = message;

                    const conversationToMove = newUser.conversations[conversationIndex];
                    newUser.conversations.splice(conversationIndex, 1);
                    newUser.conversations.unshift(conversationToMove);
                    newUser.conversations[0].conversation.lastMessage = message;

                    setUser(newUser);
                }

                const allowedRoutes = ['/', '/people'];
                handleChatMessage(user, newMessage, conversationId, allowedRoutes.includes(location.pathname) ? true : false);
            }

        });

        socket.on('message sent', (userId, conversationId) => {
            handleMessageSent(user, userId, conversationId);
        });

        socket.on('seen message', (conversationId) => {
            handleSeenMessage(id, conversationId);
        });

        socket.on('new conversation', (userId) => {
            handleNewConversation(userId, user._id);
        });

        socket.on('video call', (name, avatarSrc, userId, id) => {

            const isConversationExists = user.conversations.some(conversation => conversation.conversation._id === id);

            if (isConversationExists && user._id !== userId) {
                setVideoCallName(name);
                setVideoCallUserId(userId);
                setVideoCallAvatarSrc(avatarSrc);
                setVideoCallId(id);
                setIncomingVideoCall(true);
            }
        })

        socket.on('accept video call', (id) => {
            const newPath = `/room/${id}`
            if (location.pathname !== newPath && location.pathname === `/chats/${id}` && outgoingCall) {
                navigate(newPath);
            }
        })

        return () => {
            socket.off('connected users');
            socket.off('chat message');
            socket.off('message sent');
            socket.off('seen message');
            socket.off('new conversation');
            socket.off('video call');
            socket.off('accept video call');
        };
    }, [user, isSuccess, outgoingCall]);

    const handleTheme = (e: { target: { checked: unknown; }; }) => {
        if (e.target.checked || localStorage.getItem("theme") === "light") {
            setTheme("dark");
        } else {
            setTheme("light");
        }
    };

    const handleGroupChatWidget = () => {
        setGroupChatWidget(true);
    }

    return (
        <>

            {incomingVideoCall && <IncomingVideoCallWidget
                name={videoCallName}
                userId={videoCallUserId}
                avatarSrc={videoCallAvatarSrc}
                id={videoCallId}
            />}

            <div className={`flex flex-row justify-between items-center px-2 py-4 lg:px-1 lg:pr-3 ${pathname.substring(1, 6) === 'chats' && "hidden md:inline-flex"}`}>
                <div className=" text-3xl font-bold">
                    <p className="">{message}</p>
                </div>

                <div className="flex flex-row justify-between space-x-6">

                    <div className="flex flex-row items-center justify-center cursor-pointer hover:opacity-80" onClick={handleGroupChatWidget}>
                        <MdOutlineGroupAdd className="icons" />
                    </div>

                    <label className="swap swap-rotate m-auto hover:opacity-80">
                        <input
                            type="checkbox"
                            className="theme-controller"
                            value="synthwave"
                            onChange={handleTheme}
                            checked={theme === "dark"}
                        />
                        <svg
                            className="swap-off fill-current icons"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24">
                            <path d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,6.34Zm12,.29a1,1,0,0,0,.7-.29l.71-.71a1,1,0,1,0-1.41-1.41L17,5.64a1,1,0,0,0,0,1.41A1,1,0,0,0,17.66,7.34ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM18.36,17A1,1,0,0,0,17,18.36l.71.71a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Zm0,9A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z" /></svg>
                        <svg
                            className="swap-on fill-current icons"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24">
                            <path d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z" /></svg>
                    </label>
                </div>

            </div>

        </>
    )
}

export default Header;