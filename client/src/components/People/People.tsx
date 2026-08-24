import { useState, useMemo, useContext, useEffect, useRef } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Search, X, Users, Wifi, Loader2 } from "lucide-react";
import Header from "../Header/Header";
import PeopleItems from "./PeopleItems";
import PeopleItemsLoading from "../UI/PeopleItemsLoading";
import { fetchPeople } from "../../api/auth";
import { AuthContext } from "../../contexts/AuthContext";
import { Participant } from "../../types";
import { useDebounce } from "../../hooks/useDebounce";

const People = () => {
    const { connectedUsers, user } = useContext(AuthContext);
    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearch = useDebounce(searchTerm, 300);
    const [activeTab, setActiveTab] = useState<"all" | "online">("all");

    const userId = user?._id;

    const {
        data,
        isLoading,
        isFetchingNextPage,
        hasNextPage,
        fetchNextPage,
    } = useInfiniteQuery({
        queryKey: ['people', activeTab, debouncedSearch],
        queryFn: ({ pageParam = 1 }) =>
            fetchPeople(userId, {
                page: pageParam as number,
                limit: 20,
                search: debouncedSearch.trim() || undefined,
                tab: activeTab === 'online' ? 'online' : 'all',
            }),
        initialPageParam: 1,
        getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.currentPage + 1 : undefined),
        enabled: !!userId,
    });

    const users = useMemo(() => {
        return data?.pages.flatMap((page) => page.users) ?? [];
    }, [data]);

    const observerTarget = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
                    fetchNextPage();
                }
            },
            { threshold: 0.1 }
        );

        const currentTarget = observerTarget.current;
        if (currentTarget) {
            observer.observe(currentTarget);
        }

        return () => {
            if (currentTarget) {
                observer.unobserve(currentTarget);
            }
        };
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    // Compute counts for tabs
    const totalCount = data?.pages[0]?.totalUsers ?? users.length;
    const onlineCount = useMemo(() => {
        if (activeTab === "online") {
            return data?.pages[0]?.totalUsers ?? users.length;
        }
        return connectedUsers.filter((id) => id !== userId).length;
    }, [data, activeTab, users.length, connectedUsers, userId]);

    return (
        <div className="flex flex-col h-[calc(100dvh-4rem-env(safe-area-inset-bottom,0px))] md:h-[100dvh] w-full md:w-[350px] lg:w-[380px] xl:w-[410px] shrink-0 border-r border-border/80 bg-background/95 md:bg-card/40 backdrop-blur-xl overflow-hidden transition-all">
            <Header message="People" />

            {/* Search and Filter Section */}
            <div className="px-3.5 pt-3 pb-2 space-y-2.5 shrink-0 border-b border-border/40">
                {/* Search Bar */}
                <div className="flex items-center gap-2 px-3.5 h-10 rounded-2xl bg-muted/50 dark:bg-muted/30 border border-input/60 focus-within:border-primary/50 focus-within:bg-background focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                    <Search className="h-4 w-4 text-muted-foreground shrink-0 pointer-events-none" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search directory..."
                        className="w-full bg-transparent text-base md:text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
                    />
                    {searchTerm && (
                        <button
                            type="button"
                            onClick={() => setSearchTerm("")}
                            className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer shrink-0"
                            aria-label="Clear search"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>

                {/* Filter Tabs & Counts */}
                <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/60 dark:bg-muted/40 text-xs font-medium">
                    <button
                        type="button"
                        onClick={() => setActiveTab("all")}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg transition-all cursor-pointer ${
                            activeTab === "all"
                                ? "bg-background text-foreground shadow-xs font-semibold"
                                : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        <Users className="h-3 w-3" />
                        <span>All</span>
                        <span className="text-[10px] font-mono opacity-70">({totalCount})</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab("online")}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg transition-all cursor-pointer ${
                            activeTab === "online"
                                ? "bg-background text-foreground shadow-xs font-semibold"
                                : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                        </span>
                        <span>Online</span>
                        <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                            ({onlineCount})
                        </span>
                    </button>
                </div>
            </div>

            {/* People List Stream */}
            <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1 custom-scrollbar" id="people">
                {isLoading && <PeopleItemsLoading />}

                {!isLoading && users.length > 0 && (
                    <>
                        {users.map((person: Participant) => (
                            <PeopleItems
                                key={person._id}
                                userId={person._id}
                                username={person.fullName}
                                avatarSrc={person.picture}
                                isOnline={connectedUsers.includes(person._id)}
                            />
                        ))}

                        {/* Sentinel target for infinite scrolling */}
                        <div ref={observerTarget} className="h-4 w-full" />

                        {/* Loading indicator for next page */}
                        {isFetchingNextPage && (
                            <div className="flex items-center justify-center py-3 text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                <span className="text-xs ml-2 text-muted-foreground">Loading more people...</span>
                            </div>
                        )}

                        {/* End of list indicator */}
                        {!hasNextPage && (
                            <div className="py-4 text-center text-xs text-muted-foreground/60">
                                You've reached the end of the directory
                            </div>
                        )}
                    </>
                )}

                {/* Empty State: No results found */}
                {!isLoading && users.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-52 text-center px-4">
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-3">
                            {activeTab === "online" ? (
                                <Wifi className="h-5 w-5 opacity-60" />
                            ) : (
                                <Users className="h-5 w-5 opacity-60" />
                            )}
                        </div>
                        <p className="text-sm font-semibold text-foreground">
                            {debouncedSearch
                                ? "No matching people"
                                : activeTab === "online"
                                ? "No teammates online"
                                : "Directory is empty"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
                            {debouncedSearch
                                ? `No results found for "${debouncedSearch}". Try a different name.`
                                : activeTab === "online"
                                ? "Check back later or invite your team to join Nexus."
                                : "When new teammates sign up, they will appear here."}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default People;

