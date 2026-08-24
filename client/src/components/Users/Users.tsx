import { useContext } from "react";
import { MessageSquare, Users as UsersIcon } from "lucide-react";
import { Link } from "react-router-dom";
import Header from "../Header/Header";
import UsersItems from "./UsersItems";
import UserItemsLoading from "../UI/UserItemsLoading";
import { AuthContext } from "../../contexts/AuthContext";
import { Participant, UserConversationRef } from "../../types";

const Users = () => {
    const { connectedUsers, user } = useContext(AuthContext);

    const hasConversations = user && Array.isArray(user.conversations) && user.conversations.length > 0;

    return (
        <div className="flex flex-col mb-16 md:mb-0 w-full md:w-[40%] lg:w-[25%] md:h-[100dvh] border-r border-border/80 bg-card/30 backdrop-blur-md">
            <Header message="Messages" />

            {!user && <UserItemsLoading />}

            {user && (
                <div className="flex-1 overflow-y-auto px-2 py-1 space-y-1 custom-scrollbar" id="user">
                    {hasConversations ? (
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
                    ) : (
                        <div className="flex flex-col items-center justify-center h-64 text-center px-4">
                            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-3">
                                <MessageSquare className="h-6 w-6" />
                            </div>
                            <p className="text-sm font-semibold text-foreground">No conversations yet</p>
                            <p className="text-xs text-muted-foreground mt-1 max-w-[220px]">
                                Start a chat with a teammate or create a group channel.
                            </p>
                            <Link
                                to="/people"
                                className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary/15 hover:bg-primary/25 text-primary text-xs font-semibold border border-primary/20 transition-all cursor-pointer"
                            >
                                <UsersIcon className="h-3.5 w-3.5" />
                                <span>Browse People</span>
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Users;
