import React, { useContext, useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowDown, Loader2 } from "lucide-react";
import ChatHeader from "./ChatHeader";
import ChatBubble from "./ChatBubble";
import ChatInput from "./ChatInput";
import NexusLogo from "../UI/NexusLogo";
import { AuthContext } from "../../contexts/AuthContext";
import { queryClient, verify } from "../../api/auth";
import { getConversation, readMessage, fetchConversationMessages } from "../../api/conversation";
import { Conversation, Message, Participant, User, UserConversationRef } from "../../types";
import socket from "../../utils/socket";

function formatMessageDate(dateString: string): string {
    const messageDate = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (messageDate.toDateString() === today.toDateString()) {
        return "Today";
    }
    if (messageDate.toDateString() === yesterday.toDateString()) {
        return "Yesterday";
    }
    return messageDate.toLocaleDateString([], {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: messageDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    });
}

const Chats: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const { messageSeenStatus, setMessageSeenStatus } = useContext(AuthContext);
    const { setUser: setContextUser } = useContext(AuthContext);
    const [receiverName, setReceiverName] = useState<string>("");
    const [receiverAvatarSrc, setReceiverAvatarSrc] = useState<string[]>([]);
    const [receiverOnline, setReceiverOnline] = useState<boolean>(false);
    const [conversationType, setConversationType] = useState<string>("");
    const { connectedUsers } = useContext(AuthContext);

    const chatContainerRef = useRef<HTMLDivElement>(null);
    const [showScrollBottom, setShowScrollBottom] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const { data: user, isSuccess: isDone } = useQuery<User>({
        queryKey: ['user'],
        queryFn: () => verify(),
        staleTime: 15000,
    });

    const userId = user?._id;

    const { data: conversation, isSuccess, isLoading, isError } = useQuery<Conversation>({
        queryKey: ['chats', id],
        queryFn: () => getConversation(userId || '', id),
        staleTime: 5 * 60 * 1000,
        enabled: !!userId && !!id
    });

    // Synchronize hasMore state whenever conversation data changes or chat changes
    useEffect(() => {
        if (conversation) {
            setHasMore(Boolean(conversation.hasMore));
        }
    }, [conversation, id]);

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
            navigate("/chats");
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

    const scrollToBottom = useCallback((smooth: boolean = false) => {
        if (chatContainerRef.current) {
            if (smooth) {
                chatContainerRef.current.scrollTo({
                    top: chatContainerRef.current.scrollHeight,
                    behavior: 'smooth',
                });
            } else {
                chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
            }
        }
    }, []);

    // Read receipt trigger on new incoming message
    useEffect(() => {
        if (conversation && conversation.lastMessage && conversation.messages.length > 0 && conversation.messages[conversation.messages.length - 1]._id && userId) {
            const lastMessage = conversation.lastMessage;
            const senderIdStr = typeof lastMessage.senderId === 'object' && lastMessage.senderId !== null ? lastMessage.senderId._id : lastMessage.senderId;
            if (messageSeenStatus === 'idle' && senderIdStr !== userId && (!lastMessage.seenBy || !lastMessage.seenBy.includes(userId))) {
                setMessageSeenStatus('pending');
                mutate();
            }
        }
        scrollToBottom(false);
    }, [conversation, id, userId, messageSeenStatus, mutate, setMessageSeenStatus, scrollToBottom]);

    // Initial scroll on conversation change
    useEffect(() => {
        const timer = setTimeout(() => scrollToBottom(false), 50);
        return () => clearTimeout(timer);
    }, [id, scrollToBottom]);

    // Fetch older messages on upward scroll (Reverse Pagination)
    const loadOlderMessages = useCallback(async () => {
        if (isLoadingMore || !hasMore || !conversation || !conversation.messages || conversation.messages.length === 0 || !id) return;
        const earliestMsg = conversation.messages[0];
        if (!earliestMsg || !earliestMsg.createdAt) return;

        setIsLoadingMore(true);
        const container = chatContainerRef.current;
        const prevHeight = container ? container.scrollHeight : 0;
        const prevScroll = container ? container.scrollTop : 0;

        try {
            const res = await fetchConversationMessages(id, earliestMsg.createdAt, 10);
            if (res && Array.isArray(res.messages) && res.messages.length > 0) {
                // Deduplicate incoming older messages
                const existingIds = new Set(conversation.messages.map(m => m._id).filter(Boolean));
                const olderMessages = res.messages.filter((m: Message) => !existingIds.has(m._id));

                if (olderMessages.length > 0) {
                    const updatedMessages = [...olderMessages, ...conversation.messages];
                    queryClient.setQueryData(['chats', id], {
                        ...conversation,
                        messages: updatedMessages,
                        hasMore: Boolean(res.hasMore)
                    });

                    // Scroll anchoring
                    requestAnimationFrame(() => {
                        if (container) {
                            const newHeight = container.scrollHeight;
                            container.scrollTop = newHeight - prevHeight + prevScroll;
                        }
                    });
                }
                setHasMore(Boolean(res.hasMore));
            } else {
                setHasMore(false);
            }
        } catch (err) {
            console.error("Error loading older messages:", err);
        } finally {
            setIsLoadingMore(false);
        }
    }, [isLoadingMore, hasMore, conversation, id]);

    // Scroll listener for reverse infinite pagination & scroll-to-bottom FAB
    useEffect(() => {
        const container = chatContainerRef.current;
        if (!container) return;

        const handleScroll = () => {
            const { scrollTop, scrollHeight, clientHeight } = container;
            const isNearBottom = Math.abs(scrollHeight - (scrollTop + clientHeight)) < 150;
            setShowScrollBottom(!isNearBottom);

            // Upward scroll threshold
            if (scrollTop < 80 && hasMore && !isLoadingMore) {
                loadOlderMessages();
            }
        };

        container.addEventListener('scroll', handleScroll, { passive: true });
        return () => {
            container.removeEventListener('scroll', handleScroll);
        };
    }, [hasMore, isLoadingMore, loadOlderMessages]);

    // Track active participants & online presence
    useEffect(() => {
        if (user && Array.isArray(user.conversations)) {
            user.conversations.forEach((userConv: UserConversationRef) => {
                if (userConv.conversation._id === id) {
                    if (userConv.conversation.type === 'personal') {
                        setReceiverName(userConv.conversation.participants[0].fullName);
                        setReceiverAvatarSrc([userConv.conversation.participants[0].picture]);
                        setConversationType('personal');
                        if (connectedUsers.length > 0 && connectedUsers.includes(userConv.conversation.participants[0]._id)) {
                            setReceiverOnline(true);
                        } else {
                            setReceiverOnline(false);
                        }
                    } else {
                        setReceiverName(userConv.conversation.name || '');
                        setReceiverAvatarSrc([
                            ...userConv.conversation.participants.map((participant: Participant) => participant.picture),
                            user.picture
                        ]);
                        setConversationType('group');
                    }
                }
            });
        }
    }, [user, conversation, connectedUsers, id]);

    return (
        <div className="flex flex-col h-[100dvh] flex-1 bg-background text-foreground md:border-l border-border transition-colors relative overflow-hidden">
            {isDone && (
                <>
                    <ChatHeader
                        name={receiverName}
                        avatarSrc={receiverAvatarSrc}
                        online={receiverOnline}
                        conversationType={conversationType}
                    />

                    {/* Messages Scroll Area */}
                    <div
                        className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 space-y-1 custom-scrollbar relative flex flex-col justify-start"
                        ref={chatContainerRef}
                    >
                        {/* Loading older messages spinner */}
                        {isLoadingMore && (
                            <div className="flex justify-center py-2">
                                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                            </div>
                        )}

                        {/* Top start of history card */}
                        {!hasMore && isSuccess && conversation && (
                            <div className="flex flex-col items-center justify-center py-6 px-4 text-center my-2 select-none">
                                <NexusLogo className="h-12 w-12 mb-3" />
                                <h4 className="text-sm font-bold text-foreground">
                                    {conversationType === 'group' ? receiverName : `Chat with ${receiverName}`}
                                </h4>
                                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                                    This is the start of your encrypted message history. Say hello! 👋
                                </p>
                            </div>
                        )}

                        {/* Loading skeleton */}
                        {isLoading && (
                            <div className="flex-1 flex items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        )}

                        {/* Message list with date separators */}
                        {isSuccess && conversation &&
                            conversation.messages.map((message: Message, index: number) => {
                                const isLastMessage = index === conversation.messages.length - 1;
                                const msgSenderId = typeof message.senderId === 'object' && message.senderId !== null ? message.senderId._id : message.senderId;
                                const senderParticipant = conversation.participants?.find((p: Participant) => p._id === msgSenderId);
                                const msgSenderName = typeof message.senderId === 'object' && message.senderId !== null
                                    ? message.senderId.fullName
                                    : msgSenderId === userId
                                        ? (user?.fullName || "You")
                                        : (senderParticipant?.fullName || receiverName);
                                const msgSenderPicture = typeof message.senderId === 'object' && message.senderId !== null
                                    ? message.senderId.picture
                                    : msgSenderId === userId
                                        ? (user?.picture || "")
                                        : (senderParticipant?.picture || "");

                                const nonSenderCount = Math.max(1, (conversation.participants?.length || 2) - 1);
                                const nonSendersInSeenBy = message.seenBy ? message.seenBy.filter(seenId => seenId !== msgSenderId) : [];
                                const messageSeen = Boolean(nonSendersInSeenBy.length >= nonSenderCount);

                                // Check date boundary
                                const prevMessage = index > 0 ? conversation.messages[index - 1] : null;
                                const prevDateStr = prevMessage?.createdAt ? new Date(prevMessage.createdAt).toDateString() : "";
                                const currDateStr = message.createdAt ? new Date(message.createdAt).toDateString() : new Date().toDateString();
                                const showDateSeparator = !prevMessage || prevDateStr !== currDateStr;

                                return (
                                    <React.Fragment key={message?._id || index}>
                                        {showDateSeparator && (
                                            <div className="sticky top-2 z-10 flex justify-center my-3">
                                                <span className="px-3 py-1 text-[11px] font-semibold text-muted-foreground bg-card/85 backdrop-blur-md border border-border/80 rounded-full shadow-xs select-none">
                                                    {formatMessageDate(message.createdAt || new Date().toISOString())}
                                                </span>
                                            </div>
                                        )}

                                        <ChatBubble
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
                                    </React.Fragment>
                                );
                            })
                        }
                    </div>

                    {/* Floating Scroll to Bottom Button */}
                    {showScrollBottom && (
                        <button
                            type="button"
                            onClick={() => scrollToBottom(true)}
                            className="absolute right-4 bottom-24 p-2.5 rounded-full bg-card/90 border border-border text-foreground shadow-lg hover:bg-muted/90 hover:scale-105 active:scale-95 transition-all z-30 animate-in fade-in zoom-in duration-150 cursor-pointer"
                            aria-label="Scroll to newest messages"
                        >
                            <ArrowDown className="h-4 w-4" />
                        </button>
                    )}

                    <ChatInput
                        data={conversation || { participants: [], messages: [] }}
                        conversationId={id}
                    />
                </>
            )}
        </div>
    );
};

export default Chats;
