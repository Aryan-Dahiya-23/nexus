import { useContext } from "react";
import DesktopNavigation from "../components/Navigation/DesktopNavigation";
import MobileNavigation from "../components/Navigation/MobileNavigation";
import People from "../components/People/People";
import EmptyModal from "../components/UI/EmptyModal";
import GroupChatWidget from "../components/Widgets/GroupChatWidget";
import { ThemeContext } from "../contexts/ThemeContext";

const PeoplePage = () => {
    const { groupChatWidget } = useContext(ThemeContext);

    return (
        <>
            {groupChatWidget && <GroupChatWidget />}

            <div className={`h-[100dvh] w-full bg-background text-foreground overflow-hidden md:flex md:flex-row transition-colors ${groupChatWidget ? "opacity-70" : ""}`}>
                <DesktopNavigation />
                <MobileNavigation />
                <People />
                <EmptyModal />
            </div>
        </>
    );
};

export default PeoplePage;
