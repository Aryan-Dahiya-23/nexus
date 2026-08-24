import { useContext } from "react";
import DesktopNavigation from "../components/Navigation/DesktopNavigation";
import MobileNavigation from "../components/Navigation/MobileNavigation";
import People from "../components/People/People";
import EmptyModal from "../components/UI/EmptyModal";
import LoadingIndicator from "../components/UI/LoadingIndicator/LoadingIndicator";
import GroupChatWidget from "../components/Widgets/GroupChatWidget";
import { ThemeContext } from "../contexts/ThemeContext";

const PeoplePage = () => {

    const { groupChatWidget } = useContext(ThemeContext);
    const { logoutLoading } = useContext(ThemeContext);

    return (
        <>

            {groupChatWidget && <GroupChatWidget />}

            {logoutLoading && (
                <div className="fixed inset-0 flex items-center justify-center bg-background/50 backdrop-blur-xs z-50 pointer-events-none">
                    <LoadingIndicator size="lg" />
                </div>
            )}

            <div className={`h-[100dvh] w-full bg-background text-foreground overflow-hidden md:flex md:flex-row transition-colors ${(groupChatWidget || logoutLoading) && "opacity-70"}`}>
                <DesktopNavigation />
                <MobileNavigation />
                <People />
                <EmptyModal />
            </div>
        </>
    );
};

export default PeoplePage;
