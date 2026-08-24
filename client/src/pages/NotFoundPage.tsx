import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MessageSquare, Compass, ShieldAlert } from 'lucide-react';
import NexusLogo from '../components/UI/NexusLogo';
import ThemeToggle from '../components/UI/ThemeToggle';

const NotFoundPage: React.FC = () => {
    return (
        <div className="relative min-h-[100dvh] w-full bg-background text-foreground flex flex-col justify-between items-center px-4 py-6 sm:py-8 font-sans selection:bg-primary/20 selection:text-primary transition-colors duration-300 overflow-hidden">
            {/* Subtle Dot Grid Background */}
            <div className="absolute inset-0 bg-dot-grid pointer-events-none opacity-50 dark:opacity-30 -z-10" />

            {/* Top Navigation Bar */}
            <div className="w-full max-w-5xl flex items-center justify-between z-10">
                <Link to="/" className="flex items-center space-x-2.5 group">
                    <NexusLogo className="h-8 w-8" size={32} showText={true} />
                </Link>

                <div className="flex items-center space-x-3">
                    <ThemeToggle />
                </div>
            </div>

            {/* Central 404 Hero Container */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="w-full max-w-lg my-auto z-10 text-center px-4"
            >
                {/* Error Pill Badge */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-destructive/30 bg-destructive/10 text-destructive text-xs font-semibold mb-6 shadow-xs">
                    <ShieldAlert className="h-3.5 w-3.5" />
                    <span>Error 404 • Channel Not Found</span>
                </div>

                {/* 404 Headline */}
                <h1 className="text-7xl sm:text-9xl font-black tracking-tighter text-foreground select-none leading-none">
                    404
                </h1>

                <h2 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight mt-4">
                    Channel Not Found
                </h2>
                <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto leading-relaxed">
                    The conversation channel or frequency you are tuning into has vanished or does not exist.
                </p>

                {/* Action Buttons */}
                <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
                    <Link
                        to="/chats"
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-11 px-6 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold shadow-sm transition-all cursor-pointer group"
                    >
                        <MessageSquare className="h-4 w-4" />
                        <span>Go to Conversations</span>
                    </Link>

                    <Link
                        to="/"
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-11 px-6 rounded-2xl bg-muted/80 hover:bg-muted text-foreground text-sm font-semibold border border-input transition-all cursor-pointer"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span>Return to Home</span>
                    </Link>
                </div>
            </motion.div>

            {/* Footer */}
            <div className="w-full max-w-5xl flex items-center justify-center space-x-2 text-xs text-muted-foreground z-10">
                <Compass className="h-3.5 w-3.5 text-primary" />
                <span>Nexus Navigation System • All systems operational</span>
            </div>
        </div>
    );
};

export default NotFoundPage;
