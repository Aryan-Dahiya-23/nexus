import { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { PhoneOff, Shield } from "lucide-react";

interface OutgoingCallWidgetProps {
    name: string;
    imgSrc: string[];
    onEndCall: () => void;
}

const DEFAULT_AVATAR = "https://res.cloudinary.com/dwyx9715k/image/upload/v1723145455/nexus/avatars/default_avatar.png";

const OutgoingCallWidget: React.FC<OutgoingCallWidgetProps> = ({ name, imgSrc, onEndCall }) => {
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            onEndCall();
        }, 18000);

        return () => clearTimeout(timeoutId);
    }, [onEndCall]);

    const isGroup = imgSrc.length > 1;

    const widgetContent = (
        <div className="fixed inset-0 z-[100] flex flex-col justify-between items-center py-10 sm:py-12 px-4 bg-background/95 text-foreground backdrop-blur-2xl animate-in fade-in duration-200 overflow-hidden h-[100dvh]">
            {/* Top Status Header */}
            <div className="flex flex-col items-center text-center space-y-2 mt-2 sm:mt-4 z-10">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted border border-border text-muted-foreground text-xs font-semibold">
                    <Shield className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Encrypted Video Call</span>
                </div>
                <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-foreground mt-2 max-w-md truncate">
                    {name}
                </h2>
                <div className="flex items-center gap-2 text-muted-foreground text-xs sm:text-sm font-medium">
                    <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                    <span>Calling & ringing...</span>
                </div>
            </div>

            {/* Central Avatar Display */}
            <div className="relative my-auto flex items-center justify-center z-10">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="relative z-10"
                >
                    {isGroup ? (
                        <div className="flex items-center -space-x-3 sm:-space-x-4">
                            {imgSrc.slice(0, 3).map((src, idx) => (
                                <img
                                    key={idx}
                                    src={src || DEFAULT_AVATAR}
                                    alt=""
                                    className="h-20 w-20 sm:h-32 sm:w-32 rounded-3xl object-cover ring-4 ring-background shadow-xl border border-border"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = DEFAULT_AVATAR;
                                    }}
                                />
                            ))}
                        </div>
                    ) : (
                        <img
                            src={imgSrc[0] || DEFAULT_AVATAR}
                            alt={name}
                            className="h-24 w-24 sm:h-36 sm:w-36 rounded-3xl object-cover ring-4 ring-border shadow-xl"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = DEFAULT_AVATAR;
                            }}
                        />
                    )}
                </motion.div>
            </div>

            {/* Bottom Actions: End Call */}
            <div className="flex flex-col items-center space-y-2.5 sm:space-y-3 mb-4 sm:mb-6 z-10">
                <button
                    type="button"
                    onClick={onEndCall}
                    className="group relative flex items-center justify-center h-14 w-14 sm:h-18 sm:w-18 rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow-xl shadow-rose-600/30 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                    aria-label="End call"
                >
                    <PhoneOff className="h-6 w-6 sm:h-8 sm:w-8 group-hover:rotate-12 transition-transform" />
                </button>
                <span className="text-xs text-slate-400 font-medium tracking-wide">End Call</span>
            </div>
        </div>
    );

    return typeof document !== "undefined" ? createPortal(widgetContent, document.body) : widgetContent;
};

export default OutgoingCallWidget;
