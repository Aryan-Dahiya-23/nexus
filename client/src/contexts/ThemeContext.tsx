// AuthContext.tsx
import { createContext, useState, ReactNode, Dispatch, SetStateAction, useEffect } from 'react';

interface ThemeContextProps {
    theme: string;
    setTheme: Dispatch<SetStateAction<string>>;
    chatHeight: boolean;
    setChatHeight: Dispatch<SetStateAction<boolean>>;
    groupChatWidget: boolean;
    setGroupChatWidget: Dispatch<SetStateAction<boolean>>;
    logoutLoading: boolean;
    setLogoutLoading: Dispatch<SetStateAction<boolean>>;
    loginToast: boolean,
    setLoginToast: Dispatch<SetStateAction<boolean>>;
    incomingVideoCall: boolean,
    setIncomingVideoCall: Dispatch<SetStateAction<boolean>>;
    videoCallName: string;
    setVideoCallName: Dispatch<SetStateAction<string>>;
    videoCallUserId: string;
    setVideoCallUserId: Dispatch<SetStateAction<string>>;
    videoCallAvatarSrc: string;
    setVideoCallAvatarSrc: Dispatch<SetStateAction<string>>;
    videoCallId: string;
    setVideoCallId: Dispatch<SetStateAction<string>>;
    outgoingCall: boolean;
    setOutgoingCall: Dispatch<SetStateAction<boolean>>;
    deleteModal: boolean;
    setDeleteModal: Dispatch<SetStateAction<boolean>>;
    imageWidget: boolean;
    setImageWidget: Dispatch<SetStateAction<boolean>>;
    imgSrc: string;
    setImgSrc: Dispatch<SetStateAction<string>>;
}

const defaultThemeContext: ThemeContextProps = {
    theme: "",
    setTheme: () => { },
    chatHeight: false,
    setChatHeight: () => { },
    groupChatWidget: false,
    setGroupChatWidget: () => { },
    logoutLoading: false,
    setLogoutLoading: () => { },
    loginToast: false,
    setLoginToast: () => { },
    incomingVideoCall: false,
    setIncomingVideoCall: () => { },
    videoCallName: "",
    setVideoCallName: () => { },
    videoCallUserId: "",
    setVideoCallUserId: () => { },
    videoCallAvatarSrc: "",
    setVideoCallAvatarSrc: () => { },
    videoCallId: "",
    setVideoCallId: () => { },
    outgoingCall: false,
    setOutgoingCall: () => { },
    deleteModal: false,
    setDeleteModal: () => { },
    imageWidget: false,
    setImageWidget: () => { },
    imgSrc: "",
    setImgSrc: () => { },
};

export const ThemeContext = createContext<ThemeContextProps>(defaultThemeContext);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {

    const [theme, setTheme] = useState<string>(() => {
        const savedTheme = localStorage.getItem("theme");
        return savedTheme !== null ? savedTheme : "light";
    });
    const [chatHeight, setChatHeight] = useState<boolean>(false);
    const [groupChatWidget, setGroupChatWidget] = useState<boolean>(false)
    const [logoutLoading, setLogoutLoading] = useState<boolean>(false)
    const [loginToast, setLoginToast] = useState<boolean>(false);
    const [incomingVideoCall, setIncomingVideoCall] = useState(false);
    const [videoCallName, setVideoCallName] = useState<string>('');
    const [videoCallUserId, setVideoCallUserId] = useState<string>('');
    const [videoCallAvatarSrc, setVideoCallAvatarSrc] = useState<string>('');
    const [videoCallId, setVideoCallId] = useState<string>('');
    const [outgoingCall, setOutgoingCall] = useState<boolean>(false);
    const [ deleteModal, setDeleteModal ] = useState<boolean>(false);
    const [ imageWidget, setImageWidget ] = useState<boolean>(false);
    const [ imgSrc, setImgSrc ] = useState<string>("");

    useEffect(() => {
        try {
            localStorage.setItem("theme", theme);
            const localTheme = localStorage.getItem("theme");

            if (localTheme !== null) {
                document.querySelector("html")?.setAttribute("data-theme", localTheme);
            } else {
                document.querySelector("html")?.setAttribute("data-theme", "light");
            }
        } catch (error) {
            console.error('Error accessing localStorage:', error);
        }

    }, [theme]);

    return (
        <ThemeContext.Provider
            value={{
                theme, setTheme, chatHeight, setChatHeight, groupChatWidget, setGroupChatWidget, logoutLoading, setLogoutLoading,
                loginToast, setLoginToast, incomingVideoCall, setIncomingVideoCall, videoCallName, setVideoCallName, videoCallUserId, setVideoCallUserId,
                videoCallAvatarSrc, setVideoCallAvatarSrc, videoCallId, setVideoCallId, outgoingCall, setOutgoingCall, deleteModal, setDeleteModal,
                imageWidget, setImageWidget, imgSrc, setImgSrc
            }}
        >
            {children}
        </ThemeContext.Provider>
    );
};
