import { useState, useMemo, useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, X, Users, Wifi } from "lucide-react";
import Header from "../Header/Header";
import PeopleItems from "./PeopleItems";
import PeopleItemsLoading from "../UI/PeopleItemsLoading";
import { fetchPeople } from "../../api/auth";
import { AuthContext } from "../../contexts/AuthContext";
import { Participant } from "../../types";

const People = () => {
    const { connectedUsers, user } = useContext(AuthContext);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState<"all" | "online">("all");

    const userId = user?._id;

    const { data, isLoading } = useQuery<Participant[]>({
        queryKey: ['people'],
        queryFn: () => fetchPeople(userId),
        staleTime: 5 * 60 * 1000,
        enabled: !!userId,
    });

    // Compute online and total counts
    const totalCount = data?.length || 0;
    const onlineCount = useMemo(() => {
        if (!data) return 0;
        return data.filter((person: Participant) => connectedUsers.includes(person._id)).length;
    }, [data, connectedUsers]);

    // Filter people by search term and active tab
    const filteredPeople = useMemo(() => {
        if (!data) return [];
        return data.filter((person: Participant) => {
            const matchesSearch = person.fullName.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesTab = activeTab === "all" || connectedUsers.includes(person._id);
            return matchesSearch && matchesTab;
        });
    }, [data, searchTerm, activeTab, connectedUsers]);

    return (
        <div className="flex flex-col mb-16 md:mb-0 w-full md:w-[40%] lg:w-[25%] md:h-[100dvh] border-r border-border/80 bg-card/30 backdrop-blur-md">
            <Header message="People" />

            {/* Search and Filter Section */}
            <div className="px-4 pt-3 pb-2 space-y-3">
                {/* Search Bar */}
                <div className="flex items-center gap-2.5 px-3.5 h-10 rounded-xl bg-background border border-input focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                    <Search className="h-4 w-4 text-muted-foreground shrink-0 pointer-events-none" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search directory..."
                        className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
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
                <div className="flex items-center justify-between gap-1 p-1 rounded-xl bg-muted/60 text-xs font-medium">
                    <button
                        type="button"
                        onClick={() => setActiveTab("all")}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg transition-all cursor-pointer ${
                            activeTab === "all"
                                ? "bg-background text-foreground shadow-xs font-semibold"
                                : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        <Users className="h-3.5 w-3.5" />
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
            <div className="flex-1 overflow-y-auto px-2 py-1 space-y-1 custom-scrollbar" id="people">
                {isLoading && <PeopleItemsLoading />}

                {!isLoading && filteredPeople.length > 0 && (
                    filteredPeople.map((person: Participant) => (
                        <PeopleItems
                            key={person._id}
                            userId={person._id}
                            username={person.fullName}
                            avatarSrc={person.picture}
                            isOnline={connectedUsers.includes(person._id)}
                        />
                    ))
                )}

                {/* Empty State: No results found */}
                {!isLoading && filteredPeople.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-52 text-center px-4">
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-3">
                            {activeTab === "online" ? (
                                <Wifi className="h-5 w-5 opacity-60" />
                            ) : (
                                <Users className="h-5 w-5 opacity-60" />
                            )}
                        </div>
                        <p className="text-sm font-semibold text-foreground">
                            {searchTerm
                                ? "No matching people"
                                : activeTab === "online"
                                ? "No teammates online"
                                : "Directory is empty"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
                            {searchTerm
                                ? `No results found for "${searchTerm}". Try a different name.`
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
