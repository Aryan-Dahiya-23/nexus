import { useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { MessageSquare, Users, LogOut } from "lucide-react";
import { AuthContext } from "../../contexts/AuthContext";
import { ThemeContext } from "../../contexts/ThemeContext";
import { queryClient } from "../../api/auth";
import { logout } from "../../api/auth";
import { fetchPeople } from "../../api/auth";

import ThemeToggle from "../UI/ThemeToggle";

import socket from "../../utils/socket";

const DEFAULT_AVATAR = "https://res.cloudinary.com/dwyx9715k/image/upload/v1723145455/nexus/avatars/default_avatar.png";

const MobileNavigation = () => {
    const navigate = useNavigate();
    const { user, setUser, setLoggedIn, setUserConnected, setConnectedUsers } = useContext(AuthContext);
    const { setLogoutLoading } = useContext(ThemeContext);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    const navigateHome = () => {
        if (window.location.pathname === '/chats')
            scrollToTop();
        navigate("/chats");
    };

    const navigatePeople = () => {
        if (window.location.pathname === '/people')
            scrollToTop();
        navigate("/people");
    };

    const handleLogout = () => {
        // 1. Instantly reset client auth state
        setUser(undefined);
        setLoggedIn(false);
        setUserConnected(false);
        setConnectedUsers([]);

        // 2. Clear React Query cache immediately
        queryClient.removeQueries({ queryKey: ['user'] });
        queryClient.clear();

        // 3. Disconnect real-time socket
        socket.disconnect();

        // 4. Clean up any UI locks
        setLogoutLoading(false);
        document.body.classList.remove('unclickable');

        // 5. Instantly redirect back to home page
        navigate('/', { replace: true });
        toast.success("You've been successfully logged out.");

        // 6. Perform backend session teardown in the background
        logout().catch((err) => {
            console.error("Error logging out from server:", err);
        });
    };

    const prefetch = () => {
        if (!user?._id) return;
        queryClient.prefetchQuery({
            queryKey: ['people'],
            queryFn: () => fetchPeople(user._id),
            staleTime: 60000,
        });
    };

    const location = useLocation();
    const isHomeActive = location.pathname.startsWith('/chats');
    const isPeopleActive = location.pathname === '/people';

    return (
        <div className="flex fixed bottom-0 h-[calc(4rem+env(safe-area-inset-bottom,0px))] pb-[env(safe-area-inset-bottom,0px)] bg-card/90 dark:bg-card/95 backdrop-blur-xl z-50 px-4 border-t border-border/80 flex-row justify-around items-center w-full md:hidden transition-colors shadow-lg">
            <button
                type="button"
                aria-label="Messages"
                className={`p-2.5 rounded-xl cursor-pointer transition-all active:scale-95 ${
                    isHomeActive
                        ? 'bg-primary/15 text-primary shadow-xs border border-primary/20 scale-105'
                        : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={navigateHome}
            >
                <MessageSquare className="h-5 w-5" />
            </button>

            <button
                type="button"
                aria-label="People Directory"
                className={`p-2.5 rounded-xl cursor-pointer transition-all active:scale-95 ${
                    isPeopleActive
                        ? 'bg-primary/15 text-primary shadow-xs border border-primary/20 scale-105'
                        : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={navigatePeople}
                onTouchMove={prefetch}
            >
                <Users className="h-5 w-5" />
            </button>

            <div className="p-1 flex items-center justify-center">
                <ThemeToggle />
            </div>

            <button
                type="button"
                className="p-2.5 rounded-xl cursor-pointer text-muted-foreground hover:text-rose-500 active:scale-95 transition-colors"
                onClick={handleLogout}
                title="Log Out"
                aria-label="Log Out"
            >
                <LogOut className="h-5 w-5" />
            </button>

            <div className="p-0.5 ring-2 ring-primary/30 rounded-full">
                <img
                    src={user?.picture || DEFAULT_AVATAR}
                    alt={user?.fullName || "User profile"}
                    className="h-8 w-8 rounded-full object-cover"
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = DEFAULT_AVATAR;
                    }}
                />
            </div>
        </div>
    );
};

export default MobileNavigation;
