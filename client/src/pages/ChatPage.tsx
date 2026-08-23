import { useContext } from "react";
import DesktopNavigation from "../components/Navigation/DesktopNavigation";
import MobileNavigation from "../components/Navigation/MobileNavigation";
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
                <div className="fixed top-[40%] left-[45%] md:top-[40%] md:left-[50%] z-50">
                    <LoadingIndicator />
                </div>
            )}

            {/* Desktop / Tablet side-by-side view */}
            <div className={`hidden md:flex md:flex-row ${isDimmed ? "opacity-70" : ""}`}>
                <DesktopNavigation />
                <MobileNavigation />
                <Users />
                <Chats />
            </div>

            {/* Mobile full-screen chat view */}
            <div className={`flex flex-col md:hidden w-full h-[100dvh] ${isDimmed ? "opacity-70" : ""}`}>
                <Chats />
            </div>
        </>
    );
};

export default ChatPage;