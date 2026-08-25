import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Server, ArrowLeft, RefreshCw, Sparkles, Shield } from 'lucide-react';
import NexusLogo from './NexusLogo';
import { pingServerHealth } from '../../api/auth';

interface ServerWarmupProps {
    onServerReady?: () => void;
    autoPoll?: boolean;
}

const ServerWarmup: React.FC<ServerWarmupProps> = ({ onServerReady, autoPoll = true }) => {
    const navigate = useNavigate();
    const [secondsElapsed, setSecondsElapsed] = useState<number>(0);
    const [isRetrying, setIsRetrying] = useState<boolean>(false);

    // Track elapsed seconds
    useEffect(() => {
        const timer = setInterval(() => {
            setSecondsElapsed((prev) => prev + 1);
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Automated background polling every 2.5s
    useEffect(() => {
        if (!autoPoll) return;
        let isMounted = true;

        const checkHealth = async () => {
            const isAlive = await pingServerHealth();
            if (isAlive && isMounted) {
                if (onServerReady) {
                    onServerReady();
                }
            }
        };

        // Initial check after short delay
        const initialTimer = setTimeout(checkHealth, 1500);
        const pollInterval = setInterval(checkHealth, 3000);

        return () => {
            isMounted = false;
            clearTimeout(initialTimer);
            clearInterval(pollInterval);
        };
    }, [autoPoll, onServerReady]);

    const handleManualRetry = async () => {
        setIsRetrying(true);
        try {
            const isAlive = await pingServerHealth();
            if (isAlive && onServerReady) {
                onServerReady();
            }
        } finally {
            setTimeout(() => setIsRetrying(false), 800);
        }
    };

    // Calculate approximate progress percentage based on typical 45s Render cold-start
    const progressPercent = Math.min(95, Math.round((secondsElapsed / 40) * 100));

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-xl p-4 sm:p-6 text-center select-none overflow-hidden">
            {/* Ambient Background Gradient Orbs */}
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-gradient-to-tr from-primary/15 via-sky-500/10 to-indigo-500/5 blur-[120px] pointer-events-none -z-10 rounded-full dark:opacity-90 opacity-60" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="max-w-md w-full bg-card border border-border/80 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col items-center"
            >
                {/* Header Badge */}
                <div className="relative mb-5 flex items-center justify-center">
                    <div className="absolute h-18 w-18 rounded-3xl bg-primary/20 animate-ping opacity-75" />
                    <div className="relative p-4 rounded-3xl bg-card border border-primary/30 shadow-lg ring-1 ring-primary/20">
                        <NexusLogo className="h-12 w-12" size={48} />
                    </div>
                </div>

                {/* Subtitle tag */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-bold uppercase tracking-wider mb-2 border border-primary/20 shadow-2xs">
                    <Sparkles className="h-3 w-3" />
                    <span>Cloud Server Starting</span>
                </div>

                {/* Heading */}
                <h3 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                    Waking Up Server...
                </h3>

                {/* Description */}
                <p className="text-xs sm:text-sm text-muted-foreground mt-2 leading-relaxed">
                    The cloud server is starting up. This typically takes a few moments on initial connection. You will be connected automatically once ready.
                </p>

                {/* Progress Bar & Counter */}
                <div className="w-full mt-6 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                            <Server className="h-3 w-3 text-primary animate-pulse" />
                            <span>Establishing handshake...</span>
                        </span>
                        <span className="font-mono">{secondsElapsed}s elapsed</span>
                    </div>

                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden p-0.5 border border-border/60">
                        <motion.div
                            className="h-full bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 rounded-full"
                            style={{ width: `${progressPercent}%` }}
                            transition={{ ease: 'linear' }}
                        />
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2.5 mt-7 w-full pt-4 border-t border-border/60">
                    <button
                        type="button"
                        onClick={() => navigate('/')}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold border border-border transition-all cursor-pointer active:scale-95"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        <span>Browse Home</span>
                    </button>

                    <button
                        type="button"
                        onClick={handleManualRetry}
                        disabled={isRetrying}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold shadow-xs transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                    >
                        <RefreshCw className={`h-3.5 w-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
                        <span>{isRetrying ? 'Checking...' : 'Check Status'}</span>
                    </button>
                </div>

                {/* Security footer */}
                <div className="mt-5 flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground font-medium">
                    <Shield className="h-3 w-3 text-emerald-500" />
                    <span>Zero data loss • Auto-reconnecting</span>
                </div>
            </motion.div>
        </div>
    );
};

export default ServerWarmup;
