import { useState, useMemo, useContext } from "react";
import { MessageSquare, Users as UsersIcon, Search, X, CheckCheck } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import Header from "../Header/Header";
import UsersItems from "./UsersItems";
import UserItemsLoading from "../UI/UserItemsLoading";
import { AuthContext } from "../../contexts/AuthContext";
import { Participant, UserConversationRef } from "../../types";

interface ParsedConversationItem {
    conversationId: string;
    username: string;
    avatarSrc: string[];
    type: "personal" | "group";
    lastMessage: string;
    lastMessageTime: string;
    online: boolean;
    messageUnseen: boolean;
    participants: Participant[];
}

const Users = () => {
    const { connectedUsers, user } = useContext(AuthContext);
    const { id: activeConversationId } = useParams<{ id?: string }>();

    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState<"all" | "unread">("all");

    // Memoize processed conversations list from user context
    const parsedConversations = useMemo<ParsedConversationItem[]>(() => {
        if (!user || !Array.isArray(user.conversations)) return [];

        return user.conversations
            .filter((userConv: UserConversationRef) => Boolean(userConv && userConv.conversation && userConv.conversation._id))
            .map((userConv: UserConversationRef) => {
                const conv = userConv.conversation;
                const participants = conv.participants || [];
                const firstParticipant = participants.length > 0 ? participants[0] : undefined;
                const username = conv.type === "group" ? (conv.name || "Group Chat") : (firstParticipant?.fullName || "Chat");
                const avatarSrc = [...participants.map((p: Participant) => p.picture), user.picture].filter(Boolean);

                const lastMessage = conv.lastMessage
                    ? conv.lastMessage.type === "text"
                        ? conv.lastMessage.content
                        : conv.lastMessage.type === "image"
                            ? "Sent an Image"
                            : "Sent a video"
                    : "Started a conversation";

                const lastMessageTime = conv.lastMessage?.createdAt
                    ? new Date(conv.lastMessage.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })
                    : "";

                const online = conv.type === "personal" && connectedUsers.length > 0 && Boolean(firstParticipant?._id)
                    ? connectedUsers.includes(firstParticipant?._id as string)
                    : false;

                const lastMsg = conv.lastMessage;
                const lastMsgSenderId = lastMsg
                    ? typeof lastMsg.senderId === "object" && lastMsg.senderId !== null
                        ? (lastMsg.senderId as Participant)._id
                        : lastMsg.senderId
                    : undefined;

                const messageUnseen = Boolean(
                    user._id &&
                    lastMsg &&
                    lastMsgSenderId !== user._id &&
                    !lastMsg.seenBy?.includes(user._id)
                );

                return {
                    conversationId: conv._id,
                    username,
                    avatarSrc,
                    type: conv.type,
                    lastMessage,
                    lastMessageTime,
                    online,
                    messageUnseen,
                    participants,
                };
            });
    }, [user, connectedUsers]);

    const unreadCount = useMemo(() => {
        return parsedConversations.filter((c) => c.messageUnseen).length;
    }, [parsedConversations]);

    const filteredConversations = useMemo(() => {
        let list = parsedConversations;

        if (activeTab === "unread") {
            list = list.filter((c) => c.messageUnseen);
        }

        if (searchTerm.trim()) {
            const query = searchTerm.toLowerCase().trim();
            list = list.filter((c) => {
                const nameMatch = c.username.toLowerCase().includes(query);
                const messageMatch = c.lastMessage.toLowerCase().includes(query);
                const participantMatch = c.participants.some((p) => p.fullName?.toLowerCase().includes(query));
                return nameMatch || messageMatch || participantMatch;
            });
        }

        return list;
    }, [parsedConversations, activeTab, searchTerm]);

    const hasAnyConversations = parsedConversations.length > 0;

    return (
        <div className="flex flex-col h-[calc(100dvh-4rem)] md:h-[100dvh] w-full md:w-[40%] lg:w-[25%] border-r border-border/80 bg-card/30 backdrop-blur-md overflow-hidden">
            <Header message="Messages" />

            {!user && <UserItemsLoading />}

            {user && (
                <>
                    {/* Search & Filter section when user has conversations */}
                    {hasAnyConversations && (
                        <div className="px-3 pt-2.5 pb-1.5 space-y-2 shrink-0">
                            {/* Search Bar */}
                            <div className="flex items-center gap-2 px-3 h-9 rounded-xl bg-background border border-input focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                                <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0 pointer-events-none" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search messages..."
                                    className="w-full bg-transparent text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
                                />
                                {searchTerm && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchTerm("")}
                                        className="p-0.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer shrink-0"
                                        aria-label="Clear search"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                )}
                            </div>

                            {/* Filter Tabs & Counts */}
                            <div className="flex items-center justify-between gap-1 p-1 rounded-xl bg-muted/60 text-xs font-medium">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab("all")}
                                    className={`flex-1 flex items-center justify-center gap-1.5 py-1 px-2 rounded-lg transition-all cursor-pointer ${
                                        activeTab === "all"
                                            ? "bg-background text-foreground shadow-xs font-semibold"
                                            : "text-muted-foreground hover:text-foreground"
                                    }`}
                                >
                                    <MessageSquare className="h-3 w-3" />
                                    <span>All</span>
                                    <span className="text-[10px] font-mono opacity-70">({parsedConversations.length})</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setActiveTab("unread")}
                                    className={`flex-1 flex items-center justify-center gap-1.5 py-1 px-2 rounded-lg transition-all cursor-pointer ${
                                        activeTab === "unread"
                                            ? "bg-background text-foreground shadow-xs font-semibold"
                                            : "text-muted-foreground hover:text-foreground"
                                    }`}
                                >
                                    {unreadCount > 0 && (
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                                        </span>
                                    )}
                                    <span>Unread</span>
                                    <span className={`text-[10px] font-mono ${unreadCount > 0 ? "text-primary font-bold" : "opacity-70"}`}>
                                        ({unreadCount})
                                    </span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Conversations List Stream */}
                    <div className="flex-1 overflow-y-auto px-2 py-1 space-y-1 custom-scrollbar" id="user">
                        {filteredConversations.length > 0 ? (
                            filteredConversations.map((item) => (
                                <div
                                    key={item.conversationId}
                                    className={`rounded-2xl transition-all ${
                                        item.conversationId === activeConversationId
                                            ? "bg-accent/70 ring-1 ring-primary/30 shadow-xs"
                                            : ""
                                    }`}
                                >
                                    <UsersItems
                                        username={item.username}
                                        conversationId={item.conversationId}
                                        avatarSrc={item.avatarSrc}
                                        type={item.type}
                                        lastMessage={item.lastMessage}
                                        lastMessageTime={item.lastMessageTime}
                                        online={item.online}
                                        messageUnseen={item.messageUnseen}
                                    />
                                </div>
                            ))
                        ) : hasAnyConversations ? (
                            // Empty Search / Filter State
                            <div className="flex flex-col items-center justify-center h-52 text-center px-4">
                                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-3">
                                    {activeTab === "unread" ? (
                                        <CheckCheck className="h-5 w-5 opacity-60 text-emerald-500" />
                                    ) : (
                                        <Search className="h-5 w-5 opacity-60" />
                                    )}
                                </div>
                                <p className="text-sm font-semibold text-foreground">
                                    {activeTab === "unread"
                                        ? "All caught up"
                                        : searchTerm
                                        ? "No matching conversations"
                                        : "No conversations"}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
                                    {activeTab === "unread"
                                        ? "You have no unread messages."
                                        : searchTerm
                                        ? `No chats matched "${searchTerm}". Try another search term.`
                                        : "Start chatting with your team."}
                                </p>
                                {searchTerm && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchTerm("")}
                                        className="mt-3 text-xs text-primary hover:underline font-semibold cursor-pointer"
                                    >
                                        Clear search
                                    </button>
                                )}
                            </div>
                        ) : (
                            // Global Empty State: No Conversations
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
                </>
            )}
        </div>
    );
};

export default Users;
