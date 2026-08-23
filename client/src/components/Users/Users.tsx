import { useContext } from "react";
import Header from "../Header/Header";
import UsersItems from "./UsersItems";
import UserItemsLoading from "../UI/UserItemsLoading";
import { AuthContext } from "../../contexts/AuthContext";
import { Participant, UserConversationRef } from "../../types";

const Users = () => {

    const { connectedUsers } = useContext(AuthContext);
    const { user } = useContext(AuthContext);

    return (
        <div className="flex flex-col mb-16 md:mb-0 w-full md:w-[40%] lg:w-[25%] lg:pl-2 md:h-[100vh]">

            <Header message="Messages" />

            {!user && <UserItemsLoading />}

            <div className="flex flex-col space-y-1 py-2 custom-scrollbar" id="user">
                {user &&
                    user.conversations.map((conversation: UserConversationRef) => {

                        const conv = conversation?.conversation;
                        if (!conv) return null;

                        const firstParticipant = conv.participants && conv.participants.length > 0 ? conv.participants[0] : undefined;
                        const username = conv.type === 'group' ? conv.name : firstParticipant?.fullName;
                        const avatarSrc = [...(conv.participants || []).map((participant: Participant) => participant.picture), user.picture];

                        const lastMessage = conv.lastMessage ?
                            conv.lastMessage.type === 'text'
                                ? conv.lastMessage.content
                                : conv.lastMessage.type === 'image'
                                    ? 'Sent an Image'
                                    : 'Sent a video'
                            : 'Started a conversation';

                        const lastMessageTime = conv.lastMessage?.createdAt
                            ? new Date(conv.lastMessage.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
                            : '';

                        const online = conv.type === 'personal' && connectedUsers.length > 0 && firstParticipant?._id ? connectedUsers.includes(firstParticipant._id) : false;

                        const lastMsg = conv.lastMessage;
                        const lastMsgSenderId = lastMsg
                            ? typeof lastMsg.senderId === 'object' && lastMsg.senderId !== null
                                ? lastMsg.senderId._id
                                : lastMsg.senderId
                            : undefined;

                        const messageUnseen = Boolean(
                            user?._id &&
                            lastMsg &&
                            lastMsgSenderId !== user._id &&
                            !lastMsg.seenBy?.includes(user._id)
                        );

                        return (
                            <UsersItems
                                key={conv._id}
                                username={username || ""}
                                conversationId={conv._id}
                                avatarSrc={avatarSrc || []}
                                type={conv.type}
                                lastMessage={lastMessage}
                                lastMessageTime={lastMessageTime}
                                online={online}
                                messageUnseen={messageUnseen}
                            />
                        );
                    })
                }
            </div>

        </div>
    )
}

export default Users;
