import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TypingUser } from "../../types";

interface TypingBubbleProps {
    typingUsers: TypingUser[];
    conversationType?: string;
}

const DEFAULT_AVATAR = "https://res.cloudinary.com/dwyx9715k/image/upload/v1723145455/nexus/avatars/default_avatar.png";

const TypingBubble: React.FC<TypingBubbleProps> = ({ typingUsers, conversationType = "personal" }) => {
    if (!typingUsers || typingUsers.length === 0) return null;

    const firstUser = typingUsers[0];
    const isGroup = conversationType === "group";

    const typingNames = typingUsers
        .map((u) => u.userName?.split(" ")[0] || "Someone")
        .slice(0, 3);

    let typingLabel = `${typingNames[0]} is typing...`;
    if (typingNames.length === 2) {
        typingLabel = `${typingNames[0]} and ${typingNames[1]} are typing...`;
    } else if (typingNames.length > 2) {
        typingLabel = `${typingNames[0]}, ${typingNames[1]} and others are typing...`;
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="flex items-end gap-2.5 my-2 max-w-full"
                aria-live="polite"
                aria-label={typingLabel}
            >
                {/* User Avatar */}
                <div className="relative shrink-0 mb-0.5">
                    <img
                        src={firstUser.userPicture || DEFAULT_AVATAR}
                        alt={firstUser.userName || "Typing user"}
                        className="h-7 w-7 sm:h-8 sm:w-8 rounded-2xl object-cover ring-1 ring-border shadow-xs bg-muted"
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = DEFAULT_AVATAR;
                        }}
                    />
                </div>

                {/* Bubble Container */}
                <div className="flex flex-col items-start min-w-0 max-w-[85%] sm:max-w-[70%]">
                    {isGroup && (
                        <span className="text-[11px] font-semibold text-muted-foreground ml-2 mb-1 truncate">
                            {typingLabel}
                        </span>
                    )}

                    <div className="relative inline-flex items-center gap-2 px-3.5 py-2.5 rounded-2xl rounded-bl-xs bg-card border border-border/80 text-foreground shadow-xs">
                        {/* Animated Bouncing Sapphire Dots */}
                        <div className="flex items-center gap-1.5 py-0.5 px-0.5">
                            <motion.span
                                className="h-2 w-2 rounded-full bg-primary/80"
                                animate={{ y: [0, -4, 0] }}
                                transition={{
                                    duration: 0.6,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                    delay: 0,
                                }}
                            />
                            <motion.span
                                className="h-2 w-2 rounded-full bg-primary/80"
                                animate={{ y: [0, -4, 0] }}
                                transition={{
                                    duration: 0.6,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                    delay: 0.18,
                                }}
                            />
                            <motion.span
                                className="h-2 w-2 rounded-full bg-primary/80"
                                animate={{ y: [0, -4, 0] }}
                                transition={{
                                    duration: 0.6,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                    delay: 0.36,
                                }}
                            />
                        </div>

                        {!isGroup && (
                            <span className="text-xs text-muted-foreground font-medium select-none pr-1">
                                typing...
                            </span>
                        )}

                        {/* Incoming Message Speech Tail SVG */}
                        <svg
                            className="absolute -bottom-[2px] -left-[6px] w-[11px] h-[14px] pointer-events-none fill-card stroke-border/70"
                            viewBox="0 0 11 14"
                        >
                            <path d="M11,0 C9,4 5,10 0,14 C3,13 8,11 11,8 Z" />
                        </svg>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default TypingBubble;
