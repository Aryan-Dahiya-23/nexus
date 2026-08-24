import { useContext, useEffect, useState, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useInfiniteQuery, useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { Users, X, Search, Check, Loader2, Hash, Sparkles, UserPlus } from "lucide-react";
import { AuthContext } from "../../contexts/AuthContext";
import { ThemeContext } from "../../contexts/ThemeContext";
import { fetchPeople, queryClient } from "../../api/auth";
import { createGroupConversation } from "../../api/conversation";
import { Participant } from "../../types";
import { useDebounce } from "../../hooks/useDebounce";

interface SelectedMember {
    id: string;
    fullName: string;
    picture: string;
}

const DEFAULT_AVATAR = "https://res.cloudinary.com/dwyx9715k/image/upload/v1723145455/nexus/avatars/default_avatar.png";

const GroupChatWidget = () => {
    const { groupChatWidget, setGroupChatWidget } = useContext(ThemeContext);
    const { user, connectedUsers } = useContext(AuthContext);
    const [groupName, setGroupName] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const debouncedSearch = useDebounce(searchQuery, 300);
    const [selectedMembers, setSelectedMembers] = useState<SelectedMember[]>([]);

    const isOpen = groupChatWidget || true;

    const {
        data,
        isLoading,
        isFetchingNextPage,
        hasNextPage,
        fetchNextPage,
    } = useInfiniteQuery({
        queryKey: ['group-people', debouncedSearch],
        queryFn: ({ pageParam = 1 }) =>
            fetchPeople(user?._id, {
                page: pageParam as number,
                limit: 15,
                search: debouncedSearch.trim() || undefined,
            }),
        initialPageParam: 1,
        getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.currentPage + 1 : undefined),
        enabled: isOpen && !!user?._id,
    });

    const availableUsers = useMemo(() => {
        return data?.pages.flatMap((page) => page.users) ?? [];
    }, [data]);

    const observerTarget = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const currentTarget = observerTarget.current;
        if (!currentTarget) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
                    fetchNextPage();
                }
            },
            { threshold: 0.1 }
        );

        observer.observe(currentTarget);

        return () => {
            observer.unobserve(currentTarget);
        };
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    const { mutate, status } = useMutation({
        mutationFn: () => {
            if (!user?._id) throw new Error("User not authenticated");
            const payload = selectedMembers.map(m => ({ id: m.id }));
            return createGroupConversation(payload, groupName.trim(), user._id);
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['user'] });
            setGroupChatWidget(false);
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

    const modalContent = (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-md p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 12 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="w-full max-w-md bg-card text-card-foreground border border-border/80 rounded-2xl sm:rounded-3xl shadow-2xl relative overflow-hidden flex flex-col my-auto max-h-[90dvh]"
            >
                {/* Top cyan gradient accent bar */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-600 z-10" />

                {/* Modal Header */}
                <div className="p-4 sm:p-6 pb-3 sm:pb-4 border-b border-border/60 flex items-center justify-between shrink-0 bg-card/80">
                    <div className="flex items-center space-x-2.5 sm:space-x-3">
                        <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-2xl bg-gradient-to-br from-cyan-500/20 via-sky-500/15 to-blue-600/20 border border-primary/25 flex items-center justify-center text-primary shrink-0 shadow-xs">
                            <Users className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                        </div>
                        <div>
                            <div className="inline-flex items-center gap-1 text-primary font-bold text-[10px] uppercase tracking-wider mb-0.5">
                                <Sparkles className="h-3 w-3" />
                                <span>Collaborative Workspace</span>
                            </div>
                            <h3 className="font-extrabold text-base sm:text-xl text-foreground tracking-tight leading-tight">
                                Create Group Channel
                            </h3>
                        </div>
                    </div>

                    <button
                        type="button"
                        className="p-1.5 sm:p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer shrink-0"
                        onClick={() => setGroupChatWidget(false)}
                        aria-label="Close dialog"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Scrollable Form Body */}
                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                    <div className="p-4 sm:p-6 space-y-3.5 sm:space-y-4 overflow-y-auto custom-scrollbar flex-1">
                        {/* Channel Name Field */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                    Channel Name
                                </label>
                                <span className="text-[11px] font-mono text-muted-foreground/80">
                                    {groupName.length}/50
                                </span>
                            </div>
                            <div className="flex items-center gap-2.5 px-3.5 h-11 rounded-xl bg-background border border-input focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                                <Hash className="h-4 w-4 text-muted-foreground shrink-0" />
                                <input
                                    type="text"
                                    maxLength={50}
                                    value={groupName}
                                    onChange={(e) => setGroupName(e.target.value)}
                                    placeholder="core-engineering or design-sync"
                                    className="w-full bg-transparent text-base sm:text-sm font-medium text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
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
                                        className="text-[11px] font-semibold text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
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
                                                    src={member.picture || DEFAULT_AVATAR}
                                                    alt=""
                                                    className="h-4 w-4 rounded-full object-cover"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src = DEFAULT_AVATAR;
                                                    }}
                                                />
                                                <span className="truncate max-w-[110px]">{member.fullName.split(' ')[0]}</span>
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

                        {/* Add Members Section */}
                        <div className="flex flex-col">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                                Add Members
                            </label>

                            {/* Search Bar */}
                            <div className="flex items-center gap-2.5 px-3.5 h-10 rounded-xl bg-background border border-input focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all mb-2">
                                <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search directory by name..."
                                    className="w-full bg-transparent text-base sm:text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery("")}
                                        className="p-1 rounded-full text-muted-foreground hover:text-foreground cursor-pointer"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                )}
                            </div>

                            {/* Member Directory List */}
                            <div className="overflow-y-auto space-y-1 custom-scrollbar max-h-48 sm:max-h-56 rounded-xl border border-border/70 p-1.5 bg-background/50">
                                {isLoading && (
                                    <div className="flex items-center justify-center h-28 text-muted-foreground text-xs">
                                        <Loader2 className="h-4 w-4 animate-spin mr-2 text-primary" />
                                        <span>Loading directory...</span>
                                    </div>
                                )}

                                {!isLoading && availableUsers.length > 0 && (
                                    <>
                                        {availableUsers.map((person: Participant) => {
                                            const isSelected = selectedMembers.some(m => m.id === person._id);
                                            const isOnline = connectedUsers.includes(person._id);

                                            return (
                                                <div
                                                    key={person._id}
                                                    onClick={() => toggleMember(person)}
                                                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                                                        isSelected
                                                            ? "bg-primary/15 text-primary border border-primary/30 font-semibold"
                                                            : "hover:bg-muted/70 text-foreground border border-transparent"
                                                    }`}
                                                >
                                                    <div className="flex items-center space-x-3 min-w-0">
                                                        <div className="relative shrink-0">
                                                            <img
                                                                src={person.picture || DEFAULT_AVATAR}
                                                                alt={person.fullName}
                                                                className="h-8 w-8 rounded-full object-cover ring-1 ring-border/50"
                                                                onError={(e) => {
                                                                    (e.target as HTMLImageElement).src = DEFAULT_AVATAR;
                                                                }}
                                                            />
                                                            {isOnline && (
                                                                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-1 ring-background" />
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="text-xs font-semibold truncate leading-tight">{person.fullName}</span>
                                                            <span className="text-[10px] text-muted-foreground/80 truncate mt-0.5">
                                                                {isOnline ? "Active now" : "Offline"}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                                        isSelected
                                                            ? "bg-primary border-primary text-primary-foreground shadow-xs scale-105"
                                                            : "border-muted-foreground/40 bg-background/50 group-hover:border-primary/50"
                                                    }`}>
                                                        {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {/* Sentinel target for infinite scrolling */}
                                        <div ref={observerTarget} className="h-4 w-full" />

                                        {/* Loading indicator for next page */}
                                        {isFetchingNextPage && (
                                            <div className="flex items-center justify-center py-2 text-muted-foreground">
                                                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                                <span className="text-xs ml-1.5 text-muted-foreground">Loading more people...</span>
                                            </div>
                                        )}

                                        {/* Load more button fallback */}
                                        {hasNextPage && !isFetchingNextPage && (
                                            <div className="text-center py-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => fetchNextPage()}
                                                    className="text-xs text-primary font-medium hover:underline cursor-pointer"
                                                >
                                                    Load more
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )}

                                {!isLoading && availableUsers.length === 0 && (
                                    <div className="flex flex-col items-center justify-center h-28 text-center px-4 text-xs text-muted-foreground">
                                        <UserPlus className="h-5 w-5 mb-1 text-muted-foreground/50" />
                                        <p>
                                            {debouncedSearch
                                                ? `No teammates found matching "${debouncedSearch}"`
                                                : "No teammates available"}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Modal Footer */}
                    <div className="p-3.5 sm:p-5 border-t border-border/80 bg-muted/20 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                        <div className="text-xs text-muted-foreground w-full sm:w-auto text-center sm:text-left">
                            {remainingNeeded > 0 ? (
                                <span className="text-amber-500 font-medium">
                                    Add {remainingNeeded} more {remainingNeeded === 1 ? 'member' : 'members'}
                                </span>
                            ) : (
                                <span className="text-emerald-500 font-semibold flex items-center justify-center sm:justify-start gap-1">
                                    <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                                    <span>{selectedMembers.length} members ready</span>
                                </span>
                            )}
                        </div>

                        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
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
                                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs shadow-md shadow-cyan-500/20 hover:shadow-lg hover:shadow-cyan-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
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

    return typeof document !== "undefined" ? createPortal(modalContent, document.body) : modalContent;
};

export default GroupChatWidget;
