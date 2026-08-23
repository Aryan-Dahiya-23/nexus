import React, { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { MoreVertical, Trash2, Users, X } from "lucide-react";
import { ThemeContext } from "../../contexts/ThemeContext";
import { queryClient } from "../../api/auth";
import { Conversation, Participant, User } from "../../types";

interface DrawerProps {
    name: string;
    avatarSrc: string[];
}

const Drawer: React.FC<DrawerProps> = ({ name, avatarSrc }) => {
    const { id } = useParams();
    const user = queryClient.getQueryData<User>(['user']);
    const conversation = queryClient.getQueryData<Conversation>(['chats', id]);

    const [participants, setParticipants] = useState<string>("");
    const { setDeleteModal } = useContext(ThemeContext);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const participantsList = conversation?.participants || [];
        const userFullName = user?.fullName || '';
        const newParticipants = (userFullName ? userFullName + ", " : "") + participantsList.map((participant: Participant) => participant.fullName).join(', ');
        setParticipants(newParticipants);
    }, [conversation, user?.fullName]);

    return (
        <>
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                aria-label="Conversation details"
            >
                <MoreVertical className="h-5 w-5" />
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div
                        className="w-full max-w-sm h-full bg-card text-card-foreground border-l border-border p-6 shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-250 relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            className="absolute right-4 top-4 p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                            onClick={() => setIsOpen(false)}
                            aria-label="Close details"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        <div>
                            {/* Avatar & Title Header */}
                            <div className="flex flex-col items-center text-center mt-6">
                                <div className="relative mb-3">
                                    <img
                                        src={avatarSrc[0] || "https://res.cloudinary.com/dgyocpgla/image/upload/v1711202863/nopathuser_lbf2om.png"}
                                        alt={name}
                                        className="h-20 w-20 rounded-3xl object-cover border border-border shadow-md"
                                    />
                                </div>
                                <h3 className="text-xl font-extrabold text-foreground tracking-tight">{name}</h3>
                                <span className="text-xs text-muted-foreground mt-0.5">
                                    {avatarSrc.length > 1 ? `${avatarSrc.length} Group Members` : "Direct Conversation"}
                                </span>
                            </div>

                            {/* Members Roster */}
                            <div className="mt-8 bg-muted/40 border border-border/60 rounded-2xl p-4">
                                <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                                    <Users className="h-4 w-4 text-primary" />
                                    <span>Participants</span>
                                </div>
                                <p className="text-sm text-foreground font-medium leading-relaxed">
                                    {participants || "Loading participants..."}
                                </p>
                            </div>
                        </div>

                        {/* Bottom Actions */}
                        <div className="pt-6 border-t border-border mt-auto">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsOpen(false);
                                    setDeleteModal(true);
                                }}
                                className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/20 font-semibold text-sm transition-colors cursor-pointer"
                            >
                                <Trash2 className="h-4 w-4" />
                                <span>Delete Conversation</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Drawer;
