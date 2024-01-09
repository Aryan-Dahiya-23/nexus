/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { createContext, useContext, useEffect, useState } from "react";
import { HiPhoto } from "react-icons/hi2";
import { AuthContext } from "../../contexts/AuthContext";

interface CloudinaryUploadWidgetProps {
    uwConfig: any;
}

interface CloudinaryScriptContextProps {
    loaded: boolean;
}

const CloudinaryScriptContext = createContext<CloudinaryScriptContextProps>({ loaded: false });

const CloudinaryUploadWidget: React.FC<CloudinaryUploadWidgetProps> = ({ uwConfig }) => {
    const { setMessageUrl } = useContext(AuthContext);
    const { setMessageType } = useContext(AuthContext);
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

    const initializeCloudinaryWidget = (type: string) => {
        if (loaded) {
            if (type === 'click') setLoading(true);

            const myWidget = (window as any).cloudinary.createUploadWidget(
                uwConfig,
                (error: any, result: any) => {
                    setLoading(false);
                    if (!error && result && result.event === "success") {
                        console.log(result);
                        if (result.info.video) {
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
    };

    if (!prefetch && loaded) {
        setPrefetch(true);
        setTimeout(() => {
            initializeCloudinaryWidget('prefetch');
        }, 250);
    }

    return (
        <CloudinaryScriptContext.Provider value={{ loaded }}>
            <button onClick={() => initializeCloudinaryWidget('click')}>
                {loading ? (
                    <span className="loading loading-spinner text-info"></span>
                ) : (
                    <HiPhoto className="chat-icons text-sky-500 hover:text-sky-600" />
                )}
            </button>
        </CloudinaryScriptContext.Provider>
    );
};

export default CloudinaryUploadWidget;
export { CloudinaryScriptContext };