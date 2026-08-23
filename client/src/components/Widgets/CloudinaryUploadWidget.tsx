import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { HiPhoto } from "react-icons/hi2";
import { AuthContext } from "../../contexts/AuthContext";

interface CloudinaryUploadResultInfo {
    public_id: string;
    resource_type?: string;
    video?: boolean;
    secure_url?: string;
}

interface CloudinaryUploadResult {
    event: string;
    info: CloudinaryUploadResultInfo;
}

interface CloudinaryWidgetInstance {
    open: () => void;
    close?: () => void;
}

declare global {
    interface Window {
        cloudinary?: {
            createUploadWidget: (
                options: Record<string, unknown>,
                callback: (error: Error | null, result: CloudinaryUploadResult | undefined) => void
            ) => CloudinaryWidgetInstance;
        };
    }
}

interface CloudinaryUploadWidgetProps {
    uwConfig: Record<string, unknown>;
}

interface CloudinaryScriptContextProps {
    loaded: boolean;
}

const CloudinaryScriptContext = createContext<CloudinaryScriptContextProps>({ loaded: false });

const CloudinaryUploadWidget: React.FC<CloudinaryUploadWidgetProps> = ({ uwConfig }) => {
    const { setMessageUrl, setMessageType } = useContext(AuthContext);
    const [loaded, setLoaded] = useState(false);
    const [loading, setLoading] = useState(false);
    const [prefetch, setPrefetch] = useState(false);

    useEffect(() => {
        if (!loaded) {
            const uwScript = document.getElementById("uw");
            if (!uwScript) {
                const script = document.createElement("script");
                script.setAttribute("async", "");
                script.setAttribute("id", "uw");
                script.src = "https://upload-widget.cloudinary.com/global/all.js";
                script.addEventListener("load", () => {
                    setLoaded(true);
                });
                document.body.appendChild(script);
            } else {
                setLoaded(true);
            }
        }
    }, [loaded]);

    const initializeCloudinaryWidget = useCallback((type: string) => {
        if (loaded && window.cloudinary) {
            if (type === 'click') setLoading(true);

            const myWidget = window.cloudinary.createUploadWidget(
                uwConfig,
                (error: Error | null, result: CloudinaryUploadResult | undefined) => {
                    setLoading(false);
                    if (!error && result && result.event === "success") {
                        if (result.info.video || result.info.resource_type === 'video') {
                            setMessageType('video');
                        } else {
                            setMessageType('image');
                        }
                        setMessageUrl(result.info.public_id);
                    }
                }
            );

            if (type === 'click') myWidget.open();
        }
    }, [loaded, uwConfig, setMessageUrl, setMessageType]);

    useEffect(() => {
        if (!prefetch && loaded) {
            setPrefetch(true);
            const timer = setTimeout(() => {
                initializeCloudinaryWidget('prefetch');
            }, 250);
            return () => clearTimeout(timer);
        }
    }, [loaded, prefetch, initializeCloudinaryWidget]);

    return (
        <CloudinaryScriptContext.Provider value={{ loaded }}>
            <button
                type="button"
                aria-label="Upload photo or video"
                onClick={() => initializeCloudinaryWidget('click')}
                className="flex items-center justify-center focus:outline-none"
            >
                {loading ? (
                    <span className="loading loading-spinner loading-sm text-info"></span>
                ) : (
                    <HiPhoto className="chat-icons text-sky-500 hover:text-sky-600" />
                )}
            </button>
        </CloudinaryScriptContext.Provider>
    );
};

export default CloudinaryUploadWidget;
export { CloudinaryScriptContext };
