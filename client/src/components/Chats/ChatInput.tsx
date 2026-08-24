import React, { useState, ChangeEvent, useContext, useEffect, lazy, Suspense, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Send, Smile } from "lucide-react";
import CloudinaryUploadWidget from "../Widgets/CloudinaryUploadWidget";
import { queryClient } from "../../api/auth";
import { createMessage } from "../../api/conversation";
import { Conversation, Message, User, UserConversationRef } from "../../types";

import type { Theme as EmojiTheme } from 'emoji-picker-react';
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
    const { setChatHeight, theme } = useContext(ThemeContext);

    const [text, setText] = useState<string>('');
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
        setText(textarea.value);

        textarea.style.height = 'auto';
        textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
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
        onSuccess: (res) => {
            if (user?._id) {
                socket.emit('message sent', user._id, conversationId);
            }
            if (res && res.data && res.data._id) {
                const currentConv: Conversation | undefined = queryClient.getQueryData(['chats', conversationId]);
                if (currentConv) {
                    // Replace temporary message or append confirmed server message
                    const updatedMessages = currentConv.messages.map((m: Message) =>
                        m._id === undefined && m.content === res.data.content ? res.data : m
                    );
                    queryClient.setQueryData(['chats', conversationId], {
                        ...currentConv,
                        messages: updatedMessages,
                        lastMessage: res.data
                    });
                }
            }
            queryClient.invalidateQueries({ queryKey: ['user'] });
            setMessage({});
        },
        onError: (error, _variables, context) => {
            queryClient.setQueryData(['chats', conversationId], context?.previousData);
            console.error('Error creating chat:', error);
        },
    });

    const handleMessageSend = useCallback((content: string, type: string) => {
        if (!user || content.trim() === '' || type === '' || status === 'pending') return;

        setText('');
        setMessageUrl('');
        setMessageType('');

        const newMessage = {
            senderId: user._id,
            content: content.trim(),
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
                setShowEmojis(false);
            }
        };

        window.addEventListener('click', handleClick);

        return () => {
            window.removeEventListener('click', handleClick);
        };
    }, []);

    const isDark = theme === 'dark';

    return (
        <div className="relative p-3 sm:p-4 border-t border-border bg-card/75 backdrop-blur-xl shrink-0 transition-colors z-20">
            {/* Emoji Picker Popover */}
            {showEmojis && (
                <div
                    className="absolute bottom-20 left-2 sm:left-6 z-50 max-w-[calc(100vw-20px)] sm:max-w-none shadow-2xl rounded-2xl overflow-hidden border border-border animate-in fade-in slide-in-from-bottom-2 duration-200"
                    id="emojis"
                >
                    <Suspense fallback={<div className="p-4 bg-card text-card-foreground text-xs">Loading emojis...</div>}>
                        <EmojiPicker
                            onEmojiClick={handleEmojiClick}
                            lazyLoadEmojis
                            width={typeof window !== 'undefined' && window.innerWidth < 380 ? Math.min(window.innerWidth - 30, 320) : 340}
                            height={380}
                            theme={isDark ? ('dark' as EmojiTheme) : ('light' as EmojiTheme)}
                        />
                    </Suspense>
                </div>
            )}

            <div className="flex items-end gap-1.5 sm:gap-2 bg-background border border-input rounded-2xl p-1.5 sm:p-2 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 shadow-xs transition-all">
                {/* File / Media Attachment */}
                <CloudinaryUploadWidget uwConfig={uwConfig} />

                {/* Emoji Trigger */}
                <button
                    type="button"
                    id="emojiIcon"
                    onClick={() => setShowEmojis(!showEmojis)}
                    className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors shrink-0 cursor-pointer"
                    aria-label="Toggle emoji picker"
                >
                    <Smile className="h-5 w-5" />
                </button>

                {/* Expanding Textarea */}
                <textarea
                    placeholder="Type a message (Shift+Enter for newline)..."
                    className="flex-1 max-h-32 min-h-[36px] sm:min-h-[40px] py-1.5 sm:py-2 px-2 bg-transparent text-sm sm:text-base text-foreground placeholder:text-muted-foreground/70 resize-none focus:outline-none custom-scrollbar leading-relaxed"
                    onChange={handleTextareaChange}
                    onKeyDown={handleKeyDown}
                    value={text}
                    rows={1}
                    onFocus={() => setChatHeight(true)}
                    onBlur={() => setChatHeight(false)}
                />

                {/* Send Button */}
                <button
                    type="button"
                    disabled={!text.trim() || status === 'pending'}
                    onClick={() => handleMessageSend(text, 'text')}
                    className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 hover:to-sky-500 disabled:opacity-40 disabled:pointer-events-none text-white shadow-sm shadow-cyan-500/20 active:scale-95 transition-all shrink-0 cursor-pointer"
                    aria-label="Send message"
                >
                    <Send className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
};

export default ChatInput;
