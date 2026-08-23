import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import OfflineAvatar from "../Avatar/OfflineAvatar";
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
}

const PeopleItems: React.FC<PeopleItemsProps> = ({
    username,
    avatarSrc,
    userId,
}) => {
    const navigate = useNavigate();

    const { user } = useContext(AuthContext);
    const { setLogoutLoading } = useContext(ThemeContext);
    const [clicked, setClicked] = useState(false);

    const { mutate } = useMutation({
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

        if(!clicked){
            mutate();
            setClicked(true);
        }
    };

    return (
        <div
            className="flex flex-row items-center w-full px-3 py-2.5 rounded-xl space-x-3 hover:bg-muted/70 cursor-pointer transition-colors"
            onClick={() => navigateToChat()}
        >
            <div className="flex items-center h-14 shrink-0">
                <OfflineAvatar height="12" width="12" imgSrc={avatarSrc} />
            </div>

            <div className="flex flex-col justify-center flex-1 min-w-0 h-14 border-b border-border/60">
                <p className="text-sm lg:text-base font-semibold text-foreground truncate max-w-[85%]">
                    {username}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">Click to open chat</p>
            </div>
        </div>
    );
};

export default PeopleItems;
