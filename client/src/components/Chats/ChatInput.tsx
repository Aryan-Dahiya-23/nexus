import { useState, ChangeEvent, useContext, useEffect, lazy, Suspense, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { HiPaperAirplane } from "react-icons/hi2";
import { MdOutlineEmojiEmotions } from "react-icons/md";
import CloudinaryUploadWidget from "../Widgets/CloudinaryUploadWidget";
import { queryClient } from "../../api/auth";
import { createMessage } from "../../api/conversation";
import { Message, User, UserConversationRef } from "../../types";

const EmojiPicker = lazy(() => import('emoji-picker-react'));
import { AuthContext } from "../../contexts/AuthContext";
import { ThemeContext } from "../../contexts/ThemeContext";
import socket from "../../utils/socket";

type ChatInputProps = {
    data: {
        participants: {
            _id: string;
            fullName: string;
            picture: string;
        }[];
        messages: Message[];
    };
    conversationId: string | undefined;
};

const ChatInput: React.FC<ChatInputProps> = ({ data, conversationId }) => {

    const { id } = useParams();
    const { user, setUser } = useContext(AuthContext);

    const { messageUrl, setMessageUrl } = useContext(AuthContext);
    const { messageType, setMessageType } = useContext(AuthContext);
    const { setChatHeight } = useContext(ThemeContext);

    const [text, setText] = useState<string>('');
    const [textareaHeight, setTextareaHeight] = useState<boolean>(false);
    const [message, setMessage] = useState<Record<string, unknown>>({});
    const [showEmojis, setShowEmojis] = useState<boolean>(false);

    const [cloudName] = useState(import.meta.env.VITE_CLOUDINARY_CLOUD_NAME);
    const [uploadPreset] = useState(import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
    const [uwConfig] = useState({
        cloudName,
        uploadPreset,
        maxFileSize: 25 * 1024 * 1024, // 25 MB max
        clientAllowedFormats: ['png', 'jpeg', 'jpg', 'gif', 'webp', 'mp4', 'mov', 'webm'],
        maxFiles: 1,
        multiple: false,
    });

    const handleTextareaChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
        const textarea = event.target;
        const val = textarea.value;
        setText(val);

        textarea.style.height = 'auto';
        textarea.style.height = `${Math.min(textarea.scrollHeight, 75)}px`;

        if (parseFloat(textarea.style.height.slice(0, -2)) > 60) {
            setTextareaHeight(true);
        } else {
            setTextareaHeight(false);
        }
    };

    const updateUser = useCallback((msgToSend: Message) => {
        setUser((prevUser: User | undefined) => {
            if (!prevUser || !Array.isArray(prevUser.conversations)) return prevUser;
            const conversationIndex = prevUser.conversations.findIndex(
                (conv: UserConversationRef) => conv?.conversation?._id === id
            );
            if (conversationIndex === -1) return prevUser;

            const currentDate = new Date();
            const formattedMessage = {
                ...msgToSend,
                createdAt: currentDate.toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    timeZoneName: "short"
                })
            };

            const updatedConv = {
                ...prevUser.conversations[conversationIndex],
                conversation: {
                    ...prevUser.conversations[conversationIndex].conversation,
                    lastMessage: formattedMessage
                }
            };

            const remainingConvs = prevUser.conversations.filter(
                (_: UserConversationRef, idx: number) => idx !== conversationIndex
            );

            return {
                ...prevUser,
                conversations: [updatedConv, ...remainingConvs]
            };
        });
    }, [id, setUser]);

    const { mutate, status } = useMutation({
        mutationFn: async () => {
            const response = await createMessage(conversationId, message);
            return response;
        },
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: ['chats', conversationId] });

            const newMessage: Message = {
                content: (message as { content?: string }).content || '',
                type: ((message as { type?: 'text' | 'image' | 'video' }).type) || 'text',
                seenBy: [],
                ...message,
                senderId: {
                    _id: user?._id || '',
                    fullName: user?.fullName || '',
                    picture: user?.picture || ''
                },
            };

            const newData = {
                ...data,
                messages: [...data.messages, newMessage],
            };

            updateUser(newMessage);

            queryClient.setQueryData(['chats', conversationId], newData);
            if (user?._id) {
                socket.emit('chat message', user._id, newMessage, conversationId);
            }
            return { previousData: data };
        },
        onSuccess: () => {
            if (user?._id) {
                socket.emit('message sent', user._id, conversationId);
            }
            queryClient.invalidateQueries({ queryKey: ['user'] });
            queryClient.invalidateQueries({ queryKey: ['chats', conversationId] });
            setMessage({});
        },
        onError: (error, _variables, context) => {
            queryClient.setQueryData(['chats', conversationId], context?.previousData);
            console.error('Error creating chat:', error);
        },
    });

    const handleMessageSend = useCallback((content: string, type: string) => {
        if (!user || content === '' || type === '' || status === 'pending') return;

        setText('');
        setMessageUrl('');
        setMessageType('');

        const newMessage = {
            senderId: user._id,
            content: content,
            type: type,
            seenBy: [],
        };

        setMessage(newMessage);
    }, [user, status, setMessageUrl, setMessageType]);

    useEffect(() => {
        if (message && Object.keys(message).length > 0)
            mutate();
    }, [message, mutate]);

    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleMessageSend(text, 'text');
        }
    };

    useEffect(() => {
        if (messageUrl !== '' && messageType !== '') {
            handleMessageSend(messageUrl, messageType);
        }
    }, [messageUrl, messageType, handleMessageSend]);

    useEffect(() => {
        setText('');
    }, [id]);

    const handleEmojiClick = (emoji: { emoji: string }) => {
        setText((prevMessage) => prevMessage + emoji.emoji);
    };

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            const emojisElement = document.getElementById('emojis');
            const emojiIconElement = document.getElementById('emojiIcon');

            if (
                (emojisElement && !emojisElement.contains(e.target as Node)) &&
                (emojiIconElement && !emojiIconElement.contains(e.target as Node))
            ) {
                setShowEmojis(false)
            }
        };

        window.addEventListener('click', handleClick);

        return () => {
            window.removeEventListener('click', handleClick);
        };
    }, []);

    return (
        <div
            className={`flex flex-row justify-between w-full space-x-4 p-3 mt-auto lg:p-4 border-t-2 border-gray-200 ${textareaHeight ? "items-end" : "items-center"}`}>

            <CloudinaryUploadWidget uwConfig={uwConfig} />

            <MdOutlineEmojiEmotions className="hidden lg:inline chat-icons text-sky-500 hover:text-sky-600" id="emojiIcon" onClick={() => setShowEmojis(!showEmojis)} />

            {showEmojis &&
                <div className="fixed bottom-24 left-[30%]" id="emojis">
                    <Suspense fallback={<div className="p-4 bg-base-100 rounded-lg shadow">Loading emojis...</div>}>
                        <EmojiPicker
                            onEmojiClick={handleEmojiClick}
                            lazyLoadEmojis
                        />
                    </Suspense>
                </div>
            }

            <textarea
                placeholder="Write a message"
                className="textarea textarea-bordered text-base textarea-sm w-11/12 resize-none leading-normal custom-scrollbar"
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                value={text}
                onFocus={() => setChatHeight(true)}
                onBlur={() => setChatHeight(false)}
            ></textarea>

            <HiPaperAirplane className="chat-icons text-sky-500 hover:text-sky-600" onClick={() => handleMessageSend(text, 'text')} />
        </div>
    );
}

export default ChatInput;
