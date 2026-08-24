import React, { useState, useContext, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowRight,
    MessageSquare,
    Video,
    Shield,
    Send,
    CheckCheck,
    Mic,
    MicOff,
    Camera,
    CameraOff,
    PhoneOff,
    Users,
    Sparkles,
    Lock,
    Zap,
    Monitor,
    Image as ImageIcon
} from 'lucide-react';
import { Button } from '@/components/UI/button';
import ThemeToggle from '@/components/UI/ThemeToggle';
import NexusLogo from '@/components/UI/NexusLogo';
import { AuthContext } from '../contexts/AuthContext';

interface DemoMessage {
    id: string;
    sender: 'user' | 'other';
    name: string;
    avatar: string;
    text: string;
    time: string;
    type?: 'text' | 'image';
    imageSrc?: string;
}

export const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const { user, loggedIn } = useContext(AuthContext);

    // Interactive Demo State
    const [activeTab, setActiveTab] = useState<'chat' | 'video' | 'groups'>('chat');
    const [messages, setMessages] = useState<DemoMessage[]>([
        {
            id: '1',
            sender: 'other',
            name: 'Sarah Chen',
            avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
            text: 'Hey! The new 1080p room pipeline is live on staging.',
            time: '10:42 AM'
        },
        {
            id: '2',
            sender: 'user',
            name: 'You',
            avatar: '',
            text: 'Just connected via WebSocket. Latency is clocking at 22ms!',
            time: '10:42 AM'
        },
        {
            id: '3',
            sender: 'other',
            name: 'Sarah Chen',
            avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
            text: 'Crystal clear. Try clicking the prompt chips below to test real-time actions.',
            time: '10:43 AM'
        },
    ]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [ping, setPing] = useState(24);

    const chatScrollContainerRef = useRef<HTMLDivElement>(null);

    // Ensure page loads at the top on initial mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // Live Simulated Ping Jitter
    useEffect(() => {
        const interval = setInterval(() => {
            setPing(Math.floor(18 + Math.random() * 12));
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const handleCta = useCallback(() => {
        if (loggedIn || user) {
            const hasChats = user?.conversations && user.conversations.length > 0;
            navigate(hasChats ? '/chats' : '/people');
        } else {
            navigate('/login');
        }
    }, [loggedIn, user, navigate]);

    // Keyboard shortcut to quick sign in
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.key === 's' || e.key === 'S') && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
                e.preventDefault();
                handleCta();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleCta]);

    const triggerBotResponse = (userQuery: string) => {
        setIsTyping(true);
        setTimeout(() => {
            setIsTyping(false);
            let replyText = "Everything syncs with zero frame drops!";
            const lower = userQuery.toLowerCase();

            if (lower.includes('call') || lower.includes('video')) {
                replyText = "Switch to the '1080p Video Stage' tab above to test WebRTC audio & video controls! 📹";
            } else if (lower.includes('encrypt') || lower.includes('security') || lower.includes('safe')) {
                replyText = "Nexus uses 256-bit AES-GCM session tokens with strict IDOR route gating.";
            } else if (lower.includes('group') || lower.includes('team')) {
                replyText = "Switch to 'Group Channels' tab above to view multi-participant rooms!";
            } else if (lower.includes('speed') || lower.includes('latency') || lower.includes('fast')) {
                replyText = `Current connection ping is ${ping}ms. Zero polling overhead! ⚡`;
            }

            setMessages(prev => [
                ...prev,
                {
                    id: String(Date.now()),
                    sender: 'other',
                    name: 'Sarah Chen',
                    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
                    text: replyText,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }
            ]);
        }, 900);
    };

    const handleSendMessage = (textToSend?: string) => {
        const query = textToSend || inputText;
        if (!query.trim()) return;

        const newMsg: DemoMessage = {
            id: String(Date.now()),
            sender: 'user',
            name: 'You',
            avatar: '',
            text: query.trim(),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages(prev => [...prev, newMsg]);
        setInputText('');
        triggerBotResponse(query.trim());
    };

    // Scroll only the internal chat box container without scrolling the page window
    useEffect(() => {
        if (activeTab === 'chat' && chatScrollContainerRef.current) {
            chatScrollContainerRef.current.scrollTo({
                top: chatScrollContainerRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [messages, isTyping, activeTab]);

    return (
        <div className="min-h-screen bg-background text-foreground font-sans relative selection:bg-primary/20 selection:text-primary transition-colors duration-300 overflow-x-hidden">
            {/* Delicate Dot Matrix Pattern */}
            <div className="absolute inset-0 bg-dot-grid pointer-events-none opacity-60 dark:opacity-40 -z-10" />

            {/* Navigation Header */}
            <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-background/80 border-b border-border transition-colors">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
                        <NexusLogo className="h-8 w-8" showText={true} />
                        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold border border-emerald-500/20">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>{ping}ms Latency</span>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2 sm:space-x-3">
                        <ThemeToggle />
                        <a
                            href="https://github.com/Aryan-Dahiya-23/nexus"
                            target="_blank"
                            rel="noreferrer"
                            className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded-xl hover:bg-muted"
                            aria-label="GitHub"
                        >
                            <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24">
                                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                            </svg>
                        </a>
                        <Button
                            variant="gradient"
                            size="sm"
                            onClick={handleCta}
                            className="font-semibold text-xs sm:text-sm px-4 h-9 shadow-xs cursor-pointer"
                        >
                            {loggedIn || user ? (
                                <>
                                    <span>Open App</span>
                                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                                </>
                            ) : (
                                <>
                                    <span>Sign In</span>
                                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-24 md:pt-24 md:pb-32">
                <div className="text-center max-w-3xl mx-auto">
                    {/* Minimalist Header Pill */}
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-card/80 backdrop-blur-md text-xs font-medium text-muted-foreground mb-6 shadow-xs">
                        <Sparkles className="h-3.5 w-3.5 text-primary" />
                        <span>Instant messaging & 1080p rooms</span>
                    </div>

                    {/* Bold, Elegant Typography */}
                    <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-foreground leading-[1.08]">
                        Communication, <br className="hidden sm:inline" />
                        <span className="bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 dark:from-cyan-400 dark:via-sky-400 dark:to-blue-400 bg-clip-text text-transparent">
                            crafted for clarity.
                        </span>
                    </h1>

                    {/* Subhead */}
                    <p className="mt-6 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
                        Sub-50ms messaging, studio-grade video rooms, and team channels. Clean, passwordless, and built for people who value speed.
                    </p>

                    {/* Primary CTA Buttons */}
                    <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                        <Button
                            variant="gradient"
                            size="lg"
                            onClick={handleCta}
                            className="w-full sm:w-auto text-sm sm:text-base px-8 h-12 shadow-md shadow-primary/20 group cursor-pointer"
                        >
                            <span>{loggedIn || user ? "Go to Conversations" : "Get Started Free"}</span>
                            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                        <a href="#live-sandbox" className="w-full sm:w-auto">
                            <Button
                                variant="outline"
                                size="lg"
                                className="w-full sm:w-auto text-sm sm:text-base h-12 border-border hover:bg-muted/80 cursor-pointer"
                            >
                                <span>Try Interactive Sandbox</span>
                            </Button>
                        </a>
                    </div>

                    {/* Trust Proof Points */}
                    <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground font-medium">
                        <div className="flex items-center gap-1.5">
                            <Zap className="h-3.5 w-3.5 text-cyan-500" />
                            <span>WebSocket Stream</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Video className="h-3.5 w-3.5 text-emerald-500" />
                            <span>1080p WebRTC Rooms</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Lock className="h-3.5 w-3.5 text-blue-500" />
                            <span>Passwordless OAuth 2.0</span>
                        </div>
                    </div>
                </div>

                {/* Interactive Nexus Live Sandbox */}
                <div id="live-sandbox" className="mt-12 sm:mt-16 md:mt-20 scroll-mt-20 sm:scroll-mt-24">
                    <div className="rounded-2xl sm:rounded-3xl border border-border bg-card/90 backdrop-blur-2xl shadow-2xl overflow-hidden">
                        {/* Sandbox Window Top Bar */}
                        <div className="px-3 sm:px-4 py-2.5 sm:py-3 bg-muted/40 border-b border-border flex items-center justify-between gap-2 overflow-x-auto no-scrollbar scrollbar-none">
                            {/* Window Dots & Tabs */}
                            <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
                                <div className="hidden sm:flex items-center space-x-1.5 shrink-0">
                                    <div className="h-3 w-3 rounded-full bg-rose-500/80" />
                                    <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                                    <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
                                </div>

                                <div className="flex items-center space-x-1 bg-background/60 p-0.5 sm:p-1 rounded-xl sm:rounded-2xl border border-border/80 shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('chat')}
                                        className={`flex items-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                                            activeTab === 'chat'
                                                ? 'bg-card text-foreground shadow-xs border border-border'
                                                : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                        <MessageSquare className="h-3.5 w-3.5 text-primary shrink-0" />
                                        <span><span className="hidden sm:inline">Direct </span>Chat</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('video')}
                                        className={`flex items-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                                            activeTab === 'video'
                                                ? 'bg-card text-foreground shadow-xs border border-border'
                                                : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                        <Video className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                        <span><span className="hidden sm:inline">1080p </span>Video<span className="hidden md:inline"> Stage</span></span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('groups')}
                                        className={`flex items-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                                            activeTab === 'groups'
                                                ? 'bg-card text-foreground shadow-xs border border-border'
                                                : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                        <Users className="h-3.5 w-3.5 text-cyan-500 shrink-0" />
                                        <span><span className="hidden sm:inline">Group </span>Channels</span>
                                    </button>
                                </div>
                            </div>

                            {/* Live Connection Telemetry */}
                            <div className="flex items-center space-x-1.5 sm:space-x-2 text-[11px] sm:text-xs font-mono text-muted-foreground shrink-0">
                                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                                <span className="text-foreground font-semibold">{ping}ms</span>
                                <span className="hidden sm:inline">• WebRTC Ready</span>
                            </div>
                        </div>

                        {/* Sandbox Main Viewport */}
                        <div className="p-3 sm:p-6 min-h-[380px] sm:min-h-[420px] flex flex-col justify-between">
                            <AnimatePresence mode="wait">
                                {/* TAB 1: Real-Time Chat Simulator */}
                                {activeTab === 'chat' && (
                                    <motion.div
                                        key="chat-tab"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.2 }}
                                        className="flex flex-col h-[360px] sm:h-[380px] justify-between"
                                    >
                                        {/* Message Stream */}
                                        <div ref={chatScrollContainerRef} className="flex-1 overflow-y-auto space-y-3 pr-1 sm:pr-2 no-scrollbar scrollbar-none">
                                            <div className="flex justify-center my-1">
                                                <span className="px-3 py-0.5 text-[10px] font-semibold text-muted-foreground bg-muted/60 rounded-full border border-border/60">
                                                    Today
                                                </span>
                                            </div>

                                            {messages.map((msg) => {
                                                const isMe = msg.sender === 'user';
                                                return (
                                                    <div
                                                        key={msg.id}
                                                        className={`flex items-end gap-2 sm:gap-2.5 ${isMe ? 'justify-end' : 'justify-start'}`}
                                                    >
                                                        {!isMe && (
                                                            <img
                                                                src={msg.avatar}
                                                                alt={msg.name}
                                                                className="h-6 w-6 sm:h-7 sm:w-7 rounded-full object-cover border border-border shrink-0"
                                                                onError={(e) => {
                                                                    (e.target as HTMLImageElement).src = "https://res.cloudinary.com/dwyx9715k/image/upload/v1723145455/nexus/avatars/default_avatar.png";
                                                                }}
                                                            />
                                                        )}
                                                        <div
                                                            className={`px-3.5 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm rounded-2xl max-w-[88%] sm:max-w-md ${
                                                                isMe
                                                                    ? 'bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 text-white rounded-tr-xs shadow-sm'
                                                                    : 'bg-muted/80 text-foreground border border-border rounded-tl-xs'
                                                            }`}
                                                        >
                                                            <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                                                            <div
                                                                className={`flex items-center justify-end gap-1 mt-1 text-[9px] select-none ${
                                                                    isMe ? 'text-white/80' : 'text-muted-foreground'
                                                                }`}
                                                            >
                                                                <span>{msg.time}</span>
                                                                {isMe && <CheckCheck className="h-3 w-3" />}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                            {/* Typing Indicator */}
                                            {isTyping && (
                                                <div className="flex items-center space-x-2 text-muted-foreground text-xs pl-8 sm:pl-9">
                                                    <span className="flex space-x-1">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                                                        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                                                        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" />
                                                    </span>
                                                    <span className="text-[10px] sm:text-[11px]">Sarah is typing...</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Quick Prompt Action Chips */}
                                        <div className="my-2 flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar scrollbar-none">
                                            <span className="text-[10px] text-muted-foreground font-semibold shrink-0 mr-0.5">Try:</span>
                                            <button
                                                type="button"
                                                onClick={() => handleSendMessage('Is WebRTC video encrypted?')}
                                                className="px-2.5 py-1 rounded-full bg-muted/60 hover:bg-muted text-[11px] text-foreground font-medium border border-border shrink-0 transition-colors cursor-pointer"
                                            >
                                                🔐 Is WebRTC encrypted?
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleSendMessage('How fast is the message stream?')}
                                                className="px-2.5 py-1 rounded-full bg-muted/60 hover:bg-muted text-[11px] text-foreground font-medium border border-border shrink-0 transition-colors cursor-pointer"
                                            >
                                                ⚡ How fast is the stream?
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setActiveTab('video')}
                                                className="px-2.5 py-1 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium border border-emerald-500/20 shrink-0 transition-colors cursor-pointer"
                                            >
                                                📹 Start 1080p Call
                                            </button>
                                        </div>

                                        {/* Interactive Chat Input Dock */}
                                        <form
                                            onSubmit={(e) => {
                                                e.preventDefault();
                                                handleSendMessage();
                                            }}
                                            className="flex items-center gap-1.5 sm:gap-2 bg-background border border-input rounded-xl sm:rounded-2xl p-1 sm:p-1.5 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-ring transition-all"
                                        >
                                            <button
                                                type="button"
                                                onClick={() => handleSendMessage('Sent a photo!')}
                                                className="p-1.5 sm:p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg sm:rounded-xl hover:bg-muted cursor-pointer shrink-0"
                                                title="Attach image"
                                                aria-label="Attach image"
                                            >
                                                <ImageIcon className="h-4 w-4" />
                                            </button>
                                            <input
                                                type="text"
                                                value={inputText}
                                                onChange={(e) => setInputText(e.target.value)}
                                                placeholder="Type a real-time message..."
                                                className="flex-1 bg-transparent text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none px-1"
                                            />
                                            <Button
                                                type="submit"
                                                size="sm"
                                                variant="gradient"
                                                disabled={!inputText.trim()}
                                                className="h-8 sm:h-9 px-3 sm:px-3.5 rounded-lg sm:rounded-xl cursor-pointer shrink-0"
                                            >
                                                <Send className="h-3.5 w-3.5" />
                                            </Button>
                                        </form>
                                    </motion.div>
                                )}

                                {/* TAB 2: 1080p Video Stage Simulator */}
                                {activeTab === 'video' && (
                                    <motion.div
                                        key="video-tab"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.2 }}
                                        className="h-[360px] sm:h-[380px] flex flex-col justify-between"
                                    >
                                        {/* Video Stage Grid */}
                                        <div className="grid grid-cols-2 gap-2 sm:gap-3.5 flex-1 min-h-[220px] sm:min-h-[260px]">
                                            {/* Remote Participant Card */}
                                            <div className="rounded-xl sm:rounded-2xl bg-slate-950 border border-border p-2.5 sm:p-4 flex flex-col justify-between relative overflow-hidden text-white shadow-xl group">
                                                <div className="flex items-center justify-between text-[11px] sm:text-xs z-10">
                                                    <span className="font-semibold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg bg-black/50 backdrop-blur-md truncate max-w-[90px] sm:max-w-none">Sarah Chen</span>
                                                    <span className="text-[9px] sm:text-[10px] text-emerald-400 font-mono flex items-center gap-1 sm:gap-1.5 px-1.5 py-0.5 sm:px-2 rounded-md bg-emerald-500/10 border border-emerald-500/20 shrink-0">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                                        1080p
                                                    </span>
                                                </div>

                                                <div className="my-auto flex flex-col items-center py-2">
                                                    <div className="relative">
                                                        <img
                                                            src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80"
                                                            alt="Sarah"
                                                            className="h-14 w-14 sm:h-20 sm:w-20 rounded-2xl sm:rounded-3xl object-cover border-2 border-emerald-500 shadow-2xl"
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).src = "https://res.cloudinary.com/dwyx9715k/image/upload/v1723145455/nexus/avatars/default_avatar.png";
                                                            }}
                                                        />
                                                        <span className="absolute -bottom-1 -right-1 p-1 rounded-full bg-emerald-500 text-white">
                                                            <Mic className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Live Equalizer Audio Waveform */}
                                                <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-white/70 z-10">
                                                    <div className="flex items-end gap-1 h-3.5 sm:h-4">
                                                        <span className="w-1 bg-emerald-500 rounded-full animate-[pulse_0.6s_ease-in-out_infinite] h-2.5 sm:h-3" />
                                                        <span className="w-1 bg-emerald-500 rounded-full animate-[pulse_0.4s_ease-in-out_infinite] h-3.5 sm:h-4" />
                                                        <span className="w-1 bg-emerald-500 rounded-full animate-[pulse_0.8s_ease-in-out_infinite] h-2" />
                                                        <span className="w-1 bg-emerald-500 rounded-full animate-[pulse_0.5s_ease-in-out_infinite] h-3.5 sm:h-4" />
                                                        <span className="hidden sm:inline text-[10px] ml-1 text-emerald-400 font-medium">Active</span>
                                                    </div>
                                                    <span className="text-[9px] sm:text-[10px] opacity-60">2.4 Mbps</span>
                                                </div>
                                            </div>

                                            {/* Local User Preview Card */}
                                            <div className="rounded-xl sm:rounded-2xl bg-slate-900 border border-border p-2.5 sm:p-4 flex flex-col justify-between relative overflow-hidden text-white shadow-xl">
                                                <div className="flex items-center justify-between text-[11px] sm:text-xs z-10">
                                                    <span className="font-semibold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg bg-black/50 backdrop-blur-md">You</span>
                                                    <span className="text-[9px] sm:text-[10px] text-cyan-400 font-mono">WebRTC</span>
                                                </div>

                                                <div className="my-auto flex flex-col items-center py-2">
                                                    <div className="relative">
                                                        <div className="h-14 w-14 sm:h-20 sm:w-20 rounded-2xl sm:rounded-3xl bg-gradient-to-tr from-cyan-500 via-sky-500 to-blue-600 flex items-center justify-center font-extrabold text-base sm:text-xl shadow-lg">
                                                            YOU
                                                        </div>
                                                        <span className={`absolute -bottom-1 -right-1 p-1 rounded-full ${isMuted ? 'bg-destructive text-white' : 'bg-emerald-500 text-white'}`}>
                                                            {isMuted ? <MicOff className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> : <Mic className="h-2.5 w-2.5 sm:h-3 sm:w-3" />}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-white/70 z-10">
                                                    <span className="truncate max-w-[80px] sm:max-w-none">{isMuted ? 'Muted' : 'Active'}</span>
                                                    <span className="text-[9px] sm:text-[10px] text-emerald-400">0 Drops</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Floating Call HUD Controls */}
                                        <div className="mt-2.5 sm:mt-3.5 flex items-center justify-center gap-2 sm:gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setIsMuted(!isMuted)}
                                                className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border transition-all cursor-pointer ${
                                                    isMuted
                                                        ? 'bg-destructive/20 border-destructive/40 text-destructive'
                                                        : 'bg-muted/80 hover:bg-muted border-border text-foreground'
                                                }`}
                                                title={isMuted ? "Unmute" : "Mute"}
                                                aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
                                            >
                                                {isMuted ? <MicOff className="h-4.5 w-4.5 sm:h-5 sm:w-5" /> : <Mic className="h-4.5 w-4.5 sm:h-5 sm:w-5" />}
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setIsVideoOff(!isVideoOff)}
                                                className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border transition-all cursor-pointer ${
                                                    isVideoOff
                                                        ? 'bg-destructive/20 border-destructive/40 text-destructive'
                                                        : 'bg-muted/80 hover:bg-muted border-border text-foreground'
                                                }`}
                                                title={isVideoOff ? "Turn Camera On" : "Turn Camera Off"}
                                                aria-label={isVideoOff ? "Turn camera on" : "Turn camera off"}
                                            >
                                                {isVideoOff ? <CameraOff className="h-4.5 w-4.5 sm:h-5 sm:w-5" /> : <Camera className="h-4.5 w-4.5 sm:h-5 sm:w-5" />}
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setIsScreenSharing(!isScreenSharing)}
                                                className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border transition-all cursor-pointer ${
                                                    isScreenSharing
                                                        ? 'bg-primary/20 border-primary/40 text-primary'
                                                        : 'bg-muted/80 hover:bg-muted border-border text-foreground'
                                                }`}
                                                title="Share Screen"
                                                aria-label={isScreenSharing ? "Stop sharing screen" : "Share screen"}
                                            >
                                                <Monitor className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setActiveTab('chat')}
                                                className="px-3.5 sm:px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-destructive hover:bg-destructive/90 text-white text-xs font-semibold flex items-center gap-1.5 sm:gap-2 cursor-pointer shadow-md shadow-destructive/20 transition-all"
                                                aria-label="End demo call"
                                            >
                                                <PhoneOff className="h-4 w-4" />
                                                <span><span className="hidden sm:inline">End </span>Call</span>
                                            </button>
                                        </div>
                                    </motion.div>
                                )}

                                {/* TAB 3: Group Channels Simulator */}
                                {activeTab === 'groups' && (
                                    <motion.div
                                        key="groups-tab"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.2 }}
                                        className="h-[360px] sm:h-[380px] flex flex-col justify-between"
                                    >
                                        <div className="space-y-2.5 sm:space-y-3">
                                            <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-muted/40 border border-border flex items-center justify-between hover:border-primary/40 transition-colors">
                                                <div className="flex items-center space-x-2.5 sm:space-x-3.5 min-w-0">
                                                    <div className="h-9 w-9 sm:h-11 sm:w-11 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 border border-border flex items-center justify-center font-extrabold text-primary text-sm sm:text-base shrink-0">
                                                        #
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h4 className="text-xs sm:text-sm font-bold text-foreground truncate">Core Engineering</h4>
                                                        <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 truncate">8 participants • 1080p Video</p>
                                                    </div>
                                                </div>
                                                <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] sm:text-xs font-semibold border border-emerald-500/20 flex items-center gap-1 sm:gap-1.5 shrink-0">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                    Live
                                                </span>
                                            </div>

                                            <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-muted/40 border border-border flex items-center justify-between hover:border-primary/40 transition-colors">
                                                <div className="flex items-center space-x-2.5 sm:space-x-3.5 min-w-0">
                                                    <div className="h-9 w-9 sm:h-11 sm:w-11 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-purple-500/20 to-indigo-500/20 border border-border flex items-center justify-center font-extrabold text-purple-500 text-sm sm:text-base shrink-0">
                                                        🎨
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h4 className="text-xs sm:text-sm font-bold text-foreground truncate">Product & Design</h4>
                                                        <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 truncate">6 members • Rich media sync</p>
                                                    </div>
                                                </div>
                                                <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-muted text-muted-foreground text-[10px] sm:text-xs font-semibold shrink-0">
                                                    Channel
                                                </span>
                                            </div>
                                        </div>

                                        <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-primary/5 border border-primary/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mt-auto">
                                            <div>
                                                <h4 className="text-xs sm:text-sm font-bold text-foreground">Create your own private room</h4>
                                                <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">Instant multi-user groups with zero latency signaling.</p>
                                            </div>
                                            <Button size="sm" variant="gradient" onClick={handleCta} className="w-full sm:w-auto h-9 sm:h-10 px-4 sm:px-5 text-xs font-semibold cursor-pointer shrink-0">
                                                <span>Launch Nexus Now</span>
                                                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* 3 High-Craft Architectural Pillars */}
                <div className="mt-16 sm:mt-24 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 text-left">
                    <div className="p-5 sm:p-7 rounded-2xl sm:rounded-3xl bg-card/60 border border-border hover:border-primary/40 transition-all shadow-xs group">
                        <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl sm:rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mb-4 sm:mb-5 group-hover:scale-105 transition-transform">
                            <Zap className="h-5 w-5" />
                        </div>
                        <h3 className="text-sm sm:text-base font-bold text-foreground">Sub-50ms WebSocket Sync</h3>
                        <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                            Zero polling overhead. Instant message distribution, read receipts, and live typing across all connected clients.
                        </p>
                    </div>

                    <div className="p-5 sm:p-7 rounded-2xl sm:rounded-3xl bg-card/60 border border-border hover:border-primary/40 transition-all shadow-xs group">
                        <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl sm:rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 sm:mb-5 group-hover:scale-105 transition-transform">
                            <Video className="h-5 w-5" />
                        </div>
                        <h3 className="text-sm sm:text-base font-bold text-foreground">1080p WebRTC Rooms</h3>
                        <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                            Hardware-accelerated media pipeline for zero-latency 1-on-1 and group video rooms with active speaker isolation.
                        </p>
                    </div>

                    <div className="p-5 sm:p-7 rounded-2xl sm:rounded-3xl bg-card/60 border border-border hover:border-primary/40 transition-all shadow-xs group">
                        <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl sm:rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4 sm:mb-5 group-hover:scale-105 transition-transform">
                            <Shield className="h-5 w-5" />
                        </div>
                        <h3 className="text-sm sm:text-base font-bold text-foreground">Passwordless OAuth 2.0</h3>
                        <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                            1-click sign-in via Google and Meta. Protected by secure HTTP-only cookies and strict IDOR verification.
                        </p>
                    </div>
                </div>

                {/* Final High-Craft CTA Card */}
                <div className="relative mt-20 sm:mt-28 rounded-3xl border border-border bg-card/90 backdrop-blur-2xl p-8 sm:p-14 text-center overflow-hidden shadow-2xl">
                    {/* Ambient Radial Gradient Glows */}
                    <div className="absolute -top-24 -left-24 w-72 h-72 bg-gradient-to-br from-cyan-500/20 via-sky-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-gradient-to-tl from-blue-600/20 via-indigo-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute inset-0 bg-dot-grid opacity-30 pointer-events-none" />

                    <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center">
                        {/* Nexus Badge */}
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-primary/25 bg-primary/10 text-primary text-xs font-semibold mb-6 shadow-xs">
                            <Sparkles className="h-3.5 w-3.5 text-primary" />
                            <span>Instant Setup • Zero Configuration</span>
                        </div>

                        {/* Heading */}
                        <h2 className="text-3xl sm:text-5xl font-extrabold text-foreground tracking-tight leading-tight">
                            Experience clean communication, <br className="hidden sm:inline" />
                            <span className="bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 dark:from-cyan-400 dark:via-sky-400 dark:to-blue-400 bg-clip-text text-transparent">
                                engineered for speed.
                            </span>
                        </h2>

                        {/* Subhead */}
                        <p className="mt-4 text-sm sm:text-base text-muted-foreground max-w-lg leading-relaxed">
                            No downloads, no passwords to memorize. Jump directly into lightning-fast messaging and studio-grade video rooms.
                        </p>

                        {/* CTA Button */}
                        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
                            <Button
                                variant="gradient"
                                size="lg"
                                onClick={handleCta}
                                className="w-full sm:w-auto h-12 px-9 text-sm sm:text-base font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/35 transition-all cursor-pointer group"
                            >
                                <span>{loggedIn || user ? "Open Your Workspace" : "Get Started with Google or Meta"}</span>
                                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </div>

                        {/* Micro Trust Points */}
                        <div className="mt-8 pt-6 border-t border-border/70 w-full flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                                <Zap className="h-3.5 w-3.5 text-cyan-500" />
                                <span>Sub-50ms WebSocket</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Video className="h-3.5 w-3.5 text-emerald-500" />
                                <span>1080p WebRTC</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Lock className="h-3.5 w-3.5 text-blue-500" />
                                <span>Passwordless OAuth</span>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Clean Minimal Footer */}
            <footer className="border-t border-border py-6 bg-background text-xs text-muted-foreground">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center space-x-2.5">
                        <NexusLogo className="h-5 w-5" size={20} showText={false} />
                        <span className="font-semibold text-foreground">Nexus</span>
                        <span>• Communication without the noise</span>
                    </div>
                    <div className="flex items-center space-x-5">
                        <a href="https://github.com/Aryan-Dahiya-23/nexus" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors">
                            GitHub
                        </a>
                        <span className="text-emerald-500 font-medium flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            All systems operational
                        </span>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
