/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, ChangeEvent, useContext, useEffect } from "react";
import { useParams } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import { useMutation } from "@tanstack/react-query";
import EmojiPicker from 'emoji-picker-react';
import { HiPaperAirplane } from "react-icons/hi2";
import { MdOutlineEmojiEmotions } from "react-icons/md";
import CloudinaryUploadWidget from "../Widgets/CloudinaryUploadWidget";
import { queryClient } from "../../api/auth";
import { createMessage } from "../../api/conversation";
import { AuthContext } from "../../contexts/AuthContext";
import { ThemeContext } from "../../contexts/ThemeContext";

type ChatInputProps = {
    data: {
        participants: {
            _id: string;
            fullName: string;
            picture: string;
        }[];
        messages: any[];
    };
    conversationId: string | undefined;
};


const socket: Socket = io(import.meta.env.VITE_URL);

const ChatInput: React.FC<ChatInputProps> = ({ data, conversationId }) => {

    const { id } = useParams();
    const { user, setUser } = useContext(AuthContext);

    const { messageUrl, setMessageUrl } = useContext(AuthContext);
    const { messageType, setMessageType } = useContext(AuthContext);
    const { setChatHeight } = useContext(ThemeContext);

    const [text, setText] = useState<string>('');
    const [textareaHeight, setTextareaHeight] = useState<boolean>(false);
    const [message, setMessage] = useState<object>({});
    const [showEmojis, setShowEmojis] = useState<boolean>(false);
    
    const [cloudName] = useState(import.meta.env.VITE_CLOUDINARY_CLOUD_NAME);
    const [uploadPreset] = useState(import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
    const [uwConfig] = useState({
        cloudName,
        uploadPreset
    });

    const handleTextareaChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
        const textarea = event.target;
        setText(textarea.value);

        if (text.length === 0) {
            textarea.style.height = "0px";
        } else {
            // textarea.style.height = 'auto';
            textarea.style.height = `${Math.min(textarea.scrollHeight, 75)}px`;
        }

        textarea.style.height = 'auto';
        textarea.style.height = `${Math.min(textarea.scrollHeight, 75)}px`;

        if (parseFloat(textarea.style.height.slice(0, -2)) > 60) {
            setTextareaHeight(true);
        } else {
            setTextareaHeight(false);
        }
    };

    const { mutate, status } = useMutation({
        mutationFn: async () => {
            const response = await createMessage(conversationId, message);
            return response;
        },
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: ['chats', conversationId] });

            const newMessage = {
                ...message,
                senderId: {
                    _id: user?._id,
                    fullName: user?.fullName,
                    picture: user?.picture
                },
            }

            const newData = {
                ...data,
                messages: [...data.messages, newMessage],
            };

            updateUser();

            queryClient.setQueryData(['chats', conversationId], newData);
            socket.emit('chat message', user._id, newMessage, conversationId);
            return { previousData: data };
        },
        onSuccess: () => {
            socket.emit('message sent', user._id, conversationId);
            queryClient.invalidateQueries({ queryKey: ['user'] });
            queryClient.invalidateQueries({ queryKey: ['chats', conversationId] });
            setMessage({});
        },
        onError: (error, variables, context) => {
            queryClient.setQueryData(['chats', conversationId], context?.previousData);
            console.error('Error creating chat:', error);
        },
    });

    const updateUser = () => {

        const newUser = { ...user }

        const conversationIndex = newUser.conversations.findIndex(conv => conv.conversation._id === id);

        if (conversationIndex !== -1) {
            const currentDate = new Date();
            const newMessage = {
                ...message,
                createdAt: currentDate.toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    timeZoneName: "short"
                })
            }
            newUser.conversations[conversationIndex].conversation.lastMessage = newMessage;
        }

        const conversationToMove = newUser.conversations[conversationIndex];
        newUser.conversations.splice(conversationIndex, 1);
        newUser.conversations.unshift(conversationToMove);

        setUser(newUser);
    };

    const handleMessageSend = (content: string, type: string) => {

        if (content === '' || type === '' || status === 'pending') return

        setText('');
        setMessageUrl('');
        setMessageType('');

        const newMessage = {
            senderId: user._id,
            content: content,
            type: type,
            seenBy: [],
        }

        setMessage(newMessage);
    }

    useEffect(() => {
        if (message && Object.keys(message).length > 0)
            mutate();
    }, [message]);

    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            handleMessageSend(text, 'text');
        }
    }

    useEffect(() => {
        if (messageUrl !== '' && messageType !== '') {
            handleMessageSend(messageUrl, messageType);
        }
    }, [messageUrl, messageType]);

    useEffect(() => {
        setText('');
    }, [id]);

    const handleEmojiClick = (emoji) => {
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
                    <EmojiPicker
                        onEmojiClick={handleEmojiClick}
                        lazyLoadEmojis
                    />
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