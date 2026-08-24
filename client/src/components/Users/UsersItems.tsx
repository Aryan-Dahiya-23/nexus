import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import OfflineAvatar from "../Avatar/OfflineAvatar";
import OnlineAvatar from "../Avatar/OnlineAvatar";
import { AuthContext } from "../../contexts/AuthContext";
import { queryClient } from "../../api/auth";
import { getConversation } from "../../api/conversation";

interface UsersItemsProps {
    username: string;
    avatarSrc: string[];
    conversationId: string;
    lastMessage: string;
    lastMessageTime: string;
    online: boolean;
    type: string;
    messageUnseen: boolean;
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
}) => {
    const navigate = useNavigate();

    const { user } = useContext(AuthContext);

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
            className="flex flex-row items-center w-full px-3 py-2.5 rounded-2xl space-x-3 hover:bg-muted/70 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
            onClick={navigateToChat}
            onKeyDown={handleKeyDown}
            onMouseEnter={prefetch}
            onTouchMove={prefetch}
            onFocus={prefetch}
        >
            {type === 'personal' ? (
                <div className="flex h-12 w-12 shrink-0">
                    {online ? (
                        <OnlineAvatar height="12" width="12" imgSrc={avatarSrc[0]} />
                    ) : (
                        <OfflineAvatar height="12" width="12" imgSrc={avatarSrc[0]} />
                    )}
                </div>
            ) : (
                <div className="flex flex-col-reverse justify-end items-center shrink-0 w-12">
                    <div className="flex flex-row md:mt-0.5 space-x-1">
                        <OfflineAvatar height="6" width="6" imgSrc={avatarSrc[0]} />
                        <OfflineAvatar height="6" width="6" imgSrc={avatarSrc[1]} />
                    </div>
                    {avatarSrc.length > 2 && <OfflineAvatar height="6" width="6" imgSrc={avatarSrc[2]} />}
                </div>
            )}

            <div className="flex flex-col flex-1 min-w-0 h-14 justify-center border-b border-border/60 pb-1">
                <div className="flex flex-row w-full justify-between items-baseline">
                    <p className="text-sm lg:text-base font-semibold text-foreground truncate max-w-[70%]">
                        {username}
                    </p>
                    <p className={`text-xs ${messageUnseen ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
                        {lastMessageTime}
                    </p>
                </div>

                <div className="w-full flex items-center justify-between mt-0.5">
                    <p className={`text-xs truncate max-w-[85%] ${messageUnseen ? 'text-foreground font-semibold dark:text-primary' : 'text-muted-foreground'}`}>
                        {lastMessage}
                    </p>
                    {messageUnseen && (
                        <span className="h-2 w-2 rounded-full bg-primary animate-pulse shrink-0">
                            <span className="sr-only">Unread message</span>
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UsersItems;
