import { useContext } from "react";
import DesktopNavigation from "../components/Navigation/DesktopNavigation";
import Users from "../components/Users/Users";
import Chats from "../components/Chats/Chats";
import LoadingIndicator from "../components/UI/LoadingIndicator/LoadingIndicator";
import GroupChatWidget from "../components/Widgets/GroupChatWidget";
import ChatDeleteModal from "../components/UI/ChatDeleteModal";
import ImageWidget from "../components/Widgets/ImageWidget";
import { ThemeContext } from "../contexts/ThemeContext";

const ChatPage = () => {
    const { groupChatWidget, logoutLoading, deleteModal, imageWidget } = useContext(ThemeContext);

    const isDimmed = Boolean(groupChatWidget || logoutLoading || deleteModal);

    return (
        <>
            {groupChatWidget && <GroupChatWidget />}
            {deleteModal && <ChatDeleteModal />}
            {imageWidget && <ImageWidget />}

            {logoutLoading && (
                <div className="fixed inset-0 flex items-center justify-center bg-background/50 backdrop-blur-xs z-50 pointer-events-none">
                    <LoadingIndicator size="lg" />
                </div>
            )}

            {/* Desktop / Tablet side-by-side view */}
            <div className={`hidden md:flex md:flex-row h-[100dvh] w-full bg-background text-foreground overflow-hidden ${isDimmed ? "opacity-70" : ""}`}>
                <DesktopNavigation />
                <Users />
                <Chats />
            </div>

            {/* Mobile full-screen chat view */}
            <div className={`flex flex-col md:hidden w-full h-[100dvh] bg-background text-foreground overflow-hidden ${isDimmed ? "opacity-70" : ""}`}>
                <Chats />
            </div>
        </>
    );
};

export default ChatPage;
