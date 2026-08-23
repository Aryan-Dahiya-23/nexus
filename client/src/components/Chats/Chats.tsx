import { useContext, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { FaArrowDownLong } from "react-icons/fa6";
import ChatHeader from "./ChatHeader";
import ChatBubble from "./ChatBubble";
import ChatInput from "./ChatInput";
import { AuthContext } from "../../contexts/AuthContext";
import { queryClient, verify } from "../../api/auth";
import { getConversation, readMessage } from "../../api/conversation";
import { Conversation, Message, Participant, User, UserConversationRef } from "../../types";
import socket from "../../utils/socket";

const Chats = () => {

    const { id } = useParams();
    const navigate = useNavigate();

    const { messageSeenStatus, setMessageSeenStatus } = useContext(AuthContext);
    const { setUser: setContextUser } = useContext(AuthContext);
    const [receiverName, setreceiverName] = useState<string>("");
    const [receiverAvatarSrc, setReceiverAvatarSrc] = useState<string[]>([]);
    const [receiverOnline, setReceiverOnline] = useState<boolean>(false);
    const [conversationType, setConversationType] = useState<string>("");
    const { connectedUsers } = useContext(AuthContext);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    const { data: user, isSuccess: isDone } = useQuery<User>({
        queryKey: ['user'],
        queryFn: () => verify(),
        staleTime: 15000,
    });

    const userId = user?._id;

    const { data: conversation, isSuccess, isLoading, isError } = useQuery<Conversation>({
        queryKey: ['chats', id],
        queryFn: () => getConversation(userId || '', id),
        staleTime: 15000,
        enabled: !!userId && !!id
    });

    useEffect(() => {
        if (id) {
            socket.emit('join conversation', id);
        }
        return () => {
            if (id) {
                socket.emit('leave conversation', id);
            }
        };
    }, [id]);

    useEffect(() => {
        if (isError) {
            navigate("/");
        }
    }, [isError, navigate]);

    const { mutate } = useMutation({
        mutationFn: () => readMessage(userId || '', id),
        onMutate: () => {
            setMessageSeenStatus('pending');
            setContextUser((prevUser: User | undefined) => {
                if (!prevUser || !Array.isArray(prevUser.conversations)) return prevUser;
                const conversationIndex = prevUser.conversations.findIndex(
                    (conv: UserConversationRef) => conv?.conversation?._id === id
                );
                if (conversationIndex === -1) return prevUser;

                const targetConv = prevUser.conversations[conversationIndex];
                const lastMsg = targetConv?.conversation?.lastMessage;
                if (!lastMsg) return prevUser;

                const updatedSeenBy = lastMsg.seenBy?.includes(prevUser._id)
                    ? lastMsg.seenBy
                    : [...(lastMsg.seenBy || []), prevUser._id];

                const updatedConv: UserConversationRef = {
                    ...targetConv,
                    conversation: {
                        ...targetConv.conversation,
                        lastMessage: {
                            ...lastMsg,
                            seenBy: updatedSeenBy
                        }
                    }
                };

                const newConvs = [...prevUser.conversations];
                newConvs[conversationIndex] = updatedConv;

                return {
                    ...prevUser,
                    conversations: newConvs
                };
            });
        },
        onSuccess: () => {
            socket.emit('seen message', id);
            queryClient.invalidateQueries({ queryKey: ['user'] });
            setMessageSeenStatus('idle');
        }
    });

    const scrollTopToBottom = () => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    };

    useEffect(() => {
        if (conversation && conversation.lastMessage && conversation.messages.length > 0 && conversation.messages[conversation.messages.length - 1]._id && userId) {
            const lastMessage = conversation.lastMessage;
            const senderIdStr = typeof lastMessage.senderId === 'object' && lastMessage.senderId !== null ? lastMessage.senderId._id : lastMessage.senderId;
            if (messageSeenStatus === 'idle' && senderIdStr !== userId && (!lastMessage.seenBy || !lastMessage.seenBy.includes(userId))) {
                setMessageSeenStatus('pending');
                mutate();
            }
        }
        scrollTopToBottom();

    }, [conversation, id, userId, messageSeenStatus, mutate, setMessageSeenStatus]);

    const scrollSmooth = () => {
        if (chatContainerRef.current) {
            const { scrollHeight } = chatContainerRef.current;
            chatContainerRef.current.scrollTo({
                top: scrollHeight,
                behavior: 'smooth',
            });
        }
    };

    useEffect(() => {
        const timer = setTimeout(scrollSmooth, 100);
        return () => clearTimeout(timer);
    }, [id]);

    useEffect(() => {
        const container = chatContainerRef.current;
        const handleScroll = () => {
            if (container) {
                const { scrollTop, scrollHeight, clientHeight } = container;
                const isBottom = Math.abs(scrollHeight - (scrollTop + clientHeight)) < 100;

                const myElement = document.getElementById('chatScroll');

                if (myElement && !isBottom) {
                    myElement.style.display = 'flex';
                } else if (myElement && isBottom) {
                    myElement.style.display = 'none';
                }

            }
        };

        container?.addEventListener('scroll', handleScroll);

        return () => {
            container?.removeEventListener('scroll', handleScroll);
        };
    }, [id, conversation]);

    useEffect(() => {

        if (user) {
            user.conversations.forEach((userConv: UserConversationRef) => {
                if (userConv.conversation._id === id) {
                    if (userConv.conversation.type === 'personal') {
                        setreceiverName(userConv.conversation.participants[0].fullName);
                        setReceiverAvatarSrc([userConv.conversation.participants[0].picture]);
                        setConversationType('personal');
                        if (connectedUsers.length > 0 && connectedUsers.includes(userConv.conversation.participants[0]._id)) {
                            setReceiverOnline(true);
                        } else {
                            setReceiverOnline(false);
                        }
                    }
                    else {
                        setreceiverName(userConv.conversation.name || '');
                        setReceiverAvatarSrc([...userConv.conversation.participants.map((participant: Participant) => participant.picture), user.picture]);
                        setConversationType('group');
                    }
                }
            });
        }

    }, [user, conversation, connectedUsers, id]);

    return (

        <div className={`flex flex-col h-[100dvh] md:w-[52%] lg:w-[70%] md:border-l-2 md:border-gray-200`} >

            {isDone && (
                <>
                    <ChatHeader
                        name={receiverName}
                        avatarSrc={receiverAvatarSrc}
                        online={receiverOnline}
                        conversationType={conversationType}
                    />

                    {isLoading && (
                        <div className="m-auto">
                            <span className="loading loading-infinity loading-lg text-info"></span>
                        </div>)
                    }

                    <div className="flex flex-col px-1 md:px-2 lg:px-4 lg:py-1.5 overflow-y-auto custom-scrollbar" ref={chatContainerRef}>

                        {isSuccess && conversation &&
                            conversation.messages.map((message: Message, index: number) => {

                                const isLastMessage = index === conversation.messages.length - 1;
                                const nonSenderCount = Math.max(1, (conversation.participants?.length || 2) - 1);
                                const messageSeen = Boolean(message.seenBy && message.seenBy.length >= nonSenderCount);

                                const msgSenderId = typeof message.senderId === 'object' && message.senderId !== null ? message.senderId._id : message.senderId;
                                const msgSenderName = typeof message.senderId === 'object' && message.senderId !== null ? message.senderId.fullName : receiverName;
                                const msgSenderPicture = typeof message.senderId === 'object' && message.senderId !== null ? message.senderId.picture : '';

                                return (
                                    <ChatBubble
                                        key={message?._id || index}
                                        conversationType={conversation.type}
                                        position={userId === msgSenderId ? "right" : "left"}
                                        sender={msgSenderName}
                                        message={message.content}
                                        createdAt={message.createdAt ? message.createdAt : new Date().toISOString()}
                                        avatarSrc={msgSenderPicture}
                                        footerName={receiverName}
                                        isLastMessage={isLastMessage}
                                        online={connectedUsers.length > 0 && connectedUsers.includes(msgSenderId)}
                                        messageType={message.type}
                                        messageSeen={messageSeen}
                                    />
                                );
                            })
                        }

                        <button
                            id="chatScroll"
                            className={`h-9 w-9 hidden justify-center items-center absolute right-2 bottom-28 lg:right-6 z-30 bg-gray-700 hover:bg-gray-600 text-white rounded-md`}
                            onClick={scrollSmooth}
                        >
                            <FaArrowDownLong className="h-5 w-5" />
                        </button>

                    </div>

                    <ChatInput
                        data={conversation || { participants: [], messages: [] }}
                        conversationId={id}
                    />
                </>
            )
            }

        </div >
    )
}

export default Chats;
