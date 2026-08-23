import React, { useEffect, useState, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Video } from "lucide-react";
import Drawer from "../Drawer/Drawer";
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
        navigate("/chats");
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

    const isGroup = conversationType === 'group';

    return (
        <>
            {outgoingCall && <OutgoingCallWidget name={name} imgSrc={avatarSrc} onEndCall={handleEndCall} />}

            <div className="flex flex-row justify-between items-center h-16 px-3 sm:px-5 border-b border-border bg-card/60 backdrop-blur-xl shrink-0 transition-colors z-20">
                {/* Left: Back Arrow (Mobile) & Avatar + Info */}
                <div className="flex items-center space-x-3 overflow-hidden">
                    <button
                        type="button"
                        onClick={handleClick}
                        className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 md:hidden transition-colors"
                        aria-label="Back to messages"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>

                    <div className="flex items-center space-x-3 cursor-pointer">
                        {/* Avatar */}
                        <div className="relative shrink-0">
                            {isGroup ? (
                                <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-sky-500/20 border border-border flex items-center justify-center overflow-hidden">
                                    <div className="flex -space-x-2">
                                        {avatarSrc.slice(0, 2).map((src, i) => (
                                            <img
                                                key={i}
                                                src={src || "https://res.cloudinary.com/dgyocpgla/image/upload/v1711202863/nopathuser_lbf2om.png"}
                                                alt=""
                                                className="h-6 w-6 rounded-full border border-background object-cover"
                                            />
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="relative">
                                    <img
                                        src={avatarSrc[0] || "https://res.cloudinary.com/dgyocpgla/image/upload/v1711202863/nopathuser_lbf2om.png"}
                                        alt={name}
                                        className="h-10 w-10 rounded-2xl object-cover border border-border"
                                    />
                                    {online ? (
                                        <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-background animate-pulse" />
                                    ) : (
                                        <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-slate-400 ring-2 ring-background" />
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Title & Status */}
                        <div className="flex flex-col min-w-0">
                            <h2 className="font-bold text-sm sm:text-base text-foreground truncate tracking-tight">
                                {name || "Conversation"}
                            </h2>
                            <div className="flex items-center space-x-1.5 text-xs text-muted-foreground">
                                {isGroup ? (
                                    <span>{avatarSrc.length} members</span>
                                ) : online ? (
                                    <span className="text-emerald-500 font-medium flex items-center gap-1">
                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                        Active now
                                    </span>
                                ) : (
                                    <span>Offline</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Actions (Video Call & Details Drawer) */}
                <div className="flex items-center space-x-2 shrink-0">
                    <button
                        type="button"
                        onClick={handleVideoCall}
                        className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 transition-all cursor-pointer group shadow-sm"
                        title="Start 1080p Video Call"
                    >
                        <Video className="h-4 w-4 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-semibold hidden sm:inline">Call</span>
                    </button>

                    <Drawer name={name} avatarSrc={avatarSrc} />
                </div>
            </div>
        </>
    );
};

export default ChatHeader;
