import { useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import apiClient from "../../api/client";

const Room = () => {
    const navigate = useNavigate();
    const { roomId } = useParams();
    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        let zcInstance: any = null;

        const initMeeting = async () => {
            if (!containerRef.current) return;

            try {
                const targetRoomId = roomId || 'nexus_room';
                const response = await apiClient.get(`/conversation/zego-token/${targetRoomId}`);
                const { kitToken } = response.data;

                if (!kitToken) {
                    throw new Error("Failed to obtain kitToken from server");
                }

                zcInstance = ZegoUIKitPrebuilt.create(kitToken);
                zcInstance.joinRoom({
                    container: containerRef.current,
                    scenario: {
                        mode: ZegoUIKitPrebuilt.GroupCall,
                    },
                    videoResolutionDefault: ZegoUIKitPrebuilt.VideoResolution_720P,
                    showPreJoinView: false,
                    showRoomTimer: true,
                    onLeaveRoom: () => {
                        navigate('/');
                    },
                });
            } catch (error) {
                console.error("Error initializing video room:", error);
                navigate('/');
            }
        };

        initMeeting();

        return () => {
            if (zcInstance && typeof zcInstance.destroy === 'function') {
                zcInstance.destroy();
            }
        };
    }, [roomId, navigate]);

    return (
        <div ref={containerRef} style={{ width: '100vw', height: '100dvh' }} />
    );
};

export default Room;