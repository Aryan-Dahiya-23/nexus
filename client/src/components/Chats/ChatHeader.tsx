import { useEffect, useState, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { IoIosArrowBack, IoIosVideocam } from "react-icons/io";
import Drawer from "../Drawer/Drawer";
import OnlineAvatar from "../Avatar/OnlineAvatar";
import OfflineAvatar from "../Avatar/OfflineAvatar";
import OutgoingCallWidget from "../Widgets/OutgoingCallWidget";
import { AuthContext } from "../../contexts/AuthContext";
import { ThemeContext } from "../../contexts/ThemeContext";
import incomingRingtone from "../../assets/incomingRingtone.mp3";
import socket from "../../utils/socket";

interface ChatHeaderProps {
    name: string;
    avatarSrc: string[];
    online: boolean;
    conversationType: string;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ name, avatarSrc, online, conversationType }) => {

    const navigate = useNavigate();
    const { id } = useParams();

    const [audio] = useState(new Audio(incomingRingtone));

    const { user } = useContext(AuthContext);
    const { outgoingCall, setOutgoingCall } = useContext(ThemeContext);

    const handleClick = () => {
        navigate("/");
    };

    const handleVideoCall = () => {
        if (!user) return;
        socket.emit('video call', name, user.picture || "", user._id, id);
        setOutgoingCall(true);
        audio.play().catch(() => {});
    };

    const handleEndCall = () => {
        setOutgoingCall(false);
        audio.pause();
    };

    useEffect(() => {
        const handleReject = (convId: string) => {
            if (convId === id) {
                setOutgoingCall(false);
                audio.pause();
            }
        };

        socket.on('reject video call', handleReject);

        return () => {
            socket.off('reject video call', handleReject);
            audio.pause();
        };
    }, [id, audio, setOutgoingCall]);

    return (
        <>

            {outgoingCall && <OutgoingCallWidget name={name} imgSrc={avatarSrc} onEndCall={handleEndCall} />}

            <div className="flex flex-row justify-between items-center min-h-[10%] lg:min-h-[12%] px-2 md:px-5 border-b-2 border-gray-200">

                <div className="text-sky-500 mr-2 md:hidden" onClick={handleClick}>
                    <IoIosArrowBack className="h-8 w-8" />
                </div>


                <div className="flex flex-row justify-center space-x-2.5 cursor-pointer">

                    {conversationType === 'personal' ?
                        online ?
                            <OnlineAvatar
                                height="12"
                                width="12"
                                imgSrc={avatarSrc[0]}
                            />
                            :
                            <OfflineAvatar
                                height="12"
                                width="12"
                                imgSrc={avatarSrc[0]}
                            />
                        :
                        <div className="flex flex-col-reverse justify-end items-center">
                            <div className="flex flex-row md:mt-1 space-x-1">
                                <OfflineAvatar height="6" width="6" imgSrc={avatarSrc[0]} />
                                <OfflineAvatar height="6" width="6" imgSrc={avatarSrc[1]} />
                            </div>
                            <OfflineAvatar height="6" width="6" imgSrc={avatarSrc[2]} />
                        </div>
                    }

                    <div className="flex flex-col">
                        <p className="font-semibold text-lg">
                            {name}
                        </p>
                        <p className="text-gray-500 text-sm">
                            {conversationType === 'personal' ?
                                online ? "Online" : "Offline"
                                :
                                avatarSrc.length + " Members"
                            }
                        </p>
                    </div>
                </div>

                <div className="flex flex-row justify-center items-center space-x-4 md:space-x-3 ml-auto">

                    <div className="flex flex-row">
                        <IoIosVideocam className="chat-icons text-sky-500 hover:opacity-75" onClick={handleVideoCall} />
                    </div>

                    <Drawer
                        name={name}
                        avatarSrc={avatarSrc}
                    />

                </div>
            </div>
        </>
    )
}

export default ChatHeader;