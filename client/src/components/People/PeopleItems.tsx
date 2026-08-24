import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { MessageSquare, ArrowRight, Loader2 } from "lucide-react";
import OnlineAvatar from "../Avatar/OnlineAvatar";
import OfflineAvatar from "../Avatar/OfflineAvatar";
import { AuthContext } from "../../contexts/AuthContext";
import { ThemeContext } from "../../contexts/ThemeContext";
import { queryClient } from "../../api/auth";
import { createConversation } from "../../api/conversation";
import { Participant } from "../../types";
import socket from "../../utils/socket";

const DEFAULT_AVATAR = "https://res.cloudinary.com/dwyx9715k/image/upload/v1723145455/nexus/avatars/default_avatar.png";

interface PeopleItemsProps {
    username: string;
    avatarSrc: string;
    userId: string;
    isOnline?: boolean;
}

const PeopleItems: React.FC<PeopleItemsProps> = ({
    username,
    avatarSrc,
    userId,
    isOnline = false,
}) => {
    const navigate = useNavigate();

    const { user } = useContext(AuthContext);
    const { setLogoutLoading } = useContext(ThemeContext);
    const [clicked, setClicked] = useState(false);

    const { mutate, status } = useMutation({
        mutationFn: async () => {
            if (!user?._id) throw new Error("User not authenticated");
            const response = await createConversation(user._id, userId);
            return response;
        },
        onMutate: () => {
            document.body.classList.add('unclickable');
            setLogoutLoading(true);
        },
        onSuccess: async (data) => {
            socket.emit('new conversation', userId);
            await queryClient.invalidateQueries({ queryKey: ['user'] });
            const chatId = data?.data.chat._id;
            setLogoutLoading(false);
            navigate(`/chats/${chatId}`);
            document.body.classList.remove('unclickable');
        },
        onError: (error) => {
            setLogoutLoading(false);
            document.body.classList.remove('unclickable');
            console.error("Error creating chat:", error);
        },
    });

    const navigateToChat = () => {
        if (!user || !Array.isArray(user.conversations)) {
            return;
        }

        for (let i = 0; i < user.conversations.length; i++) {
            const conv = user.conversations[i]?.conversation;
            if (conv && conv.participants && conv.participants.some((p: Participant | string) => (typeof p === 'object' && p !== null ? p._id === userId : p === userId))) {
                navigate(`/chats/${conv._id}`);
                return;
            }
        }

        if (!clicked) {
            mutate();
            setClicked(true);
        }
    };

    const isPending = status === 'pending';

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            navigateToChat();
        }
    };

    return (
        <div
            role="button"
            tabIndex={0}
            aria-label={`Chat with ${username}`}
            className="group relative flex items-center w-full px-3 py-2.5 rounded-2xl gap-3 cursor-pointer transition-all duration-150 select-none hover:bg-muted/70 active:bg-muted/90 border border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            onClick={navigateToChat}
            onKeyDown={handleKeyDown}
        >
            {/* Avatar Section */}
            <div className="shrink-0 relative">
                {isOnline ? (
                    <OnlineAvatar height="12" width="12" imgSrc={avatarSrc || DEFAULT_AVATAR} />
                ) : (
                    <OfflineAvatar height="12" width="12" imgSrc={avatarSrc || DEFAULT_AVATAR} />
                )}
            </div>

            {/* User Info Details */}
            <div className="flex flex-col flex-1 min-w-0 justify-center py-0.5">
                {/* Name & Presence Row */}
                <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                        {username}
                    </p>

                    <span className={`text-[11px] shrink-0 font-medium ${
                        isOnline ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-muted-foreground"
                    }`}>
                        {isOnline ? "Active now" : "Offline"}
                    </span>
                </div>

                {/* Subtitle / Action Row */}
                <div className="flex items-center justify-between gap-2 mt-1">
                    <div className="flex items-center gap-1 min-w-0 text-xs text-muted-foreground">
                        <MessageSquare className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" />
                        <p className="truncate text-xs text-muted-foreground/90 group-hover:text-foreground/80">
                            Click to message
                        </p>
                    </div>

                    {/* Quick Chat Action Indicator */}
                    <div className="shrink-0">
                        {isPending ? (
                            <div className="p-1 text-primary">
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            </div>
                        ) : (
                            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                <span>Chat</span>
                                <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PeopleItems;
