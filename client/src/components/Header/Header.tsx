import { useContext, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { UserPlus } from "lucide-react";
import IncomingVideoCallWidget from "../Widgets/IncomingVideoCallWidget";
import { ThemeContext } from "../../contexts/ThemeContext";
import { AuthContext } from "../../contexts/AuthContext";
import { verify } from "../../api/auth";
import { handleChatMessage, handleMessageSent, handleSeenMessage, handleNewConversation, handleMessageEdited, handleMessageDeleted } from "../../utils/socketHandlers";
import { Message, User, UserConversationRef } from "../../types";
import socket from "../../utils/socket";

interface HeaderProps {
    message: string;
}

const Header: React.FC<HeaderProps> = ({ message }) => {

    const location = useLocation();
    const navigate = useNavigate();
    const { id } = useParams();

    const { setGroupChatWidget } = useContext(ThemeContext);
    const { incomingVideoCall, setIncomingVideoCall } = useContext(ThemeContext);
    const { videoCallName, setVideoCallName } = useContext(ThemeContext);
    const { videoCallAvatarSrc, setVideoCallAvatarSrc } = useContext(ThemeContext);
    const { videoCallId, setVideoCallId } = useContext(ThemeContext);
    const { videoCallUserId, setVideoCallUserId } = useContext(ThemeContext);
    const { outgoingCall } = useContext(ThemeContext);

    const { user, setUser, userConnected, setUserConnected, setConnectedUsers, setTypingUsers } = useContext(AuthContext);

    const { data, isSuccess } = useQuery<User>({
        queryKey: ['user'],
        queryFn: () => verify(),
        staleTime: 30000,
    });

    useEffect(() => {
        if (isSuccess && data && data.conversations.length < 1) {
            navigate('/people');
        }
    }, [isSuccess, data, navigate]);

    useEffect(() => {
        if (isSuccess && data) {
            setUser(data);
        }
    }, [data, isSuccess, setUser]);

    useEffect(() => {

        socket.on("connect", () => {
        });

        socket.on('connected users', (connectedUserIds: string[]) => {
            setConnectedUsers(connectedUserIds);
        });

        if (!userConnected && user && user._id) {
            const currentUserId: string = user._id;
            socket.emit('user connected', currentUserId);
            setUserConnected(true);
        }

        socket.on('chat message', (senderUserId: string, newMessage: Message, conversationId: string) => {
            if (senderUserId !== user?._id) {
                const currentDate = new Date();
                const formattedMessage: Message = {
                    ...newMessage,
                    createdAt: currentDate.toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                        timeZoneName: "short"
                    }),
                    seenBy: id === conversationId && user?._id ? [...(newMessage.seenBy || []), user._id] : (newMessage.seenBy || [])
                };

                setUser((prevUser: User | undefined) => {
                    if (!prevUser || !Array.isArray(prevUser.conversations)) return prevUser;
                    const conversationIndex = prevUser.conversations.findIndex(
                        (conv: UserConversationRef) => conv?.conversation?._id === conversationId
                    );
                    if (conversationIndex === -1) return prevUser;

                    const targetConv = {
                        ...prevUser.conversations[conversationIndex],
                        conversation: {
                            ...prevUser.conversations[conversationIndex].conversation,
                            lastMessage: formattedMessage
                        }
                    };

                    const remainingConvs = prevUser.conversations.filter(
                        (_: UserConversationRef, idx: number) => idx !== conversationIndex
                    );

                    return {
                        ...prevUser,
                        conversations: [targetConv, ...remainingConvs]
                    };
                });

                setTypingUsers((prev) => {
                    const currentList = prev[conversationId] || [];
                    const updatedList = currentList.filter((u) => u.userId !== senderUserId);
                    return {
                        ...prev,
                        [conversationId]: updatedList,
                    };
                });

                handleChatMessage(user!, newMessage, conversationId);
            }
        });

        socket.on('user typing', (conversationId: string, typingUser: { userId: string; userName: string; userPicture?: string }) => {
            if (typingUser.userId !== user?._id) {
                setTypingUsers((prev) => {
                    const currentList = prev[conversationId] || [];
                    if (currentList.some((u) => u.userId === typingUser.userId)) {
                        return prev;
                    }
                    return {
                        ...prev,
                        [conversationId]: [...currentList, typingUser],
                    };
                });
            }
        });

        socket.on('user stop typing', (conversationId: string, typingUserId: string) => {
            setTypingUsers((prev) => {
                const currentList = prev[conversationId] || [];
                const updatedList = currentList.filter((u) => u.userId !== typingUserId);
                return {
                    ...prev,
                    [conversationId]: updatedList,
                };
            });
        });

        socket.on('message sent', (senderUserId: string, conversationId: string) => {
            if (user) {
                handleMessageSent(user, senderUserId, conversationId);
            }
        });

        socket.on('message edited', (conversationId: string, updatedMessage: Message) => {
            handleMessageEdited(conversationId, updatedMessage);
            setUser((prevUser: User | undefined) => {
                if (!prevUser || !Array.isArray(prevUser.conversations)) return prevUser;
                const conversationIndex = prevUser.conversations.findIndex(
                    (conv: UserConversationRef) => conv?.conversation?._id === conversationId
                );
                if (conversationIndex === -1) return prevUser;
                const targetConv = prevUser.conversations[conversationIndex];
                if (targetConv?.conversation?.lastMessage?._id === updatedMessage._id) {
                    const newConvs = [...prevUser.conversations];
                    newConvs[conversationIndex] = {
                        ...targetConv,
                        conversation: {
                            ...targetConv.conversation,
                            lastMessage: {
                                ...targetConv.conversation.lastMessage,
                                ...updatedMessage
                            }
                        }
                    };
                    return { ...prevUser, conversations: newConvs };
                }
                return prevUser;
            });
        });

        socket.on('message deleted', (conversationId: string, deletedMessage: Message) => {
            handleMessageDeleted(conversationId, deletedMessage);
            setUser((prevUser: User | undefined) => {
                if (!prevUser || !Array.isArray(prevUser.conversations)) return prevUser;
                const conversationIndex = prevUser.conversations.findIndex(
                    (conv: UserConversationRef) => conv?.conversation?._id === conversationId
                );
                if (conversationIndex === -1) return prevUser;
                const targetConv = prevUser.conversations[conversationIndex];
                if (targetConv?.conversation?.lastMessage?._id === deletedMessage._id) {
                    const newConvs = [...prevUser.conversations];
                    newConvs[conversationIndex] = {
                        ...targetConv,
                        conversation: {
                            ...targetConv.conversation,
                            lastMessage: {
                                ...targetConv.conversation.lastMessage,
                                ...deletedMessage,
                                isDeleted: true,
                                content: 'This message was deleted'
                            } as Message
                        }
                    };
                    return { ...prevUser, conversations: newConvs };
                }
                return prevUser;
            });
        });

        socket.on('seen message', (conversationId: string) => {
            handleSeenMessage(id, conversationId);
        });

        socket.on('new conversation', (newUserId: string) => {
            if (user?._id) {
                handleNewConversation(newUserId, user._id);
            }
        });

        socket.on('video call', (name: string, avatarSrc: string[], callUserId: string, callId: string) => {
            if (!user || !Array.isArray(user.conversations)) return;
            const isConversationExists = user.conversations.some(conversation => conversation?.conversation?._id === callId);

            if (isConversationExists && user._id !== callUserId) {
                setVideoCallName(name);
                setVideoCallUserId(callUserId);
                setVideoCallAvatarSrc(avatarSrc);
                setVideoCallId(callId);
                setIncomingVideoCall(true);
            }
        });

        socket.on('accept video call', (callId: string) => {
            const newPath = `/room/${callId}`;
            if (location.pathname !== newPath && location.pathname === `/chats/${callId}` && outgoingCall) {
                navigate(newPath);
            }
        });

        return () => {
            socket.off('connected users');
            socket.off('chat message');
            socket.off('message edited');
            socket.off('message deleted');
            socket.off('user typing');
            socket.off('user stop typing');
            socket.off('message sent');
            socket.off('seen message');
            socket.off('new conversation');
            socket.off('video call');
            socket.off('accept video call');
        };
    }, [
        user,
        userConnected,
        setUserConnected,
        setConnectedUsers,
        setTypingUsers,
        id,
        setUser,
        location.pathname,
        setVideoCallName,
        setVideoCallUserId,
        setVideoCallAvatarSrc,
        setVideoCallId,
        setIncomingVideoCall,
        outgoingCall,
        navigate
    ]);

    const handleGroupChatWidget = () => {
        setGroupChatWidget(true);
    };

    return (
        <>
            {incomingVideoCall && (
                <IncomingVideoCallWidget
                    name={videoCallName}
                    userId={videoCallUserId}
                    avatarSrc={videoCallAvatarSrc}
                    id={videoCallId}
                />
            )}

            <div className="flex flex-row justify-between items-center px-4 py-3.5 border-b border-border/60 shrink-0 bg-background/50 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                    <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                        {message}
                    </h1>
                </div>

                <div className="flex items-center gap-1.5">
                    <button
                        type="button"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-all active:scale-95 cursor-pointer shadow-2xs"
                        onClick={handleGroupChatWidget}
                        title="Create New Group"
                        aria-label="Create New Group"
                    >
                        <UserPlus className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">New Group</span>
                    </button>
                </div>
            </div>
        </>
    );
};

export default Header;
