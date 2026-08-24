import React, { useContext } from "react";
import { motion } from "framer-motion";
import { Check, CheckCheck, Maximize2 } from "lucide-react";
import { Cloudinary } from "@cloudinary/url-gen";
import { AdvancedImage, AdvancedVideo, responsive, lazyload } from "@cloudinary/react";
import { videoCodec } from "@cloudinary/url-gen/actions/transcode";
import { auto, vp9 } from '@cloudinary/url-gen/qualifiers/videoCodec';
import { ThemeContext } from "../../contexts/ThemeContext";

interface ChatBubbleProps {
    conversationType: string;
    position: string;
    sender: string;
    message: string;
    createdAt: string;
    avatarSrc: string;
    footerName: string;
    isLastMessage: boolean;
    online: boolean;
    messageSeen: boolean;
    messageType: string;
}

const DEFAULT_AVATAR = "https://res.cloudinary.com/dwyx9715k/image/upload/v1723145455/nexus/avatars/default_avatar.png";

const ChatBubble: React.FC<ChatBubbleProps> = ({
    conversationType,
    position,
    sender,
    message,
    createdAt,
    avatarSrc,
    footerName,
    isLastMessage,
    online,
    messageSeen,
    messageType,
}) => {
    const { setImageWidget, setImgSrc } = useContext(ThemeContext);

    const formattedTime = new Date(createdAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });

    const isRight = position === "right";
    const isMedia = messageType === 'image' || messageType === 'video';
    const isHttpUrl = typeof message === 'string' && (message.startsWith('http://') || message.startsWith('https://'));

    const cld = new Cloudinary({
        cloud: {
            cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dwyx9715k'
        }
    });

    const sources = [
        {
            type: 'mp4',
            codecs: ['avc1.4d002a'],
            transcode: videoCodec(auto())
        },
        {
            type: 'webm',
            codecs: ['vp8', 'vorbis'],
            transcode: videoCodec(vp9())
        }
    ];

    const myImage = messageType === 'image' && !isHttpUrl ? cld.image(message) : null;
    const myVideo = messageType === 'video' && !isHttpUrl ? cld.video(message) : null;

    const handleImageClick = () => {
        setImgSrc(message);
        setImageWidget(true);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
            className={`flex w-full my-1 sm:my-1.5 ${isRight ? "justify-end" : "justify-start"}`}
        >
            <div className={`flex items-end gap-2 max-w-[88%] sm:max-w-[78%] md:max-w-[68%] lg:max-w-[60%] ${isRight ? "flex-row-reverse" : "flex-row"}`}>
                {/* Avatar for received messages */}
                {!isRight && (
                    <div className="relative shrink-0 mb-1">
                        <img
                            src={avatarSrc || DEFAULT_AVATAR}
                            alt={sender}
                            className="h-7 w-7 sm:h-8 sm:w-8 rounded-full object-cover ring-1 ring-border/60 shadow-xs"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = DEFAULT_AVATAR;
                            }}
                        />
                        {online && (
                            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-background shadow-xs" />
                        )}
                    </div>
                )}

                {/* Message Bubble + Tail + Sender */}
                <div className={`flex flex-col min-w-0 ${isRight ? "items-end" : "items-start"}`}>
                    {/* Sender Name in Group Chats */}
                    {!isRight && conversationType === 'group' && (
                        <span className="text-[11px] font-bold text-primary ml-3 mb-1 tracking-tight">
                            {sender}
                        </span>
                    )}

                    {/* Speech Bubble Container with integrated Tail */}
                    <div className="relative group">
                        {/* THE MESSAGE BUBBLE */}
                        <div
                            className={`relative text-sm sm:text-[15px] leading-relaxed break-words shadow-sm transition-all ${
                                isMedia
                                    ? isRight
                                        ? "p-1 sm:p-1.5 bg-primary rounded-2xl rounded-br-sm shadow-sm"
                                        : "p-1 sm:p-1.5 bg-card border border-border rounded-2xl rounded-bl-sm shadow-xs"
                                    : isRight
                                        ? "px-4 py-2.5 bg-primary text-primary-foreground rounded-2xl rounded-br-sm shadow-sm"
                                        : "px-4 py-2.5 bg-card text-card-foreground border border-border rounded-2xl rounded-bl-sm shadow-xs"
                            }`}
                        >
                            {/* --- TEXT MESSAGE --- */}
                            {messageType === 'text' && (
                                <div className="space-y-1">
                                    <p className="whitespace-pre-wrap select-text font-normal">{message}</p>
                                    
                                    {/* Inline Timestamp & Seen Status */}
                                    <div
                                        className={`flex items-center justify-end gap-1 text-[10px] font-medium select-none pt-0.5 ${
                                            isRight ? "text-primary-foreground/80" : "text-muted-foreground/80"
                                        }`}
                                    >
                                        <span>{formattedTime}</span>
                                        {isRight && (
                                            messageSeen ? (
                                                <CheckCheck className="h-3.5 w-3.5 text-primary-foreground stroke-[2.5]" />
                                            ) : (
                                                <Check className="h-3.5 w-3.5 text-primary-foreground/75 stroke-[2.5]" />
                                            )
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* --- IMAGE MESSAGE --- */}
                            {messageType === 'image' && (
                                <div
                                    className="relative rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer group/img max-w-[360px] sm:max-w-[460px] md:max-w-[500px]"
                                    onClick={handleImageClick}
                                >
                                    {isHttpUrl ? (
                                        <img
                                            src={message}
                                            alt="Sent media"
                                            className="w-full max-h-[420px] sm:max-h-[500px] object-cover rounded-xl transition-transform duration-300 group-hover/img:scale-[1.015]"
                                        />
                                    ) : myImage ? (
                                        <AdvancedImage
                                            className="w-full max-h-[420px] sm:max-h-[500px] object-cover rounded-xl transition-transform duration-300 group-hover/img:scale-[1.015]"
                                            cldImg={myImage}
                                            plugins={[responsive()]}
                                        />
                                    ) : (
                                        <img
                                            src={`https://res.cloudinary.com/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dwyx9715k'}/image/upload/${message}`}
                                            alt="Sent media"
                                            className="w-full max-h-[420px] sm:max-h-[500px] object-cover rounded-xl transition-transform duration-300 group-hover/img:scale-[1.015]"
                                        />
                                    )}

                                    {/* Hover overlay hint */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                        <div className="p-2.5 rounded-full bg-black/60 text-white backdrop-blur-md shadow-lg transform scale-90 group-hover/img:scale-100 transition-transform">
                                            <Maximize2 className="h-4 w-4" />
                                        </div>
                                    </div>

                                    {/* Floating Glassmorphic Timestamp Pill */}
                                    <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-black/65 backdrop-blur-md text-white text-[10px] font-semibold flex items-center gap-1 shadow-md select-none pointer-events-none">
                                        <span>{formattedTime}</span>
                                        {isRight && (
                                            messageSeen ? (
                                                <CheckCheck className="h-3 w-3 text-cyan-300 stroke-[2.5]" />
                                            ) : (
                                                <Check className="h-3 w-3 text-white/80 stroke-[2.5]" />
                                            )
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* --- VIDEO MESSAGE --- */}
                            {messageType === 'video' && (
                                <div className="relative rounded-xl sm:rounded-2xl overflow-hidden max-w-[360px] sm:max-w-[460px] md:max-w-[500px]">
                                    {isHttpUrl ? (
                                        <video
                                            src={message}
                                            controls
                                            className="w-full max-h-[420px] sm:max-h-[500px] object-cover rounded-xl bg-black"
                                        />
                                    ) : myVideo ? (
                                        <AdvancedVideo
                                            className="w-full max-h-[420px] sm:max-h-[500px] object-cover rounded-xl bg-black"
                                            cldVid={myVideo}
                                            cldPoster="auto"
                                            sources={sources}
                                            plugins={[lazyload()]}
                                            preload="metadata"
                                            controls
                                        />
                                    ) : (
                                        <video
                                            src={`https://res.cloudinary.com/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dwyx9715k'}/video/upload/${message}`}
                                            controls
                                            className="w-full max-h-[420px] sm:max-h-[500px] object-cover rounded-xl bg-black"
                                        />
                                    )}

                                    {/* Floating Glassmorphic Timestamp Pill */}
                                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/65 backdrop-blur-md text-white text-[10px] font-semibold flex items-center gap-1 shadow-md select-none pointer-events-none">
                                        <span>{formattedTime}</span>
                                        {isRight && (
                                            messageSeen ? (
                                                <CheckCheck className="h-3 w-3 text-cyan-300 stroke-[2.5]" />
                                            ) : (
                                                <Check className="h-3 w-3 text-white/80 stroke-[2.5]" />
                                            )
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* SPEECH BUBBLE TAIL (SVG) */}
                        {isRight ? (
                            /* Outgoing Message Tail (Bottom-Right) */
                            <svg
                                className="absolute -bottom-[2px] -right-[6px] w-[11px] h-[14px] pointer-events-none text-blue-600 dark:text-blue-600 fill-current"
                                viewBox="0 0 11 14"
                            >
                                <path d="M0,0 C2,4 6,10 11,14 C8,13 3,11 0,8 Z" />
                            </svg>
                        ) : (
                            /* Incoming Message Tail (Bottom-Left) */
                            <svg
                                className="absolute -bottom-[2px] -left-[6px] w-[11px] h-[14px] pointer-events-none fill-card stroke-border/70"
                                viewBox="0 0 11 14"
                            >
                                <path d="M11,0 C9,4 5,10 0,14 C3,13 8,11 11,8 Z" />
                            </svg>
                        )}
                    </div>

                    {/* Seen by indicator for last message */}
                    {isRight && isLastMessage && messageSeen && (
                        <span className="text-[10px] font-medium text-muted-foreground/80 mt-1 mr-1">
                            {conversationType === 'group' ? "Seen by all" : `Seen by ${footerName.split(" ")[0]}`}
                        </span>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default ChatBubble;
