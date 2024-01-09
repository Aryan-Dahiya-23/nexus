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

            {logoutLoading &&
                <div className="fixed top-[40%] left-[45%] md:top-[40%] md:left-[50%] z-50">
                {/* <span className="loading loading-spinner loading-lg text-info"></span> */}
                    <LoadingIndicator />
                </div>
            }

            <div className={`md:flex md:flex-row ${(groupChatWidget || logoutLoading) && "opacity-70"}`}>
                <DesktopNavigation />
                <MobileNavigation />
                <People />
                <EmptyModal />
            </div>
        </>
    )
}

export default PeoplePage;