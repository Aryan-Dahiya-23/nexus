import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Zap,
    Video,
    Shield,
    Image as ImageIcon,
    Users,
    Sparkles,
    ArrowRight,
    CheckCircle2,
    MessageSquare,
    Activity,
    Lock
} from 'lucide-react';
import { Button } from '@/components/UI/button';
import { Badge } from '@/components/UI/badge';
import ThemeToggle from '@/components/UI/ThemeToggle';
import { AuthContext } from '../contexts/AuthContext';

export const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const { user, loggedIn } = useContext(AuthContext);

    const handleCta = () => {
        if (loggedIn || user) {
            const hasChats = user?.conversations && user.conversations.length > 0;
            navigate(hasChats ? '/chats' : '/people');
        } else {
            navigate('/login');
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-blue-600 selection:text-white overflow-x-hidden font-sans relative transition-colors duration-300">
            {/* Ambient Background Aura */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-tr from-cyan-500/20 via-sky-500/15 to-blue-500/10 blur-[130px] pointer-events-none -z-10 rounded-full dark:opacity-100 opacity-60" />
            <div className="absolute top-[800px] right-0 w-[600px] h-[400px] bg-cyan-400/10 blur-[120px] pointer-events-none -z-10 rounded-full dark:opacity-100 opacity-60" />

            {/* Navigation Header */}
            <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-background/80 border-b border-border transition-all">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
                        <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-cyan-400 via-sky-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25">
                            <Sparkles className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xl font-bold bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground bg-clip-text text-transparent tracking-tight">
                            Nexus
                        </span>
                        <Badge variant="online" className="hidden sm:inline-flex text-[11px] py-0 px-2">
                            v2.0 Live
                        </Badge>
                    </div>

                    <div className="flex items-center space-x-2 sm:space-x-3">
                        <ThemeToggle />
                        <a
                            href="https://github.com/Aryan-Dahiya-23/nexus"
                            target="_blank"
                            rel="noreferrer"
                            className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded-lg hover:bg-accent"
                            aria-label="GitHub Repository"
                        >
                            <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                            </svg>
                        </a>
                        <Button
                            variant={loggedIn || user ? "gradient" : "outline"}
                            size="sm"
                            onClick={handleCta}
                            className="font-medium"
                        >
                            {loggedIn || user ? (
                                <>
                                    <span>Open Web App</span>
                                    <ArrowRight className="ml-1.5 h-4 w-4" />
                                </>
                            ) : (
                                "Sign In"
                            )}
                        </Button>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col items-center"
                >
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-xs font-medium mb-6 backdrop-blur-md">
                        <Zap className="h-3.5 w-3.5" />
                        <span>Sub-50ms Real-Time WebSocket Engine</span>
                    </div>

                    <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight max-w-4xl text-foreground leading-[1.1]">
                        Real-Time Collaboration <br />
                        <span className="bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 dark:from-cyan-400 dark:via-sky-400 dark:to-blue-400 bg-clip-text text-transparent">
                            Without the Clutter.
                        </span>
                    </h1>

                    <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl font-normal leading-relaxed">
                        Instant messaging, 1080p crystal-clear video calls, rich media sharing, and group collaboration. Ultra-fast, secure, and beautiful by design.
                    </p>

                    <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
                        <Button
                            variant="gradient"
                            size="lg"
                            onClick={handleCta}
                            className="w-full sm:w-auto text-base px-8 h-12 shadow-lg shadow-blue-500/25 group"
                        >
                            <span>{loggedIn || user ? "Go to My Chats" : "Get Started Free"}</span>
                            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                        <a
                            href="#features"
                            className="w-full sm:w-auto"
                        >
                            <Button variant="outline" size="lg" className="w-full sm:w-auto text-base h-12">
                                Explore Features
                            </Button>
                        </a>
                    </div>

                    {/* Trust Highlights */}
                    <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            <span>No Password Needed</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Lock className="h-4 w-4 text-emerald-500" />
                            <span>256-Bit Encrypted Sessions</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Activity className="h-4 w-4 text-emerald-500" />
                            <span>Zero Latency WebRTC</span>
                        </div>
                    </div>
                </motion.div>

                {/* Interactive Live UI Simulator Mockup */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.2 }}
                    className="mt-14 max-w-5xl mx-auto relative rounded-2xl p-1 bg-gradient-to-b from-border/80 via-border/40 to-transparent shadow-2xl backdrop-blur-2xl"
                >
                    <div className="rounded-xl bg-card border border-border overflow-hidden shadow-2xl text-left">
                        {/* Mock Window Header */}
                        <div className="px-4 py-3 bg-muted/50 border-b border-border flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <div className="h-3 w-3 rounded-full bg-rose-500/80" />
                                <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                                <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
                                <span className="ml-2 text-xs font-medium text-muted-foreground">Nexus Live Preview</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Badge variant="online" className="text-[10px] px-2 py-0">Connected</Badge>
                            </div>
                        </div>

                        {/* Mock App Body */}
                        <div className="grid grid-cols-1 md:grid-cols-3 h-[380px]">
                            {/* Mock Sidebar */}
                            <div className="hidden md:flex flex-col border-r border-border bg-muted/20 p-3 space-y-2">
                                <div className="text-xs font-semibold text-muted-foreground px-2 py-1">Recent Conversations</div>
                                <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 flex items-center space-x-3 cursor-pointer">
                                    <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-500 flex items-center justify-center font-bold text-white text-xs">
                                        AD
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-semibold text-foreground">Aryan Dahiya</span>
                                            <span className="text-[10px] text-muted-foreground">Just now</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground truncate">The new video room HUD is live!</p>
                                    </div>
                                </div>
                                <div className="p-2.5 rounded-xl hover:bg-muted/40 transition-colors flex items-center space-x-3 cursor-pointer opacity-70">
                                    <div className="h-9 w-9 rounded-full bg-purple-500/30 flex items-center justify-center font-bold text-purple-400 text-xs">
                                        NX
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-semibold text-foreground">Nexus Engineering</span>
                                            <span className="text-[10px] text-muted-foreground">2m</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground truncate">PR #22 merged to main.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Mock Chat View */}
                            <div className="col-span-2 flex flex-col justify-between p-4 bg-background/50 relative">
                                <div className="space-y-3 overflow-hidden">
                                    <div className="flex items-end space-x-2">
                                        <div className="h-7 w-7 rounded-full bg-cyan-600/40 flex items-center justify-center text-[10px] font-bold">AD</div>
                                        <div className="p-3 rounded-2xl rounded-tl-sm bg-muted/80 border border-border text-xs max-w-sm text-foreground shadow-sm">
                                            Hey! Welcome to the new Nexus 2.0 interface. Try starting a call!
                                        </div>
                                    </div>

                                    <div className="flex items-end justify-end space-x-2">
                                        <div className="p-3 rounded-2xl rounded-tr-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-xs max-w-sm text-white shadow-md">
                                            Everything is so responsive! The 60fps animations feel amazing.
                                        </div>
                                    </div>

                                    {/* Mock Video Call Overlay Card */}
                                    <div className="p-3 rounded-xl bg-card border border-indigo-500/30 flex items-center justify-between max-w-md mx-auto shadow-lg">
                                        <div className="flex items-center space-x-3">
                                            <div className="h-8 w-8 rounded-lg bg-emerald-500/20 text-emerald-500 flex items-center justify-center animate-pulse">
                                                <Video className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <div className="text-xs font-semibold text-foreground">1080p HD Video Call Active</div>
                                                <div className="text-[10px] text-muted-foreground">Duration: 12:45 • Encrypted</div>
                                            </div>
                                        </div>
                                        <Button size="sm" variant="gradient" className="h-7 text-[11px] px-3">Join Room</Button>
                                    </div>
                                </div>

                                {/* Mock Input */}
                                <div className="mt-3 p-2 rounded-full bg-muted/60 border border-border flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground pl-3">Type a message...</span>
                                    <Button size="sm" variant="gradient" className="h-8 w-8 rounded-full p-0">
                                        <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* Bento-Box Features Section */}
            <section id="features" className="py-20 bg-muted/30 border-t border-border relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <Badge variant="unread" className="mb-3">Engineered for Performance</Badge>
                        <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
                            Everything You Need for Effortless Communication
                        </h2>
                        <p className="mt-4 text-muted-foreground text-base sm:text-lg">
                            Built with a modern reactive architecture, delivering instant delivery, rich media handling, and crystal-clear video streams.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Feature 1 */}
                        <div className="p-6 rounded-2xl bg-card border border-border hover:border-primary/40 transition-all hover:shadow-xl group">
                            <div className="h-12 w-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                                <Zap className="h-6 w-6" />
                            </div>
                            <h3 className="text-lg font-bold text-foreground">Sub-50ms Real-Time Messaging</h3>
                            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                                Single-transport WebSocket architecture ensures all messages, typing indicators, and read receipts sync across devices instantly.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="p-6 rounded-2xl bg-card border border-border hover:border-primary/40 transition-all hover:shadow-xl group">
                            <div className="h-12 w-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                                <Video className="h-6 w-6" />
                            </div>
                            <h3 className="text-lg font-bold text-foreground">1080p Crystal Clear Video</h3>
                            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                                Powered by ZEGOCLOUD WebRTC for zero-latency 1-on-1 and group video rooms with dynamic active speaker highlighting.
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="p-6 rounded-2xl bg-card border border-border hover:border-primary/40 transition-all hover:shadow-xl group">
                            <div className="h-12 w-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-500 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                                <Shield className="h-6 w-6" />
                            </div>
                            <h3 className="text-lg font-bold text-foreground">Zero-Friction SSO & Security</h3>
                            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                                1-click authentication with Google and Meta. Protected by HTTP-only session cookies, IDOR defenses, and strict CSRF validation.
                            </p>
                        </div>

                        {/* Feature 4 */}
                        <div className="p-6 rounded-2xl bg-card border border-border hover:border-primary/40 transition-all hover:shadow-xl group">
                            <div className="h-12 w-12 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-500 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                                <ImageIcon className="h-6 w-6" />
                            </div>
                            <h3 className="text-lg font-bold text-foreground">Rich Media & Lightbox Gallery</h3>
                            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                                High-speed Cloudinary CDN media delivery with interactive fullscreen zoom lightbox modal and smooth thumbnail caching.
                            </p>
                        </div>

                        {/* Feature 5 */}
                        <div className="p-6 rounded-2xl bg-card border border-border hover:border-primary/40 transition-all hover:shadow-xl group">
                            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                                <Users className="h-6 w-6" />
                            </div>
                            <h3 className="text-lg font-bold text-foreground">Group Collaboration</h3>
                            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                                Create instant group channels with searchable member multi-select chips and centralized chat detail drawers.
                            </p>
                        </div>

                        {/* Feature 6 */}
                        <div className="p-6 rounded-2xl bg-card border border-border hover:border-primary/40 transition-all hover:shadow-xl group">
                            <div className="h-12 w-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                                <MessageSquare className="h-6 w-6" />
                            </div>
                            <h3 className="text-lg font-bold text-foreground">Reverse Infinite Pagination</h3>
                            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                                Seamless upward scrolling with height-delta viewport anchoring. Experience zero jumping across thousands of messages.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Bottom CTA Banner */}
            <section className="py-20 relative overflow-hidden">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="rounded-3xl bg-gradient-to-r from-primary/10 via-indigo-500/10 to-cyan-500/10 border border-border p-8 sm:p-12 text-center backdrop-blur-xl relative shadow-2xl">
                        <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
                            Experience Modern Real-Time Chat Today.
                        </h2>
                        <p className="mt-4 text-muted-foreground max-w-xl mx-auto text-base">
                            Join thousands of users communicating with zero latency and complete privacy.
                        </p>
                        <div className="mt-8 flex justify-center">
                            <Button
                                variant="gradient"
                                size="lg"
                                onClick={handleCta}
                                className="h-12 px-8 text-base shadow-lg shadow-blue-500/30"
                            >
                                <span>{loggedIn || user ? "Open Web App" : "Sign In with Google or Meta"}</span>
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-border py-8 bg-background text-xs text-muted-foreground">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center space-x-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <span className="font-semibold text-foreground">Nexus Communication Platform</span>
                        <span>• Built for Speed & Simplicity</span>
                    </div>
                    <div className="flex items-center space-x-6">
                        <a href="https://github.com/Aryan-Dahiya-23/nexus" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors">
                            GitHub
                        </a>
                        <span className="text-emerald-500 flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                            All Systems Operational
                        </span>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
