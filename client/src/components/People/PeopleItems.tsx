import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { io, Socket } from "socket.io-client";
import OfflineAvatar from "../Avatar/OfflineAvatar";
import { AuthContext } from "../../contexts/AuthContext";
import { ThemeContext } from "../../contexts/ThemeContext";
import { queryClient } from "../../api/auth";
import { createConversation } from "../../api/conversation";

interface PeopleItemsProps {
    username: string;
    avatarSrc: string,
    userId: string;
}

const socket: Socket = io(import.meta.env.VITE_URL);

const PeopleItems: React.FC<PeopleItemsProps> = ({
    username,
    avatarSrc,
    userId,
}) => {
    const navigate = useNavigate();

    const { user } = useContext(AuthContext);
    const { setLogoutLoading } = useContext(ThemeContext)
    const [clicked, setClicked] = useState(false);

    const { mutate } = useMutation({
        mutationFn: async () => {
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
            console.error("Error creating chat:", error);
        },
    });

    const navigateToChat = () => {

        for (let i = 0; i < user.conversations.length; i++) {
            if (user.conversations[i].conversation.participants.length === 1 && user.conversations[i].conversation.participants[0]._id === userId) {
                navigate(`/chats/${user.conversations[i].conversation._id}`);
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
            className="flex flex-row items-center w-full px-3 lg:px-2 rounded-xl space-x-2 hover:bg-gray-100 cursor-pointer"
            onClick={() => navigateToChat()}
        >
            <div className="flex items-center h-16">
                <OfflineAvatar height="12" width="12" imgSrc={avatarSrc} />
            </div>

            <div className="flex flex-col justify-center w-5/6 h-16 border-b-2 border-gray-200">
                <p
                    className="lg:text-lg font-semibold lg:font-bold w-full max-w-[80%] md:max-w-[70%] whitespace-nowrap text-ellipsis overflow-hidden"
                >
                    {username}
                </p>
            </div>


        </div>
    );
};

export default PeopleItems;