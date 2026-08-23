import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
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
                className="p-2 rounded-xl text-muted-foreground hover:text-primary hover:bg-muted/80 transition-colors cursor-pointer"
            >
                {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                ) : (
                    <ImagePlus className="h-5 w-5" />
                )}
            </button>
        </CloudinaryScriptContext.Provider>
    );
};

export default CloudinaryUploadWidget;
export { CloudinaryScriptContext };
