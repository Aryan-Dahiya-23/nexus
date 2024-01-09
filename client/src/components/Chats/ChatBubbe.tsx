import { useContext } from "react";
import { Cloudinary } from "@cloudinary/url-gen";
import { AdvancedImage, AdvancedVideo, responsive, lazyload } from "@cloudinary/react"
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

    const { setImageWidget } = useContext(ThemeContext);
    const { setImgSrc } = useContext(ThemeContext);

    const formattedTime = new Date(createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })

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
        }];

    let myImage;
    let myVideo;

    if (messageType === 'image') {
        myImage = cld.image(message);
    } else if (messageType === 'video') {
        myVideo = cld.video(message);
    }

    const handleImageWidget = () => {
        setImgSrc(message);
        setImageWidget(true)
    }

    return (
        <div>
            {position === "right" ? (
                <div className="chat chat-end space-y-1">

                    <div className="chat-image online avatar">
                        <div className="w-12 h-12 rounded-full">
                            <img src={avatarSrc} alt="profile" />
                        </div>
                    </div>

                    <div className="chat-header">
                        {sender}
                        <time className="text-xs opacity-80 ml-1">{formattedTime}</time>
                    </div>
                    {messageType === 'text' ? (
                        <div className="chat-bubble text-white bg-sky-500 font-semibold">{message}</div>
                    ) : messageType === 'image' ? (
                        <AdvancedImage
                            className="max-w-[60%] md:max-w-[50%] lg:max-w-[25%] rounded-lg" 
                            onClick={handleImageWidget}
                            cldImg={myImage}
                            plugins={[responsive()]}
                        />
                    ) : (
                        <AdvancedVideo
                            className="max-w-[60%] md:max-w-[50%] lg:max-w-[25%] rounded-lg"
                            cldVid={myVideo}
                            cldPoster="auto"
                            sources={sources}
                            plugins={[lazyload()]}
                            preload="none"
                            controls
                        />
                    )
                    }

                    {isLastMessage && messageSeen &&
                        <div className="chat-footer opacity-90">
                            {conversationType === 'group' ?
                                "Seen by all"
                                :
                                "Seen by " + footerName.split(" ")[0]
                            }
                        </div>
                    }
                </div>
            ) : (

                <div className="chat chat-start space-y-1">

                    <div className={`chat-image avatar ${online && "online"}`}>
                        <div className="w-12 h-12 rounded-full">
                            <img src={avatarSrc} alt="profile" />
                        </div>
                    </div>

                    <div className="chat-header">
                        {sender}
                        <time className="text-xs opacity-80 ml-1">{formattedTime}</time>
                    </div>
                    {messageType === 'text' ? (
                        <div className="chat-bubble text-white bg-sky-500 font-semibold">{message}</div>
                    ) : messageType === 'image' ? (
                        <AdvancedImage
                            className="max-w-[60%] md:max-w-[50%] lg:max-w-[25%] rounded-lg"
                            onClick={handleImageWidget}
                            cldImg={myImage}
                            plugins={[responsive()]}
                        />
                    ) : (
                        <AdvancedVideo
                            className="max-w-[60%] md:max-w-[50%] lg:max-w-[25%] rounded-lg"
                            cldVid={myVideo}
                            cldPoster="auto"
                            sources={sources}
                            plugins={[lazyload()]}
                            preload="none"
                            controls
                        />
                    )
                    }
                </div>
            )}

        </div>
    );
};

export default ChatBubble;


