import { useContext } from "react";
import DesktopNavigation from "../components/Navigation/DesktopNavigation";
import MobileNavigation from "../components/Navigation/MobileNavigation";
import Users from "../components/Users/Users";
import Chats from "../components/Chats/Chats";
import Header from "../components/Header/Header";
import LoadingIndicator from "../components/UI/LoadingIndicator/LoadingIndicator";
import GroupChatWidget from "../components/Widgets/GroupChatWidget";
import ChatDeleteModal from "../components/UI/ChatDeleteModal";
import ImageWidget from "../components/Widgets/ImageWidget";
import { ThemeContext } from "../contexts/ThemeContext";

const ChatPage = () => {

    const isMobileScreen = () => window.innerWidth <= 647;

    const { groupChatWidget } = useContext(ThemeContext);
    const { logoutLoading } = useContext(ThemeContext);
    const { deleteModal } = useContext(ThemeContext);
    const { imageWidget } = useContext(ThemeContext);

    return (
        <>
            {groupChatWidget && <GroupChatWidget />}

            {deleteModal && <ChatDeleteModal />}

            {imageWidget && <ImageWidget />}

            {logoutLoading &&
                <div className="fixed top-[40%] left-[45%] md:top-[40%] md:left-[50%] z-50">
                    <LoadingIndicator />
                </div>
            }

            {isMobileScreen() ? (
                <>
                    <Header message="Hii" />
                    <Chats />
                </>
            ) : (
                <div className={`md:flex md:flex-row ${(groupChatWidget || logoutLoading || deleteModal) && "opacity-70"}`}>
                    <DesktopNavigation />
                    <MobileNavigation />
                    <Users />
                    <Chats />
                </div>
            )}
        </>
    );

}

export default ChatPage;