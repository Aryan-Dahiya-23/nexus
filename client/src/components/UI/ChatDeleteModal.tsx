import React, { useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, X } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { ThemeContext } from "../../contexts/ThemeContext";
import { queryClient } from "../../api/auth";
import { deleteConversation } from "../../api/conversation";
import { toast } from "react-toastify";
import { User } from "../../types";

const ChatDeleteModal: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const user = queryClient.getQueryData<User>(['user']);
    const { setDeleteModal } = useContext(ThemeContext);

    const { mutate, status } = useMutation({
        mutationFn: () => {
            if (!user?._id || !id) throw new Error("User and conversation ID required");
            return deleteConversation(user._id, id);
        },
        onSettled: async () => {
            await queryClient.invalidateQueries({ queryKey: ['user'] });
            toast.success("Conversation removed");
            handleDeleteModal();
            navigate("/");
        }
    });

    const handleDeleteConversation = () => {
        if (status === 'pending') return;
        mutate();
    };

    const handleDeleteModal = () => {
        setDeleteModal(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-card text-card-foreground border border-border rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
                <button
                    type="button"
                    className="absolute right-4 top-4 p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                    onClick={handleDeleteModal}
                    aria-label="Close dialog"
                >
                    <X className="h-5 w-5" />
                </button>

                <div className="flex items-start space-x-4">
                    <div className="p-3 rounded-2xl bg-destructive/10 text-destructive border border-destructive/20 shrink-0">
                        <AlertTriangle className="h-6 w-6" />
                    </div>

                    <div>
                        <h3 className="font-extrabold text-lg sm:text-xl text-foreground tracking-tight">
                            Delete Conversation?
                        </h3>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 leading-relaxed">
                            Are you sure you want to remove this chat from your active conversations list?
                        </p>
                    </div>
                </div>

                <div className="mt-8 flex items-center justify-end space-x-3">
                    <button
                        type="button"
                        className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-xl transition-colors cursor-pointer"
                        onClick={handleDeleteModal}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        disabled={status === 'pending'}
                        onClick={handleDeleteConversation}
                        className="px-5 py-2.5 rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground font-semibold text-sm shadow-md transition-all disabled:opacity-50 cursor-pointer"
                    >
                        {status === 'pending' ? 'Deleting...' : 'Delete Chat'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatDeleteModal;
