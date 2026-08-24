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
    const actionsRef = useRef<HTMLDivElement | null>(null);
    const actionTriggerRef = useRef<HTMLButtonElement | null>(null);
    const firstActionRef = useRef<HTMLButtonElement | null>(null);
    const cancelDeleteRef = useRef<HTMLButtonElement | null>(null);

    const formattedTime = new Date(createdAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });

    const isRight = position === "right";
    const isMedia = (messageType === 'image' || messageType === 'video') && !isDeleted;
    const canCopy = messageType === 'text';
    // Visibility must follow message ownership, not callback identity. The chat
    // screen always supplies these handlers; tying visibility to them made the
    // Edit/Delete actions disappear despite an outgoing message being shown.
    const canEdit = isRight && messageType === 'text';
    const canDelete = isRight;
    const canShowActions = !isDeleted && !isEditing && !isConfirmingDelete && (canCopy || canEdit || canDelete);
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
            if (actionsRef.current && !actionsRef.current.contains(event.target as Node)) {
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

    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key !== 'Escape') return;
            if (showActionsMenu) {
                setShowActionsMenu(false);
                actionTriggerRef.current?.focus();
            }
            if (isConfirmingDelete) {
                setIsConfirmingDelete(false);
                actionTriggerRef.current?.focus();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [showActionsMenu, isConfirmingDelete]);

    useEffect(() => {
        if (!showActionsMenu) return;
        const frame = requestAnimationFrame(() => firstActionRef.current?.focus());
        return () => cancelAnimationFrame(frame);
    }, [showActionsMenu]);

    useEffect(() => {
        if (!isConfirmingDelete) return;
        const frame = requestAnimationFrame(() => cancelDeleteRef.current?.focus());
        return () => cancelAnimationFrame(frame);
    }, [isConfirmingDelete]);

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
        } catch {
            toast.error("We couldn't save your changes. Please try again.");
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
        } catch {
            toast.error("We couldn't delete this message. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleMenuKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'Escape') {
            event.preventDefault();
            setShowActionsMenu(false);
            actionTriggerRef.current?.focus();
            return;
        }

        if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
        event.preventDefault();
        const menuItems = Array.from(
            event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="menuitem"]')
        );
        const currentIndex = menuItems.indexOf(document.activeElement as HTMLButtonElement);
        const direction = event.key === 'ArrowDown' ? 1 : -1;
        const nextIndex = currentIndex === -1
            ? 0
            : (currentIndex + direction + menuItems.length) % menuItems.length;
        menuItems[nextIndex]?.focus();
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
                        {/* Desktop: keep primary actions direct and unmistakable. */}
                        {canShowActions && (
                            <div className={`absolute top-1/2 z-30 hidden -translate-y-1/2 items-center gap-1 rounded-2xl border border-border bg-card p-1 shadow-lg transition-all duration-150 group-hover/bubble:opacity-100 group-focus-within/bubble:opacity-100 sm:flex ${
                                isRight
                                    ? "right-full mr-2 translate-x-1 opacity-0 group-hover/bubble:translate-x-0 group-focus-within/bubble:translate-x-0"
                                    : "left-full ml-2 -translate-x-1 opacity-0 group-hover/bubble:translate-x-0 group-focus-within/bubble:translate-x-0"
                            }`}>
                                {canCopy && (
                                    <button
                                        type="button"
                                        onClick={handleCopyText}
                                        className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:bg-muted focus-visible:outline-none"
                                        title="Copy text"
                                    >
                                        <Copy className="h-3.5 w-3.5" />
                                        <span>Copy</span>
                                    </button>
                                )}
                                {canEdit && (
                                    <button
                                        type="button"
                                        onClick={handleStartEdit}
                                        className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:bg-muted focus-visible:outline-none"
                                        title="Edit message"
                                    >
                                        <Pencil className="h-3.5 w-3.5" />
                                        <span>Edit</span>
                                    </button>
                                )}
                                {canDelete && (
                                    <button
                                        type="button"
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            setIsConfirmingDelete(true);
                                        }}
                                        className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/10 focus-visible:bg-destructive/10 focus-visible:outline-none"
                                        title="Delete message"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                        <span>Delete</span>
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Touch: use a compact menu without sacrificing its actions. */}
                        {canShowActions && (
                            <div ref={actionsRef} className="absolute right-1 top-1 z-30 sm:hidden">
                                <button
                                    ref={actionTriggerRef}
                                    type="button"
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        setShowActionsMenu((isOpen) => !isOpen);
                                    }}
                                    className={`grid h-8 w-8 place-items-center rounded-full border shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
                                        showActionsMenu
                                            ? "scale-100 opacity-100 bg-card text-foreground border-border"
                                            : "scale-95 bg-card/95 text-muted-foreground border-border/80 hover:bg-muted hover:text-foreground"
                                    }`}
                                    aria-label="Open message actions"
                                    aria-haspopup="menu"
                                    aria-expanded={showActionsMenu}
                                >
                                    <MoreHorizontal className="h-4 w-4" />
                                </button>

                                <AnimatePresence>
                                    {showActionsMenu && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.96, y: 4 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.96, y: 4 }}
                                            transition={{ duration: 0.14, ease: "easeOut" }}
                                            className="absolute bottom-full right-0 mb-2 flex min-w-[184px] flex-col overflow-hidden rounded-2xl border border-border bg-card p-1.5 text-card-foreground shadow-xl"
                                            role="menu"
                                            aria-label="Message actions"
                                            onClick={(event) => event.stopPropagation()}
                                            onKeyDown={handleMenuKeyDown}
                                        >
                                            <p className="px-2.5 pb-1 pt-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                                Message
                                            </p>
                                            {canCopy && (
                                                <button
                                                    ref={firstActionRef}
                                                    type="button"
                                                    onClick={handleCopyText}
                                                    className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-xs font-medium transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
                                                    role="menuitem"
                                                >
                                                    <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                                                    <span>Copy text</span>
                                                </button>
                                            )}
                                            {canEdit && (
                                                <button
                                                    ref={canCopy ? undefined : firstActionRef}
                                                    type="button"
                                                    onClick={handleStartEdit}
                                                    className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-xs font-medium transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
                                                    role="menuitem"
                                                >
                                                    <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                                                    <span>Edit message</span>
                                                </button>
                                            )}
                                            {canDelete && (
                                                <div className="mt-1 border-t border-border pt-1">
                                                    <button
                                                        ref={!canCopy && !canEdit ? firstActionRef : undefined}
                                                        type="button"
                                                        onClick={(event) => {
                                                            event.stopPropagation();
                                                            setShowActionsMenu(false);
                                                            setIsConfirmingDelete(true);
                                                        }}
                                                        className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-xs font-semibold text-destructive transition-colors hover:bg-destructive/10 focus-visible:bg-destructive/10 focus-visible:outline-none"
                                                        role="menuitem"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                        <span>Delete message</span>
                                                    </button>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}

                        {/* Viewport-Safe Inline Delete Confirmation Card */}
                        <AnimatePresence>
                            {isConfirmingDelete && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: 4 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 4 }}
                                    className={`absolute bottom-full z-40 mb-2 flex w-[min(320px,calc(100vw-3rem))] flex-col gap-3 rounded-2xl border border-destructive/30 bg-card p-3.5 text-card-foreground shadow-xl ${
                                        isRight ? "right-0" : "left-0"
                                    }`}
                                    onClick={(e) => e.stopPropagation()}
                                    role="dialog"
                                    aria-modal="false"
                                    aria-labelledby={`delete-message-title-${messageId}`}
                                    aria-describedby={`delete-message-description-${messageId}`}
                                >
                                    <div id={`delete-message-title-${messageId}`} className="flex items-center gap-2 text-destructive font-semibold text-xs">
                                        <AlertCircle className="h-4 w-4 shrink-0" />
                                        <span>Delete for everyone?</span>
                                    </div>
                                    <p id={`delete-message-description-${messageId}`} className="text-[11px] leading-relaxed text-muted-foreground">
                                        This can’t be undone. Everyone in this chat will see that a message was removed.
                                    </p>
                                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-border/50">
                                        <button
                                            ref={cancelDeleteRef}
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
                                                    <span>Delete message</span>
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
                                <div className="flex w-full flex-col gap-3">
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-primary">
                                            <Pencil className="h-3.5 w-3.5" />
                                            <span>Edit message</span>
                                        </span>
                                        <span className="text-[10px] font-medium tabular-nums text-muted-foreground">
                                            {editedText.length} / 5000
                                        </span>
                                    </div>
                                    <textarea
                                        ref={textareaRef}
                                        value={editedText}
                                        onChange={(e) => setEditedText(e.target.value)}
                                        maxLength={5000}
                                        className="w-full resize-none rounded-xl border border-input bg-background p-3 text-sm leading-relaxed text-foreground shadow-inner outline-none transition-shadow placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/40 custom-scrollbar"
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
                                    <div className="flex items-center justify-between gap-2 border-t border-border/50 pt-2">
                                        <span className="hidden text-[10px] text-muted-foreground sm:inline">
                                            <kbd className="rounded bg-muted px-1 py-0.5 font-mono text-[9px]">Enter</kbd> save · <kbd className="rounded bg-muted px-1 py-0.5 font-mono text-[9px]">Shift + Enter</kbd> new line
                                        </span>
                                        <div className="flex items-center gap-2 ml-auto">
                                            <button
                                                type="button"
                                                disabled={isSubmitting}
                                                onClick={() => {
                                                    setIsEditing(false);
                                                    setEditedText(message);
                                                }}
                                                className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                <X className="h-3.5 w-3.5" />
                                                <span>Cancel</span>
                                            </button>
                                            <button
                                                type="button"
                                                disabled={!editedText.trim() || editedText.trim() === message || isSubmitting}
                                                onClick={handleSaveEdit}
                                                className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
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
                                            <p className="whitespace-pre-wrap select-text font-normal pr-8 sm:pr-0">{message}</p>
                                            
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
                                        <button
                                            type="button"
                                            className="relative block max-w-[320px] cursor-pointer overflow-hidden rounded-2xl border border-border/60 bg-muted/20 text-left shadow-xs group/img focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:max-w-[440px] md:max-w-[500px]"
                                            onClick={handleImageClick}
                                            aria-label="Open image preview"
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
                                        </button>
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
