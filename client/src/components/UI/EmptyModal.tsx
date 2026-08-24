import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, UserPlus, Video, Lock, Zap } from 'lucide-react';
import { AuthContext } from '../../contexts/AuthContext';
import { ThemeContext } from '../../contexts/ThemeContext';
import NexusLogo from './NexusLogo';

const EmptyModal: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const { setGroupChatWidget } = useContext(ThemeContext);

    const hasConversations = Boolean(user?.conversations && user.conversations.length > 0);

    return (
        <div className="hidden md:flex flex-col justify-center items-center flex-1 h-[100dvh] bg-background/50 backdrop-blur-xl p-8 text-center relative overflow-hidden transition-colors select-none">
            {/* Ambient Background Gradient Orbs */}
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-gradient-to-tr from-primary/10 via-sky-500/5 to-indigo-500/5 blur-[100px] pointer-events-none -z-10 rounded-full dark:opacity-80 opacity-50" />

            <motion.div
                initial={{ opacity: 0, scale: 0.98, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="max-w-lg flex flex-col items-center z-10 w-full"
            >
                {/* Clean Logo Badge */}
                <div className="mb-5">
                    <div className="p-4 rounded-3xl bg-card border border-border shadow-md ring-1 ring-border/50">
                        <NexusLogo className="h-12 w-12" size={48} />
                    </div>
                </div>

                {/* Main Heading */}
                <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                    {hasConversations ? "Nexus Conversations" : "Welcome to Nexus"}
                </h2>

                <p className="text-xs sm:text-sm text-muted-foreground mt-2 max-w-sm leading-relaxed">
                    {hasConversations
                        ? "Select a conversation from the sidebar or choose a quick action below to start messaging."
                        : "Connect with teammates from the directory or create a group channel to get started."}
                </p>

                {/* Quick Action Interactive Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-8 w-full max-w-md text-left">
                    <button
                        type="button"
                        onClick={() => navigate('/people')}
                        className="group flex flex-col p-4 rounded-2xl bg-card/90 hover:bg-card border border-border hover:border-primary/50 hover:shadow-md transition-all text-left cursor-pointer active:scale-[0.98]"
                    >
                        <div className="flex items-center justify-between mb-2.5">
                            <div className="p-2.5 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all shadow-2xs">
                                <Users className="h-4 w-4" />
                            </div>
                            <span className="text-[10px] font-semibold text-muted-foreground bg-muted/80 px-2 py-0.5 rounded-full border border-border/60">
                                Direct
                            </span>
                        </div>
                        <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                            Find People
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1 leading-normal line-clamp-2">
                            Browse the people directory and start a 1-on-1 private chat.
                        </p>
                    </button>

                    <button
                        type="button"
                        onClick={() => setGroupChatWidget(true)}
                        className="group flex flex-col p-4 rounded-2xl bg-card/90 hover:bg-card border border-border hover:border-primary/50 hover:shadow-md transition-all text-left cursor-pointer active:scale-[0.98]"
                    >
                        <div className="flex items-center justify-between mb-2.5">
                            <div className="p-2.5 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all shadow-2xs">
                                <UserPlus className="h-4 w-4" />
                            </div>
                            <span className="text-[10px] font-semibold text-muted-foreground bg-muted/80 px-2 py-0.5 rounded-full border border-border/60">
                                Channel
                            </span>
                        </div>
                        <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                            New Group
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1 leading-normal line-clamp-2">
                            Create a collaborative team channel for group messaging.
                        </p>
                    </button>
                </div>

                {/* Feature highlights pills */}
                <div className="flex flex-wrap items-center justify-center gap-2 mt-8 pt-6 border-t border-border/50 text-[11px] text-muted-foreground font-medium">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-card/80 border border-border text-foreground/80 shadow-2xs">
                        <Lock className="h-3 w-3 text-emerald-500" />
                        End-to-End Encrypted
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-card/80 border border-border text-foreground/80 shadow-2xs">
                        <Zap className="h-3 w-3 text-amber-500" />
                        Live Presence
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-card/80 border border-border text-foreground/80 shadow-2xs">
                        <Video className="h-3 w-3 text-primary" />
                        1080p HD Video
                    </span>
                </div>
            </motion.div>
        </div>
    );
};

export default EmptyModal;
