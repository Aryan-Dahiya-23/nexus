import React, { useContext, useState } from "react";
import { motion } from "framer-motion";
import { Check, CheckCheck, Maximize2, Pencil, Trash2, Ban, X, Check as CheckIcon, Loader2 } from "lucide-react";
import { ThemeContext } from "../../contexts/ThemeContext";

interface ChatBubbleProps {
    conversationType: string;
    position: string;
    sender: string;
    message: string;
    createdAt: string;
    avatarSrc: string;
    footerName: string;
    isLastMessage: boolean;
    online: boolean;
    messageSeen: boolean;
    messageType: string;
    messageId?: string;
    isDeleted?: boolean;
    isEdited?: boolean;
    onEditSave?: (messageId: string, newContent: string) => Promise<void> | void;
    onDeleteConfirm?: (messageId: string) => Promise<void> | void;
}

const DEFAULT_AVATAR = "https://res.cloudinary.com/dwyx9715k/image/upload/v1723145455/nexus/avatars/default_avatar.png";

const ChatBubble: React.FC<ChatBubbleProps> = ({
    conversationType,
    position,
    sender,
    message,
    createdAt,
    avatarSrc,
    footerName,
    isLastMessage,
    online,
    messageSeen,
    messageType,
    messageId,
    isDeleted = false,
    isEdited = false,
    onEditSave,
    onDeleteConfirm,
}) => {
    const { setImageWidget, setImgSrc } = useContext(ThemeContext);
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [editedText, setEditedText] = useState<string>(message);
    const [isConfirmingDelete, setIsConfirmingDelete] = useState<boolean>(false);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const formattedTime = new Date(createdAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });

    const isRight = position === "right";
    const isMedia = (messageType === 'image' || messageType === 'video') && !isDeleted;
    const isHttpUrl = typeof message === 'string' && (message.startsWith('http://') || message.startsWith('https://'));
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dwyx9715k';

    // High quality uncompressed Cloudinary delivery URL with optimal format and quality
    const highResMediaUrl = isHttpUrl
        ? message
        : `https://res.cloudinary.com/${cloudName}/${messageType === 'video' ? 'video' : 'image'}/upload/q_auto:best,f_auto/${message}`;

    const handleImageClick = () => {
        setImgSrc(highResMediaUrl);
        setImageWidget(true);
    };

    const handleSaveEdit = async () => {
        if (!messageId || !onEditSave || !editedText.trim() || editedText.trim() === message || isSubmitting) return;
        setIsSubmitting(true);
        try {
            await onEditSave(messageId, editedText.trim());
            setIsEditing(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!messageId || !onDeleteConfirm || isSubmitting) return;
        setIsSubmitting(true);
        try {
            await onDeleteConfirm(messageId);
            setIsConfirmingDelete(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
            className={`flex w-full my-1 sm:my-1.5 ${isRight ? "justify-end" : "justify-start"}`}
        >
            <div className={`flex items-end gap-2 max-w-[88%] sm:max-w-[78%] md:max-w-[68%] lg:max-w-[60%] ${isRight ? "flex-row-reverse" : "flex-row"}`}>
                {/* Avatar for received messages */}
                {!isRight && (
                    <div className="relative shrink-0 mb-1">
                        <img
                            src={avatarSrc || DEFAULT_AVATAR}
                            alt={sender}
                            className="h-7 w-7 sm:h-8 sm:w-8 rounded-full object-cover ring-1 ring-border/60 shadow-xs"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = DEFAULT_AVATAR;
                            }}
                        />
                        {online && (
                            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-background shadow-xs" />
                        )}
                    </div>
                )}

                {/* Message Bubble + Tail + Sender */}
                <div className={`flex flex-col min-w-0 ${isRight ? "items-end" : "items-start"}`}>
                    {/* Sender Name in Group Chats */}
                    {!isRight && conversationType === 'group' && (
                        <span className="text-[11px] font-bold text-primary ml-3 mb-1 tracking-tight">
                            {sender}
                        </span>
                    )}

                    {/* Speech Bubble Container */}
                    <div className="relative group/bubble">
                        {/* Outgoing Message Action Toolbar (Hover on Desktop / Focus) */}
                        {isRight && !isDeleted && messageId && !isEditing && !isConfirmingDelete && (
                            <div className="absolute -top-3.5 right-2 opacity-0 group-hover/bubble:opacity-100 focus-within:opacity-100 transition-all duration-150 flex items-center gap-0.5 bg-card/95 dark:bg-zinc-900/95 backdrop-blur-md border border-border rounded-full p-0.5 shadow-md z-30 pointer-events-auto scale-90 sm:scale-100">
                                {messageType === 'text' && onEditSave && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEditedText(message);
                                            setIsEditing(true);
                                        }}
                                        className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
                                        title="Edit message"
                                        aria-label="Edit message"
                                    >
                                        <Pencil className="h-3 w-3" />
                                    </button>
                                )}

                                {onDeleteConfirm && (
                                    <button
                                        type="button"
                                        onClick={() => setIsConfirmingDelete(true)}
                                        className="p-1 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                                        title="Delete message"
                                        aria-label="Delete message"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Inline Delete Confirmation Popover */}
                        {isConfirmingDelete && (
                            <div className="absolute -top-10 right-0 z-40 bg-card border border-destructive/40 text-foreground p-1.5 px-2.5 rounded-xl shadow-xl flex items-center gap-2 animate-in fade-in zoom-in-95 duration-150">
                                <span className="text-xs font-semibold text-destructive">Delete message?</span>
                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        disabled={isSubmitting}
                                        onClick={handleDelete}
                                        className="px-2 py-0.5 text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-md font-semibold cursor-pointer transition-colors"
                                    >
                                        {isSubmitting ? <Loader2 className="h-3 w-3 animate-spin" /> : "Delete"}
                                    </button>
                                    <button
                                        type="button"
                                        disabled={isSubmitting}
                                        onClick={() => setIsConfirmingDelete(false)}
                                        className="px-2 py-0.5 text-xs hover:bg-muted rounded-md text-muted-foreground cursor-pointer transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* THE MESSAGE BUBBLE */}
                        <div
                            className={`relative text-sm sm:text-[15px] leading-relaxed break-words transition-all ${
                                isMedia
                                    ? "p-0 bg-transparent border-0 shadow-none"
                                    : isDeleted
                                        ? "px-4 py-2.5 bg-muted/40 text-muted-foreground border border-border/70 rounded-2xl shadow-xs"
                                        : isRight
                                            ? "px-4 py-2.5 bg-primary text-primary-foreground rounded-2xl rounded-br-sm shadow-sm"
                                            : "px-4 py-2.5 bg-card text-card-foreground border border-border rounded-2xl rounded-bl-sm shadow-xs"
                            }`}
                        >
                            {/* --- WHATSAPP-STYLE DELETED MESSAGE --- */}
                            {isDeleted ? (
                                <div className="flex items-center gap-2 py-0.5 select-none">
                                    <Ban className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
                                    <span className="italic text-[13px] sm:text-sm text-muted-foreground/90 font-normal">
                                        This message was deleted
                                    </span>
                                    <span className="text-[10px] text-muted-foreground/60 ml-1 font-mono">{formattedTime}</span>
                                </div>
                            ) : isEditing ? (
                                /* --- INLINE EDITING INTERFACE --- */
                                <div className="flex flex-col gap-2 min-w-[200px] sm:min-w-[260px] max-w-full py-0.5">
                                    <textarea
                                        value={editedText}
                                        onChange={(e) => setEditedText(e.target.value)}
                                        className="w-full bg-background/95 text-foreground border border-input rounded-xl p-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none custom-scrollbar"
                                        rows={Math.min(Math.max(editedText.split('\n').length, 2), 6)}
                                        autoFocus
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSaveEdit();
                                            } else if (e.key === 'Escape') {
                                                setIsEditing(false);
                                                setEditedText(message);
                                            }
                                        }}
                                    />
                                    <div className="flex items-center justify-end gap-1.5">
                                        <button
                                            type="button"
                                            disabled={isSubmitting}
                                            onClick={() => {
                                                setIsEditing(false);
                                                setEditedText(message);
                                            }}
                                            className="px-2 py-1 text-xs rounded-lg hover:bg-background/40 font-medium text-primary-foreground/90 transition-colors cursor-pointer flex items-center gap-1"
                                        >
                                            <X className="h-3 w-3" />
                                            <span>Cancel</span>
                                        </button>
                                        <button
                                            type="button"
                                            disabled={!editedText.trim() || editedText.trim() === message || isSubmitting}
                                            onClick={handleSaveEdit}
                                            className="px-2.5 py-1 text-xs rounded-lg bg-background text-foreground hover:bg-background/90 font-semibold disabled:opacity-50 transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                                        >
                                            {isSubmitting ? (
                                                <Loader2 className="h-3 w-3 animate-spin" />
                                            ) : (
                                                <CheckIcon className="h-3 w-3 text-primary" />
                                            )}
                                            <span>Save</span>
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {/* --- TEXT MESSAGE --- */}
                                    {messageType === 'text' && (
                                        <div className="space-y-1">
                                            <p className="whitespace-pre-wrap select-text font-normal">{message}</p>
                                            
                                            {/* Inline Timestamp, Edited Badge & Seen Status */}
                                            <div
                                                className={`flex items-center justify-end gap-1 text-[10px] font-medium select-none pt-0.5 ${
                                                    isRight ? "text-primary-foreground/80" : "text-muted-foreground/80"
                                                }`}
                                            >
                                                {isEdited && (
                                                    <span className="italic opacity-85">Edited •</span>
                                                )}
                                                <span>{formattedTime}</span>
                                                {isRight && (
                                                    messageSeen ? (
                                                        <CheckCheck className="h-3.5 w-3.5 text-primary-foreground stroke-[2.5]" />
                                                    ) : (
                                                        <Check className="h-3.5 w-3.5 text-primary-foreground/75 stroke-[2.5]" />
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* --- IMAGE MESSAGE --- */}
                                    {messageType === 'image' && (
                                        <div
                                            className="relative rounded-2xl overflow-hidden cursor-pointer group/img max-w-[320px] sm:max-w-[440px] md:max-w-[500px] border border-border/60 bg-muted/20 shadow-xs"
                                            onClick={handleImageClick}
                                        >
                                            <img
                                                src={highResMediaUrl}
                                                alt="Sent media"
                                                loading="lazy"
                                                decoding="async"
                                                className="w-full max-h-[440px] sm:max-h-[520px] object-contain rounded-2xl transition-transform duration-300 group-hover/img:scale-[1.01] select-none bg-black/5 dark:bg-white/5"
                                            />

                                            {/* Hover overlay hint */}
                                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                                <div className="p-2.5 rounded-full bg-black/60 text-white backdrop-blur-md shadow-lg transform scale-90 group-hover/img:scale-100 transition-transform">
                                                    <Maximize2 className="h-4 w-4" />
                                                </div>
                                            </div>

                                            {/* Floating Glassmorphic Timestamp Pill */}
                                            <div className="absolute bottom-2 right-2 px-2.5 py-0.5 rounded-full bg-black/65 backdrop-blur-md text-white text-[10px] font-semibold flex items-center gap-1 shadow-md select-none pointer-events-none">
                                                <span>{formattedTime}</span>
                                                {isRight && (
                                                    messageSeen ? (
                                                        <CheckCheck className="h-3 w-3 text-cyan-300 stroke-[2.5]" />
                                                    ) : (
                                                        <Check className="h-3 w-3 text-white/80 stroke-[2.5]" />
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* --- VIDEO MESSAGE --- */}
                                    {messageType === 'video' && (
                                        <div className="relative rounded-2xl overflow-hidden max-w-[320px] sm:max-w-[440px] md:max-w-[500px] border border-border/60 bg-black shadow-xs">
                                            <video
                                                src={highResMediaUrl}
                                                controls
                                                playsInline
                                                preload="metadata"
                                                className="w-full max-h-[440px] sm:max-h-[520px] object-contain rounded-2xl bg-black"
                                            />

                                            {/* Floating Glassmorphic Timestamp Pill */}
                                            <div className="absolute top-2 right-2 px-2.5 py-0.5 rounded-full bg-black/65 backdrop-blur-md text-white text-[10px] font-semibold flex items-center gap-1 shadow-md select-none pointer-events-none">
                                                <span>{formattedTime}</span>
                                                {isRight && (
                                                    messageSeen ? (
                                                        <CheckCheck className="h-3 w-3 text-cyan-300 stroke-[2.5]" />
                                                    ) : (
                                                        <Check className="h-3 w-3 text-white/80 stroke-[2.5]" />
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* SPEECH BUBBLE TAIL (SVG) - Only for text and non-deleted messages */}
                        {!isMedia && !isDeleted && !isEditing && (
                            isRight ? (
                                /* Outgoing Message Tail (Bottom-Right) */
                                <svg
                                    className="absolute -bottom-[2px] -right-[6px] w-[11px] h-[14px] pointer-events-none text-primary fill-current"
                                    viewBox="0 0 11 14"
                                >
                                    <path d="M0,0 C2,4 6,10 11,14 C8,13 3,11 0,8 Z" />
                                </svg>
                            ) : (
                                /* Incoming Message Tail (Bottom-Left) */
                                <svg
                                    className="absolute -bottom-[2px] -left-[6px] w-[11px] h-[14px] pointer-events-none fill-card stroke-border/70"
                                    viewBox="0 0 11 14"
                                >
                                    <path d="M11,0 C9,4 5,10 0,14 C3,13 8,11 11,8 Z" />
                                </svg>
                            )
                        )}
                    </div>

                    {/* Seen by indicator for last message */}
                    {isRight && isLastMessage && messageSeen && !isDeleted && (
                        <span className="text-[10px] font-medium text-muted-foreground/80 mt-1 mr-1">
                            {conversationType === 'group' ? "Seen by all" : `Seen by ${footerName.split(" ")[0]}`}
                        </span>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default ChatBubble;
