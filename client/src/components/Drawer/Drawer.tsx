import React, { useContext, useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MoreVertical, Trash2, Users, X, Shield } from "lucide-react";
import { ThemeContext } from "../../contexts/ThemeContext";
import { AuthContext } from "../../contexts/AuthContext";
import { queryClient } from "../../api/auth";
import { Conversation, Participant, User } from "../../types";

interface DrawerProps {
    name: string;
    avatarSrc: string[];
}

const DEFAULT_AVATAR = "https://res.cloudinary.com/dwyx9715k/image/upload/v1723145455/nexus/avatars/default_avatar.png";

const Drawer: React.FC<DrawerProps> = ({ name, avatarSrc }) => {
    const { id } = useParams();
    const { connectedUsers } = useContext(AuthContext);
    const user = queryClient.getQueryData<User>(['user']);
    const conversation = queryClient.getQueryData<Conversation>(['chats', id]);

    const { setDeleteModal } = useContext(ThemeContext);
    const [isOpen, setIsOpen] = useState(false);

    const handleClose = useCallback(() => {
        setIsOpen(false);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                handleClose();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, handleClose]);

    const participantsList: Participant[] = conversation?.participants || [];
    const isGroup = conversation?.type === 'group' || avatarSrc.length > 1;

    return (
        <>
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
                aria-label="Conversation details"
            >
                <MoreVertical className="h-5 w-5" />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <div
                        className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm"
                        onClick={handleClose}
                    >
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 28, stiffness: 300 }}
                            className="w-full max-w-sm h-full bg-card text-card-foreground border-l border-border p-5 sm:p-6 shadow-2xl flex flex-col justify-between overflow-y-auto relative"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Close Button */}
                            <button
                                type="button"
                                className="absolute right-4 top-4 p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer z-10"
                                onClick={handleClose}
                                aria-label="Close details"
                            >
                                <X className="h-5 w-5" />
                            </button>

                            <div className="space-y-6">
                                {/* Profile / Group Header */}
                                <div className="flex flex-col items-center text-center mt-4">
                                    <div className="relative mb-3">
                                        {isGroup ? (
                                            <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-primary/30 flex items-center justify-center shadow-lg">
                                                <Users className="h-10 w-10 text-primary" />
                                            </div>
                                        ) : (
                                            <img
                                                src={avatarSrc[0] || DEFAULT_AVATAR}
                                                alt={name}
                                                className="h-20 w-20 rounded-3xl object-cover ring-2 ring-border shadow-lg"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = DEFAULT_AVATAR;
                                                }}
                                            />
                                        )}
                                    </div>
                                    <h3 className="text-lg sm:text-xl font-extrabold text-foreground tracking-tight max-w-[260px] truncate">
                                        {name}
                                    </h3>
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 mt-1.5 rounded-full bg-muted text-[11px] font-semibold text-muted-foreground border border-border/80">
                                        <Shield className="h-3 w-3 text-emerald-500" />
                                        {isGroup ? `${participantsList.length + 1} Members • Group Channel` : "Direct Encrypted Chat"}
                                    </span>
                                </div>

                                {/* Participants Section */}
                                <div className="space-y-2.5">
                                    <div className="flex items-center justify-between px-1">
                                        <div className="flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                            <Users className="h-3.5 w-3.5 text-primary" />
                                            <span>Members</span>
                                        </div>
                                        <span className="text-[11px] font-mono text-muted-foreground">
                                            {participantsList.length + (user ? 1 : 0)}
                                        </span>
                                    </div>

                                    <div className="space-y-1 max-h-64 overflow-y-auto custom-scrollbar rounded-2xl border border-border/70 p-1.5 bg-background/50">
                                        {/* Current User Row */}
                                        {user && (
                                            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-primary/10 border border-primary/20">
                                                <div className="flex items-center space-x-2.5 min-w-0">
                                                    <img
                                                        src={user.picture || DEFAULT_AVATAR}
                                                        alt={user.fullName}
                                                        className="h-7 w-7 rounded-full object-cover ring-1 ring-border/50"
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).src = DEFAULT_AVATAR;
                                                        }}
                                                    />
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-xs font-bold truncate text-primary">{user.fullName} (You)</span>
                                                        <span className="text-[10px] text-emerald-500 font-medium">Online</span>
                                                    </div>
                                                </div>
                                                <span className="text-[10px] uppercase font-bold text-primary px-1.5 py-0.5 rounded-md bg-primary/15">
                                                    Host
                                                </span>
                                            </div>
                                        )}

                                        {/* Remote Participants */}
                                        {participantsList.map((participant: Participant) => {
                                            const isOnline = connectedUsers.includes(participant._id);
                                            return (
                                                <div
                                                    key={participant._id}
                                                    className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-muted/60 transition-colors"
                                                >
                                                    <div className="flex items-center space-x-2.5 min-w-0">
                                                        <div className="relative shrink-0">
                                                            <img
                                                                src={participant.picture || DEFAULT_AVATAR}
                                                                alt={participant.fullName}
                                                                className="h-7 w-7 rounded-full object-cover ring-1 ring-border/50"
                                                                onError={(e) => {
                                                                    (e.target as HTMLImageElement).src = DEFAULT_AVATAR;
                                                                }}
                                                            />
                                                            {isOnline && (
                                                                <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 ring-1 ring-background" />
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="text-xs font-medium truncate text-foreground">{participant.fullName}</span>
                                                            <span className="text-[10px] text-muted-foreground truncate">
                                                                {isOnline ? "Active now" : "Offline"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Bottom Actions */}
                            <div className="pt-6 border-t border-border mt-auto space-y-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsOpen(false);
                                        setDeleteModal(true);
                                    }}
                                    className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-2xl bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/20 font-semibold text-xs transition-colors cursor-pointer active:scale-98"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    <span>Delete Conversation</span>
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};

export default Drawer;
