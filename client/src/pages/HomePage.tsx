import { useContext } from "react";
import DesktopNavigation from "../components/Navigation/DesktopNavigation";
import MobileNavigation from "../components/Navigation/MobileNavigation";
import Users from "../components/Users/Users";
import EmptyModal from "../components/UI/EmptyModal";
import GroupChatWidget from "../components/Widgets/GroupChatWidget";
import { ThemeContext } from "../contexts/ThemeContext";

const HomePage = () => {
    const { groupChatWidget } = useContext(ThemeContext);

    return (
        <>
            {groupChatWidget && <GroupChatWidget />}

            <div className={`h-[100dvh] w-full bg-background text-foreground overflow-hidden md:flex md:flex-row transition-colors ${groupChatWidget ? "opacity-70" : ""}`}>
                <DesktopNavigation />
                <MobileNavigation />
                <Users />
                <EmptyModal />
            </div>
        </>
    );
};

export default HomePage;
