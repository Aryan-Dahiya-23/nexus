import { useContext } from "react";
import Header from "../Header/Header";
import UsersItems from "./UsersItems";
import UserItemsLoading from "../UI/UserItemsLoading";
import { AuthContext } from "../../contexts/AuthContext";

const Users = () => {

    const { connectedUsers } = useContext(AuthContext);
    const { user } = useContext(AuthContext);

    return (
        <div className="flex flex-col mb-16 md:mb-0 w-full md:w-[40%] lg:w-[25%] lg:pl-2 md:h-[100vh]">

            <Header message="Messages" />

            {!user && <UserItemsLoading />}

            <div className="flex flex-col space-y-1 py-2 custom-scrollbar" id="user">
                {user &&
                    user.conversations.map((conversation) => {

                        const username = conversation.conversation.type === 'group' ? conversation.conversation.name : conversation.conversation.participants[0].fullName;
                        const avatarSrc = [...conversation.conversation.participants.map((participant) => participant.picture), user.picture];

                        const lastMessage = conversation.conversation.lastMessage ?
                            conversation.conversation.lastMessage.type === 'text'
                                ? conversation.conversation.lastMessage.content
                                : conversation.conversation.lastMessage.type === 'image'
                                    ? 'Sent an Image'
                                    : 'Sent a video'
                            : 'Started a conversation'

                        const lastMessageTime = conversation.conversation.lastMessage &&
                            new Date(conversation.conversation.lastMessage.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })

                        const online = conversation.conversation.type === 'personal' && connectedUsers.length > 0 && connectedUsers.includes(conversation.conversation.participants[0]._id);
                        const messageUnseen = conversation.conversation.lastMessage?.senderId !== user._id && !conversation.conversation.lastMessage?.seenBy.includes(user._id);

                        return (
                            <UsersItems
                                key={conversation.conversation._id}
                                username={username}
                                conversationId={conversation.conversation._id}
                                avatarSrc={avatarSrc}
                                type={conversation.conversation.type}
                                lastMessage={lastMessage}
                                lastMessageTime={lastMessageTime}
                                online={online}
                                messageUnseen={messageUnseen}
                            />
                        )
                    })
                }
            </div>

        </div>
    )
}

export default Users;