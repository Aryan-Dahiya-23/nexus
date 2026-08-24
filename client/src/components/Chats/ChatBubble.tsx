import React, { useContext, useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Check,
    CheckCheck,
    Maximize2,
    Pencil,
    Trash2,
    Ban,
    X,
    Check as CheckIcon,
    Loader2,
    Copy,
    MoreHorizontal,
    AlertCircle
} from "lucide-react";
import { toast } from "react-toastify";
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
    const [showActionsMenu, setShowActionsMenu] = useState<boolean>(false);

    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const menuRef = useRef<HTMLDivElement | null>(null);

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

    // Auto-adjust textarea height when editing
    useEffect(() => {
        if (isEditing && textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(Math.max(textareaRef.current.scrollHeight, 60), 220)}px`;
        }
    }, [isEditing, editedText]);

    // Close action menu on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent | TouchEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowActionsMenu(false);
            }
        };

        if (showActionsMenu) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('touchstart', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [showActionsMenu]);

    const handleImageClick = () => {
        setImgSrc(highResMediaUrl);
        setImageWidget(true);
    };

    const handleCopyText = async (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setShowActionsMenu(false);
        if (!message || isDeleted) return;
        try {
            await navigator.clipboard.writeText(message);
            toast.success("Message copied to clipboard", { autoClose: 1500 });
        } catch {
            toast.info("Could not copy message to clipboard");
        }
    };

    const handleStartEdit = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setShowActionsMenu(false);
        setEditedText(message);
        setIsEditing(true);
        setIsConfirmingDelete(false);
    };

    const handleSaveEdit = async () => {
        if (!messageId || !onEditSave || !editedText.trim() || isSubmitting) return;
        if (editedText.trim() === message) {
            setIsEditing(false);
            return;
        }
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
            setShowActionsMenu(false);
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
            <div className={`flex items-end gap-2 max-w-[92%] sm:max-w-[82%] md:max-w-[72%] lg:max-w-[65%] ${isRight ? "flex-row-reverse" : "flex-row"}`}>
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
                        {/* Desktop Hover Action Pill */}
                        {!isDeleted && !isEditing && !isConfirmingDelete && (
                            <div
                                className={`absolute -top-3.5 ${
                                    isRight ? "right-2" : "left-2"
                                } opacity-0 group-hover/bubble:opacity-100 focus-within:opacity-100 transition-all duration-150 hidden sm:flex items-center gap-0.5 bg-card/95 dark:bg-zinc-900/95 backdrop-blur-md border border-border rounded-full p-0.5 shadow-md z-30 pointer-events-auto`}
                            >
                                {/* Copy Text Button */}
                                {messageType === 'text' && (
                                    <button
                                        type="button"
                                        onClick={handleCopyText}
                                        className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
                                        title="Copy text"
                                        aria-label="Copy text"
                                    >
                                        <Copy className="h-3 w-3" />
                                    </button>
                                )}

                                {/* Edit Message Button (Outgoing only) */}
                                {isRight && messageType === 'text' && onEditSave && (
                                    <button
                                        type="button"
                                        onClick={handleStartEdit}
                                        className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
                                        title="Edit message"
                                        aria-label="Edit message"
                                    >
                                        <Pencil className="h-3 w-3" />
                                    </button>
                                )}

                                {/* Delete Message Button (Outgoing only) */}
                                {isRight && onDeleteConfirm && (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsConfirmingDelete(true);
                                        }}
                                        className="p-1 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                                        title="Delete message"
                                        aria-label="Delete message"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Mobile 3-Dot Trigger Button (Touch Devices) */}
                        {!isDeleted && !isEditing && !isConfirmingDelete && (
                            <div className="absolute top-1 right-1 sm:hidden z-20">
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowActionsMenu(!showActionsMenu);
                                    }}
                                    className={`p-1 rounded-full transition-all ${
                                        isRight
                                            ? "text-primary-foreground/70 hover:text-primary-foreground bg-black/10 active:bg-black/20"
                                            : "text-muted-foreground hover:text-foreground bg-muted/50 active:bg-muted"
                                    }`}
                                    aria-label="Message options"
                                >
                                    <MoreHorizontal className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        )}

                        {/* Mobile Context Actions Popover / Menu */}
                        <AnimatePresence>
                            {showActionsMenu && !isDeleted && (
                                <motion.div
                                    ref={menuRef}
                                    initial={{ opacity: 0, scale: 0.9, y: 4 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9, y: 4 }}
                                    transition={{ duration: 0.15 }}
                                    className={`absolute ${
                                        isRight ? "right-0" : "left-0"
                                    } bottom-full mb-2 z-50 min-w-[140px] bg-card text-card-foreground border border-border rounded-2xl p-1.5 shadow-xl backdrop-blur-xl flex flex-col gap-0.5`}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {messageType === 'text' && (
                                        <button
                                            type="button"
                                            onClick={handleCopyText}
                                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-xl hover:bg-muted text-foreground transition-colors cursor-pointer text-left"
                                        >
                                            <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                                            <span>Copy Text</span>
                                        </button>
                                    )}

                                    {isRight && messageType === 'text' && onEditSave && (
                                        <button
                                            type="button"
                                            onClick={handleStartEdit}
                                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-xl hover:bg-muted text-foreground transition-colors cursor-pointer text-left"
                                        >
                                            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                                            <span>Edit Message</span>
                                        </button>
                                    )}

                                    {isRight && onDeleteConfirm && (
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setShowActionsMenu(false);
                                                setIsConfirmingDelete(true);
                                            }}
                                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-xl hover:bg-destructive/10 text-destructive transition-colors cursor-pointer text-left"
                                        >
                                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                            <span>Delete Message</span>
                                        </button>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Viewport-Safe Inline Delete Confirmation Card */}
                        <AnimatePresence>
                            {isConfirmingDelete && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: 4 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 4 }}
                                    className="mb-2 p-3 rounded-2xl bg-card border border-destructive/30 text-card-foreground shadow-lg flex flex-col gap-2.5 z-40 max-w-[280px] sm:max-w-[320px]"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <div className="flex items-center gap-2 text-destructive font-semibold text-xs">
                                        <AlertCircle className="h-4 w-4 shrink-0" />
                                        <span>Delete this message?</span>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground leading-tight">
                                        This message will be deleted for everyone in this chat.
                                    </p>
                                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-border/50">
                                        <button
                                            type="button"
                                            disabled={isSubmitting}
                                            onClick={() => setIsConfirmingDelete(false)}
                                            className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            disabled={isSubmitting}
                                            onClick={handleDelete}
                                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                    <span>Deleting...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Trash2 className="h-3 w-3" />
                                                    <span>Delete</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* THE MESSAGE BUBBLE */}
                        <div
                            className={`relative text-sm sm:text-[15px] leading-relaxed break-words transition-all ${
                                isMedia
                                    ? "p-0 bg-transparent border-0 shadow-none"
                                    : isDeleted
                                        ? "px-4 py-2.5 bg-muted/40 text-muted-foreground border border-border/70 rounded-2xl shadow-xs"
                                        : isEditing
                                            ? "p-3 bg-card text-card-foreground border-2 border-primary/40 rounded-2xl shadow-md min-w-[240px] sm:min-w-[320px] max-w-full"
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
                                /* --- ENHANCED INLINE EDITING INTERFACE --- */
                                <div className="flex flex-col gap-2.5 w-full">
                                    <div className="flex items-center justify-between text-[11px] font-semibold text-primary">
                                        <span className="flex items-center gap-1">
                                            <Pencil className="h-3 w-3" />
                                            <span>Editing message</span>
                                        </span>
                                        <span className="text-muted-foreground text-[10px] font-mono">
                                            {editedText.length} chars
                                        </span>
                                    </div>
                                    <textarea
                                        ref={textareaRef}
                                        value={editedText}
                                        onChange={(e) => setEditedText(e.target.value)}
                                        className="w-full bg-background text-foreground border border-input rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none custom-scrollbar leading-relaxed"
                                        placeholder="Edit your message..."
                                        autoFocus
                                        disabled={isSubmitting}
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
                                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/50">
                                        <span className="text-[10px] text-muted-foreground hidden sm:inline">
                                            Press <kbd className="px-1 py-0.5 bg-muted rounded font-mono text-[9px]">Enter</kbd> to save, <kbd className="px-1 py-0.5 bg-muted rounded font-mono text-[9px]">Esc</kbd> to cancel
                                        </span>
                                        <div className="flex items-center gap-2 ml-auto">
                                            <button
                                                type="button"
                                                disabled={isSubmitting}
                                                onClick={() => {
                                                    setIsEditing(false);
                                                    setEditedText(message);
                                                }}
                                                className="px-3 py-1.5 text-xs rounded-xl hover:bg-muted font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                                            >
                                                <X className="h-3.5 w-3.5" />
                                                <span>Cancel</span>
                                            </button>
                                            <button
                                                type="button"
                                                disabled={!editedText.trim() || editedText.trim() === message || isSubmitting}
                                                onClick={handleSaveEdit}
                                                className="px-3.5 py-1.5 text-xs rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-semibold disabled:opacity-50 transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                                            >
                                                {isSubmitting ? (
                                                    <>
                                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                        <span>Saving...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <CheckIcon className="h-3.5 w-3.5" />
                                                        <span>Save</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {/* --- TEXT MESSAGE --- */}
                                    {messageType === 'text' && (
                                        <div className="space-y-1">
                                            <p className="whitespace-pre-wrap select-text font-normal pr-4 sm:pr-0">{message}</p>
                                            
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
