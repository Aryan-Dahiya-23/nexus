/* eslint-disable @typescript-eslint/no-explicit-any */
import { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { IoTrashSharp } from "react-icons/io5";
import OfflineAvatar from "../Avatar/OfflineAvatar";
import { ThemeContext } from "../../contexts/ThemeContext";
import { queryClient } from "../../api/auth";

const Drawer = ({ name, avatarSrc }) => {

    const { id } = useParams();

    const user: any = queryClient.getQueryData(['user']);
    const conversation: any = queryClient.getQueryData(['chats', id]);

    const [participants, setParticipants] = useState<string>("");
    const { setDeleteModal } = useContext(ThemeContext);

    const uncheckCheckbox = () => {
        const checkbox = document.getElementById("my-drawer-4") as HTMLInputElement | null;

        if (checkbox !== null) {
            checkbox.checked = false;
        }
    }

    useEffect(() => {
        const participantsList = conversation?.participants || [];
        const newParticipants = user.fullName + ", " + participantsList.map(participant => participant.fullName).join(', ');
        setParticipants(newParticipants);
    }, [conversation]);

    return (
        <div className="drawer drawer-end z-50">
            <input id="my-drawer-4" type="checkbox" className="drawer-toggle" />
            <div className="drawer-content">
                <label htmlFor="my-drawer-4" className="drawer-button">
                    <div className="flex flex-row space-x-1 md:p-1 cursor-pointer  hover:opacity-75 drawer-button">
                        <div className="h-1 w-1 md:h-1.5 md:w-1.5 rounded-full m-auto bg-sky-500"></div>
                        <div className="h-1 w-1 md:h-1.5 md:w-1.5 rounded-full m-auto bg-sky-500"></div>
                        <div className="h-1 w-1 md:h-1.5 md:w-1.5 rounded-full m-auto bg-sky-500"></div>
                    </div>
                </label>
            </div>

            <div className="drawer-side">
                <label htmlFor="my-drawer-4" aria-label="close sidebar" className="drawer-overlay"></label>

                <div className="flex flex-col justify-start pt-16 w-full md:w-1/2 lg:w-1/3 min-h-full bg-base-200 text-base-content">

                    <div className="flex flex-col justify-center items-center space-y-3 md:space-y-2">

                        {avatarSrc.length > 1 ?
                            <div className="flex flex-col-reverse justify-end items-center">
                                <div className="flex flex-row md:mt-1 space-x-1">
                                    <OfflineAvatar height="10" width="10" imgSrc={avatarSrc[0]} />
                                    <OfflineAvatar height="10" width="10" imgSrc={avatarSrc[1]} />
                                </div>
                                <OfflineAvatar height="10" width="10" imgSrc={avatarSrc[2]} />
                            </div>
                            :
                            <OfflineAvatar
                                imgSrc={avatarSrc[0]}
                                height="10" width="10"
                            />
                        }

                        <div className="flex flex-col justify-center items-center">
                            <span className="text-xl font-semibold">{name}</span>
                            <span className="text-gray-600 text-base">{avatarSrc.length === 1 ? 2 : avatarSrc.length} members</span>
                        </div>

                    </div>

                    <div className="flex flex-col justify-center items-center space-y-1 mt-12">
                        <button className="rounded-full h-12 w-12 bg-gray-200 hover:opacity-75" onClick={() => setDeleteModal(true)}>
                            <IoTrashSharp className="m-auto h-7 w-7 text-gray-500" />
                        </button>
                        <span>Delete</span>
                    </div>

                    {conversation &&
                        <div className="flex flex-col pl-5 mt-12">
                            <span className="text-gray-500">Members</span>
                            <p className="font-semibold">{participants}</p>
                        </div>
                    }

                    <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" onClick={uncheckCheckbox}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

            </div>
        </div>
    )
}

export default Drawer;