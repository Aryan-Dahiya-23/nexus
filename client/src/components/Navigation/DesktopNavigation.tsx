import { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { MessageSquare, Users, LogOut } from "lucide-react";
import { queryClient } from "../../api/auth";
import { AuthContext } from "../../contexts/AuthContext";
import { ThemeContext } from "../../contexts/ThemeContext";
import { logout, fetchPeople } from "../../api/auth";

import ThemeToggle from "../UI/ThemeToggle";
import NexusLogo from "../UI/NexusLogo";

import socket from "../../utils/socket";

const DEFAULT_AVATAR = "https://res.cloudinary.com/dwyx9715k/image/upload/v1723145455/nexus/avatars/default_avatar.png";

const DesktopNavigation = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, setUser, setLoggedIn, setUserConnected, setConnectedUsers } = useContext(AuthContext);
    const { setLogoutLoading } = useContext(ThemeContext);

    const [currentLocation, setCurrentLocation] = useState<string>('home');

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

    const handleLogout = async () => {
        // 1. Show the loading overlay spinner until redirection completes
        setLogoutLoading(true);
        document.body.classList.add('unclickable');

        try {
            // 2. Disconnect real-time socket
            socket.disconnect();

            // 3. Perform backend session teardown
            await logout();
        } catch (err) {
            console.error("Error logging out from server:", err);
        } finally {
            // 4. Cancel queries and set query cache to logged-out state
            queryClient.cancelQueries();
            queryClient.setQueryData(['user'], null);
            queryClient.clear();

            // 5. Reset local auth state
            setUser(undefined);
            setLoggedIn(false);
            setUserConnected(false);
            setConnectedUsers([]);

            // 6. Clean up UI locks
            setLogoutLoading(false);
            document.body.classList.remove('unclickable');

            // 7. Instantly redirect back to home page
            navigate('/', { replace: true });
        }
    };

    const prefetch = () => {
        if (!user?._id) return;
        queryClient.prefetchQuery({
            queryKey: ['people'],
            queryFn: () => fetchPeople(user._id),
            staleTime: 60000,
        });
    };

    useEffect(() => {
        const path = location.pathname;

        if (path === "/people") {
            setCurrentLocation("people");
        } else {
            setCurrentLocation("chats");
        }
    }, [location.pathname]);

    return (
        <div className="md:flex md:flex-col hidden justify-between items-center border-r border-border bg-card/40 backdrop-blur-lg md:w-[72px] lg:w-[80px] py-5 h-screen shrink-0 transition-colors">
            <div className="space-y-4 flex flex-col items-center w-full px-2">
                <button
                    type="button"
                    title="Nexus"
                    aria-label="Nexus Home"
                    className="cursor-pointer mb-2 hover:scale-105 transition-transform"
                    onClick={navigateHome}
                >
                    <NexusLogo className="h-10 w-10" showText={false} />
                </button>

                <button
                    type="button"
                    title="Messages"
                    aria-label="Messages"
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center cursor-pointer transition-all ${
                        currentLocation === 'home' || currentLocation === 'chats'
                            ? 'bg-primary/15 text-primary shadow-xs border border-primary/20 scale-105'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
                    }`}
                    onClick={navigateHome}
                >
                    <MessageSquare className="h-5 w-5" />
                </button>

                <button
                    type="button"
                    title="People Directory"
                    aria-label="People Directory"
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center cursor-pointer transition-all ${
                        currentLocation === 'people'
                            ? 'bg-primary/15 text-primary shadow-xs border border-primary/20 scale-105'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
                    }`}
                    onClick={navigatePeople}
                    onMouseEnter={prefetch}
                    onTouchMove={prefetch}
                    onFocus={prefetch}
                >
                    <Users className="h-5 w-5" />
                </button>

                <div className="w-11 h-11 rounded-2xl flex justify-center items-center">
                    <ThemeToggle />
                </div>

                <button
                    type="button"
                    title="Log Out"
                    aria-label="Log Out"
                    className="w-11 h-11 rounded-2xl flex items-center justify-center cursor-pointer text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                    onClick={handleLogout}
                >
                    <LogOut className="h-5 w-5" />
                </button>
            </div>

            <div className="p-0.5 ring-2 ring-primary/30 hover:ring-primary rounded-full transition-all">
                <img
                    src={user?.picture || DEFAULT_AVATAR}
                    alt={user?.fullName || "User profile"}
                    className="h-9 w-9 md:h-10 md:w-10 rounded-full object-cover"
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = DEFAULT_AVATAR;
                    }}
                />
            </div>
        </div>
    );
};

export default DesktopNavigation;
