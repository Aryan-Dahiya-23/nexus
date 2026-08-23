import React, { useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ShieldCheck, Zap, Video, Lock } from "lucide-react";
import ThemeToggle from "../UI/ThemeToggle";
import NexusLogo from "../UI/NexusLogo";

const Login: React.FC = () => {
    const navigate = useNavigate();
    const url = import.meta.env.VITE_URL || 'http://localhost:4000';

    const googleAuth = useCallback(() => {
        window.open(`${url}/auth/google`, "_self");
    }, [url]);

    const facebookAuth = useCallback(() => {
        window.open(`${url}/auth/facebook`, "_self");
    }, [url]);

    // Keyboard Shortcut: Esc for Home
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

            if (e.key === 'Escape') {
                e.preventDefault();
                navigate('/');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [navigate]);

    return (
        <div className="relative min-h-[100dvh] w-full bg-background text-foreground flex flex-col justify-between items-center px-4 py-6 sm:py-8 font-sans selection:bg-primary/20 selection:text-primary transition-colors duration-300 overflow-x-hidden">
            {/* Subtle Dot Grid Background */}
            <div className="absolute inset-0 bg-dot-grid pointer-events-none opacity-50 dark:opacity-30 -z-10" />

            {/* Top Navigation Bar */}
            <div className="w-full max-w-4xl flex items-center justify-between z-10">
                <Link
                    to="/"
                    className="inline-flex items-center space-x-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors p-2 rounded-xl hover:bg-muted"
                >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back to Home</span>
                </Link>

                <div className="flex items-center space-x-2 sm:space-x-3">
                    <ThemeToggle />
                    <a
                        href="https://github.com/Aryan-Dahiya-23/nexus"
                        target="_blank"
                        rel="noreferrer"
                        className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded-xl hover:bg-muted"
                        aria-label="GitHub Repository"
                    >
                        <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24">
                            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                        </svg>
                    </a>
                </div>
            </div>

            {/* Central Auth Container */}
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-md my-auto z-10"
            >
                <div className="rounded-3xl border border-border bg-card/90 backdrop-blur-2xl p-7 sm:p-9 shadow-2xl text-center">
                    {/* Brand Logo & Header */}
                    <div className="flex flex-col items-center mb-6">
                        <NexusLogo className="h-14 w-14 mb-3" size={56} />
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                            Sign in to Nexus
                        </h1>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 max-w-xs">
                            Direct, passwordless access to your conversations.
                        </p>
                    </div>

                    {/* SSO Providers */}
                    <div className="space-y-3 mt-6">
                        {/* Google Button */}
                        <button
                            type="button"
                            onClick={googleAuth}
                            className="w-full flex items-center justify-center gap-3 h-12 px-4 rounded-2xl bg-background hover:bg-muted text-foreground font-semibold text-sm border border-input hover:border-primary/40 shadow-xs transition-all cursor-pointer group"
                        >
                            <svg
                                className="w-5 h-5 shrink-0"
                                viewBox="0 0 24 24"
                                style={{ width: 20, height: 20, minWidth: 20, minHeight: 20 }}
                            >
                                <path
                                    fill="#4285F4"
                                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                                />
                                <path
                                    fill="#34A853"
                                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.26 21.36 7.33 24 12 24z"
                                />
                                <path
                                    fill="#FBBC05"
                                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.99 0 12c0 2.01.46 3.84 1.26 5.42l4.02-3.15z"
                                />
                                <path
                                    fill="#EA4335"
                                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                                />
                            </svg>
                            <span className="whitespace-nowrap">Continue with Google</span>
                        </button>

                        {/* Facebook / Meta Button */}
                        <button
                            type="button"
                            onClick={facebookAuth}
                            className="w-full flex items-center justify-center gap-3 h-12 px-4 rounded-2xl bg-[#1877F2] hover:bg-[#166fe5] active:bg-[#125ec7] text-white font-semibold text-sm shadow-sm transition-all cursor-pointer group"
                        >
                            <svg
                                className="w-5 h-5 fill-current shrink-0"
                                viewBox="0 0 24 24"
                                style={{ width: 20, height: 20, minWidth: 20, minHeight: 20 }}
                            >
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                            </svg>
                            <span className="whitespace-nowrap">Continue with Facebook</span>
                        </button>
                    </div>

                    {/* Trust Footnote */}
                    <div className="mt-6 pt-5 border-t border-border/80 flex items-center justify-center space-x-2 text-xs text-muted-foreground">
                        <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                        <span>OAuth 2.0 • Encrypted HTTP-only cookies</span>
                    </div>
                </div>

                {/* Feature Highlights Pill Row */}
                <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                        <Zap className="h-3.5 w-3.5 text-cyan-500" />
                        <span>WebSocket Sync</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Video className="h-3.5 w-3.5 text-emerald-500" />
                        <span>1080p Rooms</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Lock className="h-3.5 w-3.5 text-blue-500" />
                        <span>Passwordless</span>
                    </div>
                </div>
            </motion.div>

            {/* Footer */}
            <div className="text-center z-10">
                <p className="text-[11px] text-muted-foreground">
                    By signing in, you agree to Nexus terms of service and privacy policy.
                </p>
            </div>
        </div>
    );
};

export default Login;
