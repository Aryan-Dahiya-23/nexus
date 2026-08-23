import { useContext } from "react";
import DesktopNavigation from "../components/Navigation/DesktopNavigation";
import MobileNavigation from "../components/Navigation/MobileNavigation";
import Users from "../components/Users/Users";
import EmptyModal from "../components/UI/EmptyModal";
import LoadingIndicator from "../components/UI/LoadingIndicator/LoadingIndicator";
import GroupChatWidget from "../components/Widgets/GroupChatWidget";
import { ThemeContext } from "../contexts/ThemeContext";

const HomePage = () => {

    const { groupChatWidget } = useContext(ThemeContext);
    const { logoutLoading } = useContext(ThemeContext);

    return (
        <>

            {groupChatWidget && <GroupChatWidget />}

            {logoutLoading &&
                <div className="fixed top-[40%] left-[45%] md:top-[40%] md:left-[50%] z-50">
                    {/* <span className="loading loading-spinner loading-lg text-info"></span> */}
                    <LoadingIndicator />
                </div>
            }

            <div className={`h-screen w-full bg-background text-foreground overflow-hidden md:flex md:flex-row transition-colors ${(groupChatWidget || logoutLoading) && "opacity-70"}`}>
                <DesktopNavigation />
                <MobileNavigation />
                <Users />
                <EmptyModal />
            </div>
        </>
    );
};

export default HomePage;
