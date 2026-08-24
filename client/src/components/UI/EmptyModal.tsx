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
            {/* Ambient Background Gradient Mesh */}
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-gradient-to-tr from-cyan-500/15 via-primary/10 to-indigo-500/10 blur-[120px] pointer-events-none rounded-full" />
            <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-cyan-500/5 blur-[90px] pointer-events-none rounded-full" />

            <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="max-w-xl flex flex-col items-center z-10 w-full"
            >
                {/* Holographic Logo Badge */}
                <div className="relative mb-5 group">
                    <div className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-primary/30 to-cyan-500/30 blur-md opacity-60 group-hover:opacity-100 transition-opacity" />
                    <div className="relative p-4 rounded-3xl bg-card/80 border border-border/80 shadow-lg backdrop-blur-md">
                        <NexusLogo className="h-14 w-14 transition-transform group-hover:scale-105 duration-300" />
                    </div>
                </div>

                {/* Main Heading */}
                <h2 className="text-2xl lg:text-3xl font-black text-foreground tracking-tight">
                    Nexus Conversations
                </h2>

                <p className="text-xs sm:text-sm text-muted-foreground mt-2 max-w-md leading-relaxed">
                    Select a conversation from the sidebar or choose a quick action below to start collaborating with your team in real time.
                </p>

                {/* Quick Action Interactive Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-7 w-full max-w-md text-left">
                    <button
                        type="button"
                        onClick={() => navigate('/people')}
                        className="group flex flex-col p-4 rounded-2xl bg-card/70 hover:bg-card border border-border/70 hover:border-primary/40 hover:shadow-md transition-all text-left cursor-pointer active:scale-[0.98]"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <div className="p-2 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                <Users className="h-4 w-4" />
                            </div>
                            <span className="text-[10px] font-semibold text-primary/80 bg-primary/10 px-2 py-0.5 rounded-full">
                                Direct
                            </span>
                        </div>
                        <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                            Find People
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            Browse directory and start a 1-on-1 private chat.
                        </p>
                    </button>

                    <button
                        type="button"
                        onClick={() => setGroupChatWidget(true)}
                        className="group flex flex-col p-4 rounded-2xl bg-card/70 hover:bg-card border border-border/70 hover:border-cyan-500/40 hover:shadow-md transition-all text-left cursor-pointer active:scale-[0.98]"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500 group-hover:bg-cyan-500 group-hover:text-cyan-50 transition-colors">
                                <UserPlus className="h-4 w-4" />
                            </div>
                            <span className="text-[10px] font-semibold text-cyan-500/80 bg-cyan-500/10 px-2 py-0.5 rounded-full">
                                Channel
                            </span>
                        </div>
                        <h4 className="text-sm font-bold text-foreground group-hover:text-cyan-500 transition-colors">
                            New Group
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            Create a group discussion channel with members.
                        </p>
                    </button>
                </div>

                {/* Feature highlights pills */}
                <div className="flex flex-wrap items-center justify-center gap-2 mt-8 pt-6 border-t border-border/50 text-[11px] text-muted-foreground font-medium">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted/60 border border-border/50">
                        <Lock className="h-3 w-3 text-emerald-500" />
                        Encrypted Chats
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted/60 border border-border/50">
                        <Zap className="h-3 w-3 text-amber-500" />
                        Live Presence
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted/60 border border-border/50">
                        <Video className="h-3 w-3 text-cyan-500" />
                        1080p HD Video
                    </span>
                </div>
            </motion.div>
        </div>
    );
};

export default EmptyModal;
