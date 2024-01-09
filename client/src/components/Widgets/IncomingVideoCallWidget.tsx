import { useContext, useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import RingAvatar from "../Avatar/RingAvatar";
import { ThemeContext } from "../../contexts/ThemeContext";
import incomingRingtone from "../../assets/incomingRingtone.mp3"

interface IncomingVideoCallProps {
    name: string;
    avatarSrc: string;
    userId: string;
    id: string;
}

const socket: Socket = io(import.meta.env.VITE_URL);

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
              .then(() => console.log('Audio played successfully'))
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
    }

    const rejectCall = () => {
        audio.play();
        setIncomingVideoCall(false);
    }

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            rejectCall();
        }, 15000);

        return () => clearTimeout(timeoutId);
    }, []);


    return (
        <div className="flex flex-row items-center space-x-4 px-4 py-5 fixed z-[9999] w-full bg-gray-800 border-2 border-sky-500 md:w-72 md:bottom-24 md:right-4">

            <div className="ml-6 lg:ml-0.5">
                <RingAvatar imgSrc={avatarSrc} type="incomingVideoCall" />
            </div>

            <div className="flex flex-col space-y-2.5">

                <div className="flex flex-col ml-1">
                    <span className="text-white">{name}</span>
                    <span className="text-white text-sm">Incoming video call</span>
                </div>

                <div className="flex flex-row space-x-4">
                    <button className="btn btn-sm btn-accent rounded-2xl text-white" onClick={acceptCall}>Accept</button>
                    <button className="btn btn-sm btn-error rounded-2xl text-white hover:opacity-75" onClick={rejectCall}>Reject</button>
                </div>
            </div>
        </div>
    )
}

export default IncomingVideoCallWidget;