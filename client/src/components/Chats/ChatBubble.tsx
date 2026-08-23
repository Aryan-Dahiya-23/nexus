import React, { useContext } from "react";
import { motion } from "framer-motion";
import { Check, CheckCheck } from "lucide-react";
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

    const cld = new Cloudinary({
        cloud: {
            cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
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

    const myImage = messageType === 'image' ? cld.image(message) : null;
    const myVideo = messageType === 'video' ? cld.video(message) : null;

    const handleImageWidget = () => {
        setImgSrc(message);
        setImageWidget(true);
    };

    const isRight = position === "right";

    return (
        <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.2 }}
            className={`flex w-full my-1.5 ${isRight ? "justify-end" : "justify-start"}`}
        >
            <div className={`flex items-end gap-2 max-w-[85%] sm:max-w-[75%] md:max-w-[65%] ${isRight ? "flex-row-reverse" : "flex-row"}`}>
                {/* Avatar (for incoming or group) */}
                {!isRight && (
                    <div className="relative shrink-0 mb-1">
                        <img
                            src={avatarSrc || "https://res.cloudinary.com/dgyocpgla/image/upload/v1711202863/nopathuser_lbf2om.png"}
                            alt=""
                            className="h-7 w-7 sm:h-8 sm:w-8 rounded-full object-cover border border-border"
                        />
                        {online && (
                            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-background" />
                        )}
                    </div>
                )}

                {/* Message Bubble Container */}
                <div className={`flex flex-col ${isRight ? "items-end" : "items-start"}`}>
                    {/* Sender name for group chats */}
                    {!isRight && conversationType === 'group' && (
                        <span className="text-[11px] font-semibold text-muted-foreground ml-2 mb-1">
                            {sender}
                        </span>
                    )}

                    {/* Bubble Content */}
                    <div
                        className={`relative px-4 py-2.5 shadow-sm text-sm sm:text-[15px] leading-relaxed break-words overflow-hidden ${
                            isRight
                                ? "bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 text-white rounded-2xl rounded-tr-xs"
                                : "bg-card text-card-foreground border border-border/80 rounded-2xl rounded-tl-xs"
                        }`}
                    >
                        {messageType === 'text' && (
                            <p className="whitespace-pre-wrap">{message}</p>
                        )}

                        {messageType === 'image' && myImage && (
                            <div className="rounded-xl overflow-hidden cursor-pointer group relative" onClick={handleImageWidget}>
                                <AdvancedImage
                                    className="max-h-72 w-auto object-cover rounded-xl group-hover:scale-102 transition-transform duration-200"
                                    cldImg={myImage}
                                    plugins={[responsive()]}
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-xl" />
                            </div>
                        )}

                        {messageType === 'video' && myVideo && (
                            <div className="rounded-xl overflow-hidden">
                                <AdvancedVideo
                                    className="max-h-72 w-auto object-cover rounded-xl"
                                    cldVid={myVideo}
                                    cldPoster="auto"
                                    sources={sources}
                                    plugins={[lazyload()]}
                                    preload="none"
                                    controls
                                />
                            </div>
                        )}

                        {/* Embedded Metadata / Timestamp */}
                        <div
                            className={`flex items-center justify-end gap-1 mt-1 text-[10px] select-none ${
                                isRight ? "text-cyan-100/80" : "text-muted-foreground"
                            }`}
                        >
                            <span>{formattedTime}</span>
                            {isRight && (
                                messageSeen ? (
                                    <CheckCheck className="h-3.5 w-3.5 text-white" />
                                ) : (
                                    <Check className="h-3.5 w-3.5 text-cyan-200/80" />
                                )
                            )}
                        </div>
                    </div>

                    {/* Seen by indicator for group or personal */}
                    {isRight && isLastMessage && messageSeen && (
                        <span className="text-[10px] text-muted-foreground mt-1 mr-1">
                            {conversationType === 'group' ? "Seen by all" : `Seen by ${footerName.split(" ")[0]}`}
                        </span>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default ChatBubble;
