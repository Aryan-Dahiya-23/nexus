import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, UserPlus, Video, Lock, Zap } from 'lucide-react';
import { ThemeContext } from '../../contexts/ThemeContext';
import NexusLogo from './NexusLogo';

const EmptyModal: React.FC = () => {
    const navigate = useNavigate();
    const { setGroupChatWidget } = useContext(ThemeContext);

    return (
        <div className="hidden md:flex flex-col justify-center items-center flex-1 h-[100dvh] bg-background/50 backdrop-blur-xl p-8 text-center relative overflow-hidden transition-colors select-none">
            <motion.div
                initial={{ opacity: 0, scale: 0.98, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="max-w-xl flex flex-col items-center z-10 w-full"
            >
                {/* Clean Logo Badge */}
                <div className="mb-5">
                    <div className="p-3.5 rounded-2xl bg-card border border-border shadow-sm">
                        <NexusLogo className="h-12 w-12" />
                    </div>
                </div>

                {/* Main Heading */}
                <h2 className="text-2xl font-bold text-foreground tracking-tight">
                    Nexus Conversations
                </h2>

                <p className="text-xs sm:text-sm text-muted-foreground mt-2 max-w-md leading-relaxed">
                    Select a conversation from the sidebar or choose a quick action below to start messaging with your team.
                </p>

                {/* Quick Action Interactive Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-7 w-full max-w-md text-left">
                    <button
                        type="button"
                        onClick={() => navigate('/people')}
                        className="group flex flex-col p-4 rounded-2xl bg-card hover:bg-muted/50 border border-border hover:border-primary/40 hover:shadow-sm transition-all text-left cursor-pointer active:scale-[0.98]"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <div className="p-2 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                <Users className="h-4 w-4" />
                            </div>
                            <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                Direct
                            </span>
                        </div>
                        <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                            Find People
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            Browse directory and start a 1-on-1 private chat.
                        </p>
                    </button>

                    <button
                        type="button"
                        onClick={() => setGroupChatWidget(true)}
                        className="group flex flex-col p-4 rounded-2xl bg-card hover:bg-muted/50 border border-border hover:border-primary/40 hover:shadow-sm transition-all text-left cursor-pointer active:scale-[0.98]"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <div className="p-2 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                <UserPlus className="h-4 w-4" />
                            </div>
                            <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                Channel
                            </span>
                        </div>
                        <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                            New Group
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            Create a group discussion channel with members.
                        </p>
                    </button>
                </div>

                {/* Feature highlights pills */}
                <div className="flex flex-wrap items-center justify-center gap-2 mt-8 pt-6 border-t border-border/50 text-[11px] text-muted-foreground font-medium">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-card border border-border text-foreground/80">
                        <Lock className="h-3 w-3 text-emerald-500" />
                        Encrypted
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-card border border-border text-foreground/80">
                        <Zap className="h-3 w-3 text-amber-500" />
                        Live Presence
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-card border border-border text-foreground/80">
                        <Video className="h-3 w-3 text-primary" />
                        1080p Video
                    </span>
                </div>
            </motion.div>
        </div>
    );
};

export default EmptyModal;
