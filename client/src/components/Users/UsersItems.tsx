import React, { useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Image as ImageIcon, Video as VideoIcon, Users as GroupIcon, CheckCheck, Check, Ban } from "lucide-react";
import OfflineAvatar from "../Avatar/OfflineAvatar";
import OnlineAvatar from "../Avatar/OnlineAvatar";
import { AuthContext } from "../../contexts/AuthContext";
import { queryClient } from "../../api/auth";
import { getConversation } from "../../api/conversation";

const DEFAULT_AVATAR = "https://res.cloudinary.com/dwyx9715k/image/upload/v1723145455/nexus/avatars/default_avatar.png";

interface UsersItemsProps {
    username: string;
    avatarSrc: string[];
    conversationId: string;
    lastMessage: string;
    lastMessageTime: string;
    online: boolean;
    type: string;
    messageUnseen: boolean;
    isSentByMe?: boolean;
    isSeenByRecipient?: boolean;
    mediaType?: "text" | "image" | "video";
    isDeleted?: boolean;
}

const UsersItems: React.FC<UsersItemsProps> = ({
    username,
    avatarSrc,
    conversationId,
    lastMessage,
    lastMessageTime,
    online,
    type,
    messageUnseen,
    isSentByMe = false,
    isSeenByRecipient = false,
    mediaType = "text",
    isDeleted = false,
}) => {
    const navigate = useNavigate();
    const { id: activeId } = useParams<{ id?: string }>();
    const isSelected = activeId === conversationId;

    const { user, typingUsers } = useContext(AuthContext);
    const activeTyping = typingUsers[conversationId];

    const navigateToChat = () => {
        navigate(`/chats/${conversationId}`);
    };

    const prefetch = () => {
        if (!user?._id) return;
        queryClient.prefetchQuery({
            queryKey: ['chats', conversationId],
            queryFn: () => getConversation(user._id, conversationId),
            staleTime: 60000,
        });
    };

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
            aria-label={`Conversation with ${username}`}
            className={`group relative flex items-center w-full px-3 py-2.5 rounded-2xl gap-3 cursor-pointer transition-all duration-150 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                isSelected
                    ? "bg-primary/10 dark:bg-primary/20 text-foreground border border-primary/25 shadow-xs before:absolute before:left-1 before:top-3.5 before:bottom-3.5 before:w-1 before:rounded-full before:bg-primary"
                    : "hover:bg-muted/70 active:bg-muted/90 border border-transparent"
            }`}
            onClick={navigateToChat}
            onKeyDown={handleKeyDown}
            onMouseEnter={prefetch}
            onTouchMove={prefetch}
            onFocus={prefetch}
        >
            {/* Avatar Section */}
            {type === 'personal' ? (
                <div className="shrink-0 relative">
                    {online ? (
                        <OnlineAvatar height="12" width="12" imgSrc={avatarSrc[0] || DEFAULT_AVATAR} />
                    ) : (
                        <OfflineAvatar height="12" width="12" imgSrc={avatarSrc[0] || DEFAULT_AVATAR} />
                    )}
                </div>
            ) : (
                <div className="relative shrink-0 w-12 h-12 flex items-center justify-center">
                    {/* Layered Group Avatar */}
                    {avatarSrc && avatarSrc.length > 1 ? (
                        <div className="relative w-12 h-12">
                            <img
                                src={avatarSrc[0] || DEFAULT_AVATAR}
                                alt="group member 1"
                                className="absolute top-0 left-0 w-8 h-8 rounded-full object-cover ring-2 ring-card bg-muted shadow-xs"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = DEFAULT_AVATAR;
                                }}
                            />
                            <img
                                src={avatarSrc[1] || DEFAULT_AVATAR}
                                alt="group member 2"
                                className="absolute bottom-0 right-0 w-7 h-7 rounded-full object-cover ring-2 ring-card bg-muted shadow-xs"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = DEFAULT_AVATAR;
                                }}
                            />
                            <span className="absolute -bottom-0.5 -left-0.5 p-0.5 rounded-full bg-primary/90 text-primary-foreground shadow-xs">
                                <GroupIcon className="h-2.5 w-2.5" />
                            </span>
                        </div>
                    ) : (
                        <div className="w-12 h-12 rounded-2xl bg-muted border border-border flex items-center justify-center text-muted-foreground font-bold shadow-xs">
                            <GroupIcon className="h-5 w-5" />
                        </div>
                    )}
                </div>
            )}

            {/* Conversation Content Details */}
            <div className="flex flex-col flex-1 min-w-0 justify-center py-0.5">
                {/* Name & Timestamp Row */}
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                        {type === 'group' && (
                            <GroupIcon className="h-3.5 w-3.5 text-muted-foreground/80 shrink-0" />
                        )}
                        <p className={`text-sm font-semibold truncate ${
                            messageUnseen ? "text-foreground font-bold" : "text-foreground/90"
                        }`}>
                            {username}
                        </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`text-[11px] font-medium ${
                            messageUnseen ? "text-primary font-bold" : "text-muted-foreground"
                        }`}>
                            {lastMessageTime}
                        </span>
                    </div>
                </div>

                {/* Message Preview & Unread Badge Row */}
                <div className="flex items-center justify-between gap-2 mt-1">
                    {activeTyping && activeTyping.length > 0 ? (
                        <div className="flex items-center gap-1.5 min-w-0 text-xs text-primary font-medium animate-in fade-in duration-150">
                            <span className="flex gap-0.5 items-center shrink-0">
                                <span className="h-1 w-1 rounded-full bg-primary animate-pulse" />
                                <span className="h-1 w-1 rounded-full bg-primary animate-pulse [animation-delay:0.2s]" />
                                <span className="h-1 w-1 rounded-full bg-primary animate-pulse [animation-delay:0.4s]" />
                            </span>
                            <p className="truncate font-semibold text-primary text-xs">
                                {type === 'group' ? `${activeTyping[0].userName.split(' ')[0]} is typing...` : 'typing...'}
                            </p>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1 min-w-0 text-xs text-muted-foreground">
                            {/* Sent checkmark status for user's own sent messages */}
                            {isSentByMe && !isDeleted && (
                                <span className="shrink-0">
                                    {isSeenByRecipient ? (
                                        <CheckCheck className="h-3.5 w-3.5 text-cyan-500 dark:text-cyan-400" />
                                    ) : (
                                        <Check className="h-3.5 w-3.5 text-muted-foreground/70" />
                                    )}
                                </span>
                            )}

                            {/* Deleted message icon */}
                            {isDeleted && (
                                <Ban className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" />
                            )}

                            {/* Media type icon */}
                            {!isDeleted && mediaType === 'image' && (
                                <ImageIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            )}
                            {!isDeleted && mediaType === 'video' && (
                                <VideoIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            )}

                            <p className={`truncate text-xs ${
                                isDeleted
                                    ? "italic text-muted-foreground/75"
                                    : messageUnseen
                                    ? "text-foreground font-semibold dark:text-primary"
                                    : "text-muted-foreground/90 group-hover:text-foreground/80"
                            }`}>
                                {lastMessage}
                            </p>
                        </div>
                    )}

                    {/* Unread Status Pill / Dot */}
                    {messageUnseen && (
                        <div className="flex items-center shrink-0">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary shadow-xs" />
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UsersItems;
