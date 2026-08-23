import { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { BsFillChatDotsFill } from "react-icons/bs";
import { MdPeopleAlt } from "react-icons/md"
import { IoLogOutOutline } from "react-icons/io5"
import RingAvatar from "../Avatar/RingAvatar";
import { queryClient } from "../../api/auth";
import { AuthContext } from "../../contexts/AuthContext";
import { ThemeContext } from "../../contexts/ThemeContext";
import { logout, fetchPeople } from "../../api/auth";


import ThemeToggle from "../UI/ThemeToggle";
import NexusLogo from "../UI/NexusLogo";

const DesktopNavigation = () => {

    const navigate = useNavigate()
    const location = useLocation();
    const { user } = useContext(AuthContext);
    const { setLogoutLoading } = useContext(ThemeContext);

    const [currentLocation, setCurrentLocation] = useState<string>('home');

    const { mutate } = useMutation({
        mutationFn: logout,
        onMutate: () => {
            setLogoutLoading(true);
        },
        onSuccess: async () => {
            queryClient.invalidateQueries();
            navigate("/login");
            toast.success("You've been successfully logged out.");
        },
        onSettled: async () => {
            setLogoutLoading(false);
            document.body.classList.remove('unclickable');
        },
    })

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    const navigateHome = () => {
        if (window.location.pathname === '/')
            scrollToTop();
        navigate("/");
    }

    const navigatePeople = () => {
        if (window.location.pathname === '/people')
            scrollToTop();
        navigate("/people");
    }

    const handleLogout = () => {
        mutate();
        document.body.classList.add('unclickable');
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

        if (path === "/") {
            setCurrentLocation('home');
        } else if (path === "/people") {
            setCurrentLocation("people");
        } else {
            setCurrentLocation("chats");
        }
    }, [location.pathname]);

    return (
        <div className="md:flex md:flex-col hidden justify-between items-center border-r border-border bg-card/40 backdrop-blur-lg md:w-[72px] lg:w-[80px] py-5 h-screen shrink-0 transition-colors">
            <div className="space-y-4 flex flex-col items-center w-full px-2">
                <div
                    title="Nexus"
                    className="cursor-pointer mb-2 hover:scale-105 transition-transform"
                    onClick={navigateHome}
                >
                    <NexusLogo className="h-10 w-10" showText={false} />
                </div>

                <div
                    title="Messages"
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center cursor-pointer transition-all ${
                        currentLocation === 'home' || currentLocation === 'chats'
                            ? 'bg-primary/15 text-primary shadow-sm border border-primary/20 scale-105'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
                    }`}
                    onClick={navigateHome}
                >
                    <BsFillChatDotsFill className="h-5 w-5" />
                </div>

                <div
                    title="People Directory"
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center cursor-pointer transition-all ${
                        currentLocation === 'people'
                            ? 'bg-primary/15 text-primary shadow-sm border border-primary/20 scale-105'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
                    }`}
                    onClick={navigatePeople}
                    onMouseEnter={prefetch}
                    onTouchMove={prefetch}
                    onFocus={prefetch}
                >
                    <MdPeopleAlt className="h-6 w-6" />
                </div>

                <div className="w-11 h-11 rounded-2xl flex justify-center items-center">
                    <ThemeToggle />
                </div>

                <div
                    title="Log Out"
                    className="w-11 h-11 rounded-2xl flex items-center justify-center cursor-pointer text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                    onClick={handleLogout}
                >
                    <IoLogOutOutline className="h-6 w-6" />
                </div>
            </div>

            <div className="cursor-pointer p-1 ring-2 ring-primary/30 hover:ring-primary rounded-full transition-all">
                <RingAvatar
                    imgSrc={user?.picture || ""}
                    type="navigation"
                />
            </div>
        </div>
    );
};

export default DesktopNavigation;
