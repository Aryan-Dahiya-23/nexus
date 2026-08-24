import { useContext, useEffect, useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Video, PhoneOff, Sparkles } from "lucide-react";
import { ThemeContext } from "../../contexts/ThemeContext";
import incomingRingtone from "../../assets/incomingRingtone.mp3";
import socket from "../../utils/socket";

interface IncomingVideoCallProps {
    name: string;
    avatarSrc: string | string[];
    userId: string;
    id: string;
}

const DEFAULT_AVATAR = "https://res.cloudinary.com/dwyx9715k/image/upload/v1723145455/nexus/avatars/default_avatar.png";

const IncomingVideoCallWidget: React.FC<IncomingVideoCallProps> = ({ name, avatarSrc, userId, id }) => {
    const navigate = useNavigate();
    const { incomingVideoCall, setIncomingVideoCall } = useContext(ThemeContext);
    const [audio] = useState(new Audio(incomingRingtone));
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        audioRef.current = audio;

        const eventListener = () => {
            if (audioRef.current) {
                audioRef.current.play()
                    .then(() => {})
                    .catch(error => console.error('Error playing audio:', error));
            }

            window.removeEventListener('click', eventListener);
            window.removeEventListener('mousemove', eventListener);
            window.removeEventListener('scroll', eventListener);
        };

        window.addEventListener('click', eventListener);
        window.addEventListener('mousemove', eventListener);
        window.addEventListener('scroll', eventListener);

        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
            }
            window.removeEventListener('click', eventListener);
            window.removeEventListener('mousemove', eventListener);
            window.removeEventListener('scroll', eventListener);
        };
    }, [audio]);

    useEffect(() => {
        if (!incomingVideoCall && audioRef.current) {
            audioRef.current.pause();
        }
    }, [incomingVideoCall]);

    const acceptCall = () => {
        audio.pause();
        socket.emit('accept video call', userId, id);
        navigate(`/room/${id}`);
        setIncomingVideoCall(false);
    };

    const rejectCall = useCallback(() => {
        audio.pause();
        socket.emit('reject video call', userId, id);
        setIncomingVideoCall(false);
    }, [audio, userId, id, setIncomingVideoCall]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            rejectCall();
        }, 18000);

        return () => clearTimeout(timeoutId);
    }, [rejectCall]);

    const primaryAvatar = Array.isArray(avatarSrc) ? avatarSrc[0] : avatarSrc;

    const widgetContent = (
        <AnimatePresence>
            <div className="fixed z-[100] inset-x-3 top-3 sm:inset-x-4 sm:top-4 md:inset-x-auto md:top-auto md:bottom-6 md:right-6 md:w-96">
                <motion.div
                    initial={{ opacity: 0, y: -20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="relative overflow-hidden bg-slate-900/95 dark:bg-slate-900/98 backdrop-blur-2xl text-slate-100 border border-slate-700/80 rounded-3xl p-4 sm:p-5 shadow-2xl shadow-cyan-500/10"
                >
                    {/* Top cyan pulse accent */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-cyan-400 to-sky-500 animate-pulse" />

                    <div className="flex items-center space-x-3 sm:space-x-4">
                        {/* Radar Avatar with Pulsing Rings */}
                        <div className="relative shrink-0 flex items-center justify-center">
                            <span className="absolute h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-emerald-500/30 animate-ping" />
                            <span className="absolute h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-cyan-500/20 animate-pulse" />
                            <img
                                src={primaryAvatar || DEFAULT_AVATAR}
                                alt={name}
                                className="relative z-10 h-11 w-11 sm:h-13 sm:w-13 rounded-2xl object-cover ring-2 ring-emerald-400 shadow-md"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = DEFAULT_AVATAR;
                                }}
                            />
                        </div>

                        {/* Caller Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1 text-emerald-400 font-bold text-[10px] uppercase tracking-wider mb-0.5">
                                <Sparkles className="h-3 w-3 animate-spin" style={{ animationDuration: '4s' }} />
                                <span>Incoming Video Call</span>
                            </div>
                            <h4 className="text-sm sm:text-base font-extrabold text-white truncate tracking-tight">
                                {name}
                            </h4>
                            <p className="text-xs text-slate-400 truncate mt-0.5">
                                Encrypted WebRTC Stage
                            </p>
                        </div>
                    </div>

                    {/* Action Controls */}
                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-2.5">
                        <button
                            type="button"
                            onClick={rejectCall}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-rose-500/15 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/30 font-semibold text-xs transition-all cursor-pointer active:scale-95"
                        >
                            <PhoneOff className="h-4 w-4" />
                            <span>Decline</span>
                        </button>

                        <button
                            type="button"
                            onClick={acceptCall}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-semibold text-xs shadow-lg shadow-emerald-500/25 transition-all cursor-pointer active:scale-95 animate-pulse"
                        >
                            <Video className="h-4 w-4" />
                            <span>Accept</span>
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );

    return typeof document !== "undefined" ? createPortal(widgetContent, document.body) : widgetContent;
};

export default IncomingVideoCallWidget;
