import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { MessageSquare, ArrowRight, Loader2 } from "lucide-react";
import { AuthContext } from "../../contexts/AuthContext";
import { ThemeContext } from "../../contexts/ThemeContext";
import { queryClient } from "../../api/auth";
import { createConversation } from "../../api/conversation";
import { Participant } from "../../types";
import socket from "../../utils/socket";

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

    return (
        <div
            className="group relative flex items-center justify-between w-full px-3 py-2.5 rounded-2xl hover:bg-muted/70 border border-transparent hover:border-border/60 transition-all duration-200 cursor-pointer"
            onClick={navigateToChat}
        >
            <div className="flex items-center space-x-3 min-w-0 flex-1">
                {/* Avatar with Status Indicator */}
                <div className="relative shrink-0">
                    <img
                        src={avatarSrc || "https://res.cloudinary.com/dwyx9715k/image/upload/v1723145455/nexus/avatars/default_avatar.png"}
                        alt={username}
                        className="h-11 w-11 rounded-full object-cover ring-1 ring-border/50"
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://res.cloudinary.com/dwyx9715k/image/upload/v1723145455/nexus/avatars/default_avatar.png";
                        }}
                    />
                    {isOnline ? (
                        <span
                            className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-background shadow-xs"
                            title="Active now"
                        />
                    ) : (
                        <span
                            className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-slate-400 dark:bg-slate-600 ring-2 ring-background opacity-60"
                            title="Offline"
                        />
                    )}
                </div>

                {/* User Info */}
                <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                            {username}
                        </p>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        {isOnline ? (
                            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                                Active now
                            </span>
                        ) : (
                            <span className="text-[11px] text-muted-foreground/80">
                                Offline
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Quick Action Button */}
            <div className="shrink-0 ml-2">
                {isPending ? (
                    <div className="p-2 text-primary">
                        <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                ) : (
                    <button
                        type="button"
                        className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                        aria-label={`Chat with ${username}`}
                    >
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span>Chat</span>
                        <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                )}
            </div>
        </div>
    );
};

export default PeopleItems;
