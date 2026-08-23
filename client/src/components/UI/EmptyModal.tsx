import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users } from 'lucide-react';
import { Button } from './button';
import NexusLogo from './NexusLogo';

const EmptyModal: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="hidden md:flex flex-col justify-center items-center flex-1 h-[100vh] border-l border-border bg-background/40 backdrop-blur-md p-8 text-center relative overflow-hidden transition-colors">
            {/* Ambient subtle glow orb */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[300px] bg-cyan-500/10 blur-[100px] pointer-events-none rounded-full" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="max-w-md flex flex-col items-center z-10"
            >
                <div className="mb-6">
                    <NexusLogo className="h-20 w-20" />
                </div>

                <h2 className="text-2xl lg:text-3xl font-extrabold text-foreground tracking-tight">
                    Select a Conversation
                </h2>

                <p className="text-sm text-muted-foreground mt-3 max-w-sm leading-relaxed">
                    Choose an existing chat from the sidebar or discover teammates in the People directory to start a real-time message or video call.
                </p>

                <div className="mt-8 flex items-center gap-3">
                    <Button
                        variant="gradient"
                        size="default"
                        onClick={() => navigate('/people')}
                        className="shadow-md shadow-cyan-500/20"
                    >
                        <Users className="mr-2 h-4 w-4" />
                        <span>Explore People</span>
                    </Button>
                </div>
            </motion.div>
        </div>
    );
};

export default EmptyModal;
