import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Shield, Lock, ArrowLeft } from "lucide-react";
import ThemeToggle from "../UI/ThemeToggle";

const Login: React.FC = () => {
    const url = import.meta.env.VITE_URL || 'http://localhost:4000';

    const googleAuth = () => {
        window.open(`${url}/auth/google`, "_self");
    };

    const facebookAuth = () => {
        window.open(`${url}/auth/facebook`, "_self");
    };

    return (
        <div className="relative min-h-[100dvh] w-full bg-slate-950 flex flex-col justify-between items-center px-4 py-8 overflow-hidden font-sans">
            {/* Ambient Animated Gradient Orbs */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-blue-600/20 via-indigo-600/15 to-purple-600/10 blur-[130px] pointer-events-none rounded-full" />
            <div className="absolute bottom-0 right-1/4 w-[400px] h-[300px] bg-cyan-500/10 blur-[120px] pointer-events-none rounded-full" />

            {/* Top Navigation */}
            <div className="w-full max-w-5xl flex items-center justify-between z-10">
                <Link
                    to="/"
                    className="inline-flex items-center space-x-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors p-2 rounded-lg hover:bg-slate-900/60"
                >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back to Home</span>
                </Link>

                <div className="flex items-center space-x-3">
                    <ThemeToggle />
                    <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-900/60 border border-slate-800">
                        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-[11px] text-slate-300 font-medium">Encrypted</span>
                    </div>
                </div>
            </div>

            {/* Main Auth Card */}
            <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="w-full max-w-md my-auto z-10"
            >
                <div className="rounded-3xl border border-slate-800/80 bg-slate-900/75 p-8 shadow-2xl backdrop-blur-2xl text-center relative overflow-hidden">
                    {/* Top Glow Accent Bar */}
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent" />

                    {/* Logo & Header */}
                    <div className="flex flex-col items-center">
                        <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-xl shadow-blue-500/25 mb-4 ring-4 ring-blue-500/10">
                            <Sparkles className="h-8 w-8 text-white" />
                        </div>

                        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                            Welcome to Nexus
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-xs">
                            Select your sign-in provider to access real-time messaging, video rooms, and team channels.
                        </p>
                    </div>

                    {/* SSO Action Buttons */}
                    <div className="mt-8 space-y-3.5">
                        {/* Google Button */}
                        <motion.button
                            whileHover={{ scale: 1.015 }}
                            whileTap={{ scale: 0.985 }}
                            onClick={googleAuth}
                            className="w-full flex items-center justify-center space-x-3.5 h-12 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-sm shadow-md transition-all border border-slate-200 cursor-pointer"
                        >
                            {/* Official Google SVG Icon */}
                            <svg className="h-5 w-5" viewBox="0 0 24 24">
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
                            <span>Continue with Google</span>
                        </motion.button>

                        {/* Facebook / Meta Button */}
                        <motion.button
                            whileHover={{ scale: 1.015 }}
                            whileTap={{ scale: 0.985 }}
                            onClick={facebookAuth}
                            className="w-full flex items-center justify-center space-x-3.5 h-12 px-4 rounded-xl bg-[#1877F2] hover:bg-[#166fe5] text-white font-semibold text-sm shadow-md transition-all cursor-pointer"
                        >
                            {/* Facebook / Meta SVG Icon */}
                            <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                            </svg>
                            <span>Continue with Facebook</span>
                        </motion.button>
                    </div>

                    {/* Divider */}
                    <div className="mt-8 flex items-center">
                        <div className="flex-1 h-px bg-slate-800" />
                        <span className="px-3 text-[11px] uppercase tracking-wider text-slate-400 font-medium">Protected Access</span>
                        <div className="flex-1 h-px bg-slate-800" />
                    </div>

                    {/* Trust Indicators */}
                    <div className="mt-6 grid grid-cols-2 gap-3 text-left">
                        <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/60 flex items-start space-x-2">
                            <Lock className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                            <div>
                                <div className="text-[11px] font-semibold text-slate-300">256-Bit Session</div>
                                <div className="text-[10px] text-slate-400">Encrypted cookies</div>
                            </div>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/60 flex items-start space-x-2">
                            <Shield className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                            <div>
                                <div className="text-[11px] font-semibold text-slate-300">Zero Password</div>
                                <div className="text-[10px] text-slate-400">Direct OAuth token</div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Footer */}
            <div className="text-center z-10">
                <p className="text-xs text-slate-400">
                    By signing in, you agree to Nexus Terms of Service and Privacy Policy.
                </p>
            </div>
        </div>
    );
};

export default Login;
