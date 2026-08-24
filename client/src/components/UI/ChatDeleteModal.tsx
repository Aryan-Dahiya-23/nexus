import React, { useContext, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { AlertTriangle, X, Loader2, Trash2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { ThemeContext } from "../../contexts/ThemeContext";
import { AuthContext } from "../../contexts/AuthContext";
import { queryClient } from "../../api/auth";
import { deleteConversation } from "../../api/conversation";

const ChatDeleteModal: React.FC = () => {
    const { id: urlId } = useParams<{ id?: string }>();
    const navigate = useNavigate();

    const { user } = useContext(AuthContext);
    const { setDeleteModal, deleteTarget, setDeleteTarget } = useContext(ThemeContext);

    const targetConvId = deleteTarget?.id || urlId;
    const targetConvName = deleteTarget?.name;

    const handleDeleteModal = useCallback(() => {
        setDeleteModal(false);
        setDeleteTarget(null);
    }, [setDeleteModal, setDeleteTarget]);

    const { mutate, status } = useMutation({
        mutationFn: () => {
            if (!user?._id || !targetConvId) throw new Error("User and conversation ID required");
            return deleteConversation(user._id, targetConvId);
        },
        onSettled: async () => {
            await queryClient.invalidateQueries({ queryKey: ['user'] });
            handleDeleteModal();
            if (urlId === targetConvId) {
                navigate("/chats");
            }
        }
    });

    const handleDeleteConversation = () => {
        if (status === 'pending') return;
        mutate();
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                handleDeleteModal();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleDeleteModal]);

    const isPending = status === 'pending';

    const modalContent = (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200"
            onClick={handleDeleteModal}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.94, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: 15 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="w-full max-w-md bg-card text-card-foreground border border-border rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    type="button"
                    className="absolute right-4 top-4 p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                    onClick={handleDeleteModal}
                    aria-label="Close dialog"
                >
                    <X className="h-5 w-5" />
                </button>

                <div className="flex items-start space-x-3.5 sm:space-x-4">
                    <div className="p-2.5 sm:p-3 rounded-2xl bg-destructive/10 text-destructive border border-destructive/20 shrink-0">
                        <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>

                    <div>
                        <h3 className="font-extrabold text-base sm:text-xl text-foreground tracking-tight">
                            Delete Conversation?
                        </h3>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 leading-relaxed">
                            {targetConvName
                                ? `Are you sure you want to remove your conversation with "${targetConvName}" from your active chat list?`
                                : "Are you sure you want to remove this conversation from your active chats list?"}
                        </p>
                    </div>
                </div>

                <div className="mt-6 sm:mt-8 flex items-center justify-end space-x-2.5">
                    <button
                        type="button"
                        disabled={isPending}
                        className="px-4 py-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                        onClick={handleDeleteModal}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        disabled={isPending}
                        onClick={handleDeleteConversation}
                        className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground font-semibold text-xs shadow-md shadow-destructive/20 transition-all disabled:opacity-50 cursor-pointer"
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                <span>Deleting...</span>
                            </>
                        ) : (
                            <>
                                <Trash2 className="h-3.5 w-3.5" />
                                <span>Delete Chat</span>
                            </>
                        )}
                    </button>
                </div>
            </motion.div>
        </div>
    );

    return typeof document !== "undefined" ? createPortal(modalContent, document.body) : modalContent;
};

export default ChatDeleteModal;
