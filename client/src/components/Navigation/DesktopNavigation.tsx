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

    const scrollToTop = (divName: string) => {
        const Div = document.getElementById(divName);
        Div?.scrollTo({
            top: 0,
            behavior: 'smooth'
        })
    }

    const navigateHome = () => {
        navigate("/");
        scrollToTop('user');
    }

    const navigatePeople = () => {
        navigate("/people");
        scrollToTop('people');
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

    useEffect(() => {
        const path = location.pathname;

        if (path === "/") {
            setCurrentLocation('home')
        } else if (path === "/people") {
            setCurrentLocation("people")
        } else {
            setCurrentLocation("chats");
        }
    }, []);

    return (
        <div className="md:flex md:flex-col hidden justify-between items-center border-r-2 border-gray-200 md:w-[8%] lg:w-[5%] py-4">

            <div className="space-y-3 cursor-pointer">
                <div className={`hover:bg-gray-200 rounded-md p-2.5 ${(currentLocation === 'home' || currentLocation === 'chats') && 'bg-gray-200'}`} onClick={navigateHome}>
                    <BsFillChatDotsFill className="icons" />
                </div>

                <div className={`hover:bg-gray-200 rounded-md p-2.5 ${currentLocation === 'people' && 'bg-gray-200'}`} onClick={navigatePeople} onMouseEnter={prefetch} onTouchMove={prefetch} onFocus={prefetch} >
                    <MdPeopleAlt className="icons" />
                </div>

                <div className="hover:bg-gray-200 rounded-md p-2.5" onClick={handleLogout}>
                    <IoLogOutOutline className="icons" />
                </div>

            </div>

            <div className="cursor-pointer p-2">
                <RingAvatar
                    imgSrc={user && user.picture}
                    type="navigation"
                />
            </div>
        </div>
    )
}

export default DesktopNavigation;