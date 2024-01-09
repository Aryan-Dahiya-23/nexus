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
        queryClient.prefetchQuery({
            queryKey: ['people'],
            queryFn: () => fetchPeople(user._id),
            staleTime: 60000,
        })
    }

    return (
        <div className="flex fixed bottom-0 h-16 bg-gray-50 z-50 px-3 border-t border-gray-400 flex-row justify-between w-full space-x-4 md:hidden">

            <div className={`flex p-2 h-full items-center rounded-md`} onClick={navigateHome}>
                <BsFillChatDotsFill className="icons" />
            </div>

            <div className={`flex p-2 h-full items-center rounded-md`} onClick={navigatePeople} onTouchMove={prefetch}>
                <MdPeopleAlt className="icons" />
            </div>

            <div className="flex p-2 h-full items-center" onClick={handleLogout}>
                <IoLogOutOutline className="icons" />
            </div>

            <div className="flex p-2 h-full items-center ">
                <RingAvatar
                    imgSrc={user && user.picture}
                    type="navigation"
                />
            </div>
        </div>
    )
}

export default MobileNavigation;