import { useEffect } from "react";
import { MdCallEnd } from "react-icons/md";
import RingAvatar from "../Avatar/RingAvatar";

const OutgoingCallWidget = ({ name, imgSrc, onEndCall }) => {

    const endCall = () => {
        onEndCall();
    }

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            onEndCall();
        }, 15000);

        return () => clearTimeout(timeoutId);
    }, []);

    return (
        <div className="h-[100dvh] w-full right-0 fixed flex flex-col py-20 md:py-24 lg:py-16 items-center space-y-20 md:space-y-32 lg:space-y-20 z-[999] bg-gray-800">

            <div className="flex flex-col justify-center items-center space-y-2 text-white">
                <span className="text-4xl md:text-5xl">{name}</span>
                <span>Calling</span>
            </div>

            {imgSrc.length > 1 ?
                <div className="flex flex-col-reverse justify-end items-center">
                    <div className="flex flex-row mt-2 space-x-5">
                        <RingAvatar imgSrc={imgSrc[0]} type="outgoingGroupVideoCall" />
                        <RingAvatar imgSrc={imgSrc[1]} type="outgoingGroupVideoCall" />
                    </div>
                    <RingAvatar imgSrc={imgSrc[2]} type="outgoingGroupVideoCall" />
                </div>
                :
                <RingAvatar
                    imgSrc={imgSrc[0]} type="outgoingVideoCall" />
            }

            <div>
                <button className="rounded-full p-3 text-white bg-red-500 hover:opacity-80" onClick={endCall}>
                    <MdCallEnd className="h-8 w-8" />
                </button>
            </div>
        </div>
    )
}

export default OutgoingCallWidget;

