import { useContext, useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { Users, X, Search, Check, Loader2 } from "lucide-react";
import { AuthContext } from "../../contexts/AuthContext";
import { ThemeContext } from "../../contexts/ThemeContext";
import { fetchPeople } from "../../api/auth";
import { createGroupConversation } from "../../api/conversation";
import { queryClient } from "../../api/auth";
import { Participant } from "../../types";

interface SelectedMember {
    id: string;
    fullName: string;
    picture: string;
}

const GroupChatWidget = () => {
    const { setGroupChatWidget } = useContext(ThemeContext);
    const { user, connectedUsers } = useContext(AuthContext);
    const [groupName, setGroupName] = useState("");
    const [memberSearch, setMemberSearch] = useState("");
    const [selectedMembers, setSelectedMembers] = useState<SelectedMember[]>([]);

    const { data: people, isLoading } = useQuery<Participant[]>({
        queryKey: ['people'],
        queryFn: () => {
            if (!user?._id) return [];
            return fetchPeople(user._id);
        },
        enabled: Boolean(user?._id),
    });

    const { mutate, status } = useMutation({
        mutationFn: () => {
            if (!user?._id) throw new Error("User not authenticated");
            const payload = selectedMembers.map(m => ({ id: m.id }));
            return createGroupConversation(payload, groupName.trim(), user._id);
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['user'] });
            setGroupChatWidget(false);
            toast.success("New Group channel created");
        },
        onError: (err) => {
            console.error("Error creating group:", err);
            toast.error("Failed to create group channel");
        }
    });

    // Close on Escape
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setGroupChatWidget(false);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [setGroupChatWidget]);

    const filteredPeople = useMemo(() => {
        if (!people) return [];
        return people.filter(person =>
            person.fullName.toLowerCase().includes(memberSearch.toLowerCase())
        );
    }, [people, memberSearch]);

    const toggleMember = (person: Participant) => {
        const isSelected = selectedMembers.some(m => m.id === person._id);
        if (isSelected) {
            setSelectedMembers(prev => prev.filter(m => m.id !== person._id));
        } else {
            setSelectedMembers(prev => [
                ...prev,
                { id: person._id, fullName: person.fullName, picture: person.picture }
            ]);
        }
    };

    const removeMember = (id: string) => {
        setSelectedMembers(prev => prev.filter(m => m.id !== id));
    };

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();

        if (status === 'pending') return;

        if (groupName.trim().length === 0) {
            toast.error('Enter a group name');
            return;
        } else if (selectedMembers.length < 2) {
            toast.error('Select at least 2 members for a group chat');
            return;
        }

        mutate();
    };

    const isPending = status === 'pending';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <motion.div
                initial={{ opacity: 0, scale: 0.94, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: 15 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="w-full max-w-lg bg-card text-card-foreground border border-border rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
            >
                {/* Top glow accent line */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-600" />

                {/* Header with Close button */}
                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-primary font-semibold text-xs mb-1">
                            <Users className="h-4 w-4" />
                            <span>NEW CHANNEL</span>
                        </div>
                        <h3 className="font-extrabold text-xl sm:text-2xl text-foreground tracking-tight">
                            Create Group Chat
                        </h3>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                            Connect 2 or more teammates in a shared channel.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                        onClick={() => setGroupChatWidget(false)}
                        aria-label="Close dialog"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="mt-5 space-y-4 flex flex-col flex-1 overflow-hidden">
                    {/* Group Name Input */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                Channel Name
                            </label>
                            <span className="text-[11px] font-mono text-muted-foreground/80">
                                {groupName.length}/50
                            </span>
                        </div>
                        <input
                            type="text"
                            maxLength={50}
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            placeholder="e.g. Core Engineering / Design Sprint"
                            className="w-full h-11 px-4 rounded-xl bg-background border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all placeholder:text-muted-foreground/70"
                        />
                    </div>

                    {/* Selected Members Chips */}
                    {selectedMembers.length > 0 && (
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                                Selected Members ({selectedMembers.length})
                            </p>
                            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto custom-scrollbar p-1.5 rounded-xl bg-muted/40 border border-border/50">
                                <AnimatePresence>
                                    {selectedMembers.map(member => (
                                        <motion.span
                                            key={member.id}
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            className="inline-flex items-center gap-1.5 pl-1.5 pr-2 py-1 rounded-lg bg-background text-foreground text-xs font-medium border border-border/80 shadow-xs"
                                        >
                                            <img
                                                src={member.picture || "https://res.cloudinary.com/dwyx9715k/image/upload/v1723145455/nexus/avatars/default_avatar.png"}
                                                alt=""
                                                className="h-4 w-4 rounded-full object-cover"
                                            />
                                            <span className="truncate max-w-[120px]">{member.fullName.split(' ')[0]}</span>
                                            <button
                                                type="button"
                                                onClick={() => removeMember(member.id)}
                                                className="text-muted-foreground hover:text-destructive transition-colors ml-0.5 cursor-pointer"
                                                aria-label={`Remove ${member.fullName}`}
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </motion.span>
                                    ))}
                                </AnimatePresence>
                            </div>
                        </div>
                    )}

                    {/* Member Directory Search & Selector */}
                    <div className="flex-1 flex flex-col min-h-0">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                            Add Teammates
                        </label>

                        {/* Search Input */}
                        <div className="relative flex items-center mb-2">
                            <Search className="absolute left-3 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                            <input
                                type="text"
                                value={memberSearch}
                                onChange={(e) => setMemberSearch(e.target.value)}
                                placeholder="Search teammates by name..."
                                className="w-full h-9 pl-8.5 pr-8 text-xs rounded-xl bg-background border border-input focus:outline-none focus:ring-1 focus:ring-primary/40 text-foreground placeholder:text-muted-foreground/70"
                            />
                            {memberSearch && (
                                <button
                                    type="button"
                                    onClick={() => setMemberSearch("")}
                                    className="absolute right-2 p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            )}
                        </div>

                        {/* Member Candidate List */}
                        <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar max-h-48 rounded-xl border border-border/60 p-1 bg-background/50">
                            {isLoading && (
                                <div className="flex items-center justify-center h-28 text-muted-foreground text-xs">
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    <span>Loading teammates...</span>
                                </div>
                            )}

                            {!isLoading && filteredPeople.length > 0 && (
                                filteredPeople.map((person: Participant) => {
                                    const isSelected = selectedMembers.some(m => m.id === person._id);
                                    const isOnline = connectedUsers.includes(person._id);

                                    return (
                                        <div
                                            key={person._id}
                                            onClick={() => toggleMember(person)}
                                            className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-all ${
                                                isSelected
                                                    ? "bg-primary/15 text-primary border border-primary/25 font-semibold"
                                                    : "hover:bg-muted text-foreground border border-transparent"
                                            }`}
                                        >
                                            <div className="flex items-center space-x-2.5 min-w-0">
                                                <div className="relative shrink-0">
                                                    <img
                                                        src={person.picture || "https://res.cloudinary.com/dwyx9715k/image/upload/v1723145455/nexus/avatars/default_avatar.png"}
                                                        alt=""
                                                        className="h-7 w-7 rounded-full object-cover"
                                                    />
                                                    {isOnline && (
                                                        <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 ring-1 ring-background" />
                                                    )}
                                                </div>
                                                <span className="text-xs truncate">{person.fullName}</span>
                                            </div>

                                            <div className={`h-4 w-4 rounded-md border flex items-center justify-center transition-colors ${
                                                isSelected
                                                    ? "bg-primary border-primary text-primary-foreground"
                                                    : "border-muted-foreground/40 bg-background"
                                            }`}>
                                                {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                                            </div>
                                        </div>
                                    );
                                })
                            )}

                            {!isLoading && filteredPeople.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-28 text-center px-4 text-xs text-muted-foreground">
                                    <p>No teammates found matching "{memberSearch}"</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-3 border-t border-border/80 flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                            {selectedMembers.length < 2 ? (
                                <span className="text-amber-500">Need at least 2 members</span>
                            ) : (
                                <span className="text-emerald-500 font-medium">Ready to create channel</span>
                            )}
                        </span>

                        <div className="flex items-center space-x-2">
                            <button
                                type="button"
                                className="px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors cursor-pointer"
                                onClick={() => setGroupChatWidget(false)}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isPending || selectedMembers.length < 2 || groupName.trim().length === 0}
                                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 hover:to-sky-500 text-white font-semibold text-xs shadow-md shadow-cyan-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                            >
                                {isPending ? (
                                    <>
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        <span>Creating...</span>
                                    </>
                                ) : (
                                    <>
                                        <Users className="h-3.5 w-3.5" />
                                        <span>Create Channel</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default GroupChatWidget;
