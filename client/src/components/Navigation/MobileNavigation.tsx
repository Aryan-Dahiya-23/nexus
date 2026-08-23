import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify"
import { BsFillChatDotsFill } from "react-icons/bs";
import { MdPeopleAlt } from "react-icons/md"
import { IoLogOutOutline } from "react-icons/io5"
import RingAvatar from "../Avatar/RingAvatar";
import { AuthContext } from "../../contexts/AuthContext";
import { ThemeContext } from "../../contexts/ThemeContext";
import { queryClient } from "../../api/auth";
import { logout } from "../../api/auth";
import { fetchPeople } from "../../api/auth";

import ThemeToggle from "../UI/ThemeToggle";

const MobileNavigation = () => {

    const navigate = useNavigate()
    const { user } = useContext(AuthContext);
    const { setLogoutLoading } = useContext(ThemeContext);

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
        })
    }

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

    const isHomeActive = window.location.pathname === '/' || window.location.pathname.startsWith('/chats');
    const isPeopleActive = window.location.pathname === '/people';

    return (
        <div className="flex fixed bottom-0 h-16 bg-card/90 backdrop-blur-xl z-50 px-4 border-t border-border flex-row justify-around items-center w-full md:hidden transition-colors">
            <div
                className={`p-2.5 rounded-xl cursor-pointer transition-all ${
                    isHomeActive
                        ? 'bg-primary/15 text-primary scale-105'
                        : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={navigateHome}
            >
                <BsFillChatDotsFill className="h-5 w-5" />
            </div>

            <div
                className={`p-2.5 rounded-xl cursor-pointer transition-all ${
                    isPeopleActive
                        ? 'bg-primary/15 text-primary scale-105'
                        : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={navigatePeople}
                onTouchMove={prefetch}
            >
                <MdPeopleAlt className="h-5 w-5" />
            </div>

            <div className="p-1 flex items-center justify-center">
                <ThemeToggle />
            </div>

            <div
                className="p-2.5 rounded-xl cursor-pointer text-muted-foreground hover:text-rose-500 transition-colors"
                onClick={handleLogout}
                title="Log Out"
            >
                <IoLogOutOutline className="h-5 w-5" />
            </div>

            <div className="p-1 ring-2 ring-primary/30 rounded-full">
                <RingAvatar
                    imgSrc={user?.picture || ""}
                    type="navigation"
                />
            </div>
        </div>
    );
};

export default MobileNavigation;
