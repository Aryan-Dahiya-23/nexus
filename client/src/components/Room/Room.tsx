import { useRef, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { Loader2, ArrowLeft, Shield, Video } from "lucide-react";
import apiClient from "../../api/client";

const Room = () => {
    const navigate = useNavigate();
    const { roomId } = useParams();
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let zcInstance: ReturnType<typeof ZegoUIKitPrebuilt.create> | null = null;

        const initMeeting = async () => {
            if (!containerRef.current) return;

            try {
                setIsLoading(true);
                setError(null);
                const targetRoomId = roomId || 'nexus_room';

                // Ensure any previous static instance is cleared before creating a new one
                ZegoUIKitPrebuilt.core = undefined;

                const response = await apiClient.get(`/conversation/zego-token/${targetRoomId}`);
                const { token, appID, serverSecret, userId, userName } = response.data;

                if (!appID || (!token && !serverSecret)) {
                    throw new Error(response.data?.message || "Failed to obtain valid credentials from server");
                }

                const cleanUserId = String(userId || "nexus_user").trim();
                const cleanUserName = String(userName || "Nexus User").trim();

                let kitToken: string;
                if (serverSecret) {
                    kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
                        Number(appID),
                        serverSecret,
                        String(targetRoomId),
                        cleanUserId,
                        cleanUserName
                    );
                } else {
                    kitToken = ZegoUIKitPrebuilt.generateKitTokenForProduction(
                        Number(appID),
                        token,
                        String(targetRoomId),
                        cleanUserId,
                        cleanUserName
                    );
                }

                zcInstance = ZegoUIKitPrebuilt.create(kitToken);
                setIsLoading(false);

                zcInstance.joinRoom({
                    container: containerRef.current,
                    scenario: {
                        mode: ZegoUIKitPrebuilt.GroupCall,
                    },
                    videoResolutionDefault: ZegoUIKitPrebuilt.VideoResolution_720P,
                    showPreJoinView: false,
                    showRoomTimer: true,
                    onLeaveRoom: () => {
                        navigate('/chats');
                    },
                });
            } catch (err: unknown) {
                console.error("Error initializing video room:", err);
                const errorMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
                    || (err as Error)?.message
                    || "Failed to join video room.";
                setError(errorMsg);
                setTimeout(() => {
                    navigate('/chats');
                }, 3500);
            }
        };

        initMeeting();

        return () => {
            if (zcInstance && typeof zcInstance.destroy === 'function') {
                try {
                    zcInstance.destroy();
                } catch {
                    // Ignore cleanup errors
                }
            }
            ZegoUIKitPrebuilt.core = undefined;
        };
    }, [roomId, navigate]);

    return (
        <div className="relative w-full h-[100dvh] bg-slate-950 text-white overflow-hidden">
            {/* Top Floating Glass HUD */}
            <div className="absolute top-4 left-4 right-4 z-40 flex items-center justify-between pointer-events-none">
                <div className="flex items-center space-x-2 pointer-events-auto">
                    <button
                        type="button"
                        onClick={() => navigate('/chats')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-700/60 backdrop-blur-md transition-colors cursor-pointer shadow-md"
                        aria-label="Return to Chats"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        <span>Chats</span>
                    </button>

                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 text-slate-200 text-xs font-mono border border-slate-700/60 backdrop-blur-md shadow-md">
                        <Video className="h-3.5 w-3.5 text-cyan-400" />
                        <span className="truncate max-w-[140px] sm:max-w-[200px]">{roomId || 'Room'}</span>
                    </div>
                </div>

                <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 text-emerald-400 text-xs font-semibold border border-slate-700/60 backdrop-blur-md shadow-md">
                    <Shield className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Encrypted Video Stream</span>
                </div>
            </div>

            {/* Loading / Error States */}
            {isLoading && !error && (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950 text-white space-y-4">
                    <div className="relative flex items-center justify-center">
                        <div className="h-16 w-16 rounded-full border-2 border-primary/30 animate-ping absolute" />
                        <div className="h-14 w-14 rounded-2xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary">
                            <Video className="h-7 w-7 animate-pulse" />
                        </div>
                    </div>
                    <div className="text-center">
                        <p className="text-base font-bold text-slate-100 tracking-tight">Connecting to Media Stage...</p>
                        <p className="text-xs text-slate-400 mt-1">Establishing encrypted WebRTC channel</p>
                    </div>
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
            )}

            {error && (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950 text-white space-y-3 p-4 text-center">
                    <p className="text-sm font-semibold text-rose-400">{error}</p>
                    <p className="text-xs text-slate-500">Taking you back to your conversations...</p>
                </div>
            )}

            {/* Video Container */}
            <div ref={containerRef} className="w-full h-full" />
        </div>
    );
};

export default Room;
