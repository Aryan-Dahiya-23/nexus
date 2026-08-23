import { useContext, useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { Users, X, Search, Check, Loader2, Hash, Sparkles } from "lucide-react";
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

    const clearAllMembers = () => {
        setSelectedMembers([]);
    };

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();

        if (status === 'pending') return;

        if (groupName.trim().length === 0) {
            toast.error('Enter a channel name');
            return;
        } else if (selectedMembers.length < 2) {
            toast.error('Select at least 2 members for a group chat');
            return;
        }

        mutate();
    };

    const isPending = status === 'pending';
    const remainingNeeded = Math.max(0, 2 - selectedMembers.length);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-md p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
            <motion.div
                initial={{ opacity: 0, scale: 0.94, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: 15 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="w-full max-w-lg bg-card text-card-foreground border border-border/80 rounded-3xl shadow-2xl relative overflow-hidden flex flex-col my-auto max-h-[92dvh]"
            >
                {/* Ambient glow accent */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-600" />
                <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

                {/* Modal Header */}
                <div className="p-5 sm:p-7 pb-4 border-b border-border/60 flex items-start justify-between shrink-0">
                    <div className="flex items-center space-x-3.5">
                        <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-cyan-500/20 via-sky-500/15 to-blue-600/20 border border-primary/25 flex items-center justify-center text-primary shrink-0 shadow-xs">
                            <Users className="h-5 w-5" />
                        </div>
                        <div>
                            <div className="inline-flex items-center gap-1 text-primary font-bold text-[10px] uppercase tracking-wider mb-0.5">
                                <Sparkles className="h-3 w-3" />
                                <span>Collaborative Workspace</span>
                            </div>
                            <h3 className="font-extrabold text-xl sm:text-2xl text-foreground tracking-tight">
                                Create Group Channel
                            </h3>
                        </div>
                    </div>

                    <button
                        type="button"
                        className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer shrink-0"
                        onClick={() => setGroupChatWidget(false)}
                        aria-label="Close dialog"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Scrollable Form Body */}
                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                    <div className="p-5 sm:p-7 space-y-4.5 overflow-y-auto custom-scrollbar flex-1">
                        {/* Channel Name Input */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                    Channel Name
                                </label>
                                <span className="text-[11px] font-mono text-muted-foreground/80">
                                    {groupName.length}/50
                                </span>
                            </div>
                            <div className="relative flex items-center">
                                <Hash className="absolute left-3.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                                <input
                                    type="text"
                                    maxLength={50}
                                    value={groupName}
                                    onChange={(e) => setGroupName(e.target.value)}
                                    placeholder="e.g. core-engineering or design-sync"
                                    className="w-full h-11 pl-9.5 pr-4 rounded-xl bg-background border border-input text-foreground text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all placeholder:text-muted-foreground/60"
                                />
                            </div>
                        </div>

                        {/* Selected Members Chips */}
                        {selectedMembers.length > 0 && (
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                        Selected Members ({selectedMembers.length})
                                    </label>
                                    <button
                                        type="button"
                                        onClick={clearAllMembers}
                                        className="text-[11px] text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                                    >
                                        Clear all
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto no-scrollbar p-2 rounded-xl bg-muted/40 border border-border/60">
                                    <AnimatePresence>
                                        {selectedMembers.map(member => (
                                            <motion.span
                                                key={member.id}
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.8 }}
                                                className="inline-flex items-center gap-1.5 pl-1.5 pr-2 py-1 rounded-lg bg-background text-foreground text-xs font-medium border border-border shadow-xs"
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
                        <div className="flex flex-col">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                                Add Members
                            </label>

                            {/* Search Input */}
                            <div className="relative flex items-center mb-2">
                                <Search className="absolute left-3.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                                <input
                                    type="text"
                                    value={memberSearch}
                                    onChange={(e) => setMemberSearch(e.target.value)}
                                    placeholder="Search directory by name..."
                                    className="w-full h-10 pl-9 pr-8 text-xs rounded-xl bg-background border border-input focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 text-foreground placeholder:text-muted-foreground/60 transition-all"
                                />
                                {memberSearch && (
                                    <button
                                        type="button"
                                        onClick={() => setMemberSearch("")}
                                        className="absolute right-2.5 p-1 rounded-full text-muted-foreground hover:text-foreground cursor-pointer"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                )}
                            </div>

                            {/* Member Candidate List */}
                            <div className="overflow-y-auto space-y-1 custom-scrollbar max-h-44 sm:max-h-52 rounded-xl border border-border/70 p-1.5 bg-background/60">
                                {isLoading && (
                                    <div className="flex items-center justify-center h-28 text-muted-foreground text-xs">
                                        <Loader2 className="h-4 w-4 animate-spin mr-2 text-primary" />
                                        <span>Loading directory...</span>
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
                                                className={`flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-all ${
                                                    isSelected
                                                        ? "bg-primary/15 text-primary border border-primary/25 font-semibold"
                                                        : "hover:bg-muted/70 text-foreground border border-transparent"
                                                }`}
                                            >
                                                <div className="flex items-center space-x-2.5 min-w-0">
                                                    <div className="relative shrink-0">
                                                        <img
                                                            src={person.picture || "https://res.cloudinary.com/dwyx9715k/image/upload/v1723145455/nexus/avatars/default_avatar.png"}
                                                            alt=""
                                                            className="h-7 w-7 rounded-full object-cover ring-1 ring-border/50"
                                                        />
                                                        {isOnline && (
                                                            <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 ring-1 ring-background" />
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-xs truncate font-medium">{person.fullName}</span>
                                                        <span className="text-[10px] text-muted-foreground/80 truncate">
                                                            {isOnline ? "Active now" : "Offline"}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className={`h-4 w-4 rounded-md border flex items-center justify-center transition-colors ${
                                                    isSelected
                                                        ? "bg-primary border-primary text-primary-foreground shadow-xs"
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
                    </div>

                    {/* Modal Footer */}
                    <div className="p-4 sm:p-6 pt-3.5 border-t border-border/80 bg-card/60 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                        <div className="text-xs text-muted-foreground w-full sm:w-auto text-center sm:text-left">
                            {remainingNeeded > 0 ? (
                                <span className="text-amber-500 font-medium">
                                    Add {remainingNeeded} more {remainingNeeded === 1 ? 'member' : 'members'} to create channel
                                </span>
                            ) : (
                                <span className="text-emerald-500 font-semibold flex items-center justify-center sm:justify-start gap-1">
                                    <Check className="h-3.5 w-3.5" />
                                    <span>{selectedMembers.length} members ready</span>
                                </span>
                            )}
                        </div>

                        <div className="flex items-center space-x-2.5 w-full sm:w-auto justify-end">
                            <button
                                type="button"
                                className="flex-1 sm:flex-initial px-4 py-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors cursor-pointer"
                                onClick={() => setGroupChatWidget(false)}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isPending || remainingNeeded > 0 || groupName.trim().length === 0}
                                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 hover:to-sky-500 text-white font-semibold text-xs shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
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
