import React, { useState, useEffect, useCallback, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeft,
    Mail,
    Lock,
    User as UserIcon,
    Camera,
    Eye,
    EyeOff,
    Loader2,
    Check,
    X,
    AlertCircle,
    ShieldCheck,
    Sparkles,
} from "lucide-react";
import { toast } from "react-toastify";
import ThemeToggle from "../UI/ThemeToggle";
import NexusLogo from "../UI/NexusLogo";
import { AuthContext } from "../../contexts/AuthContext";
import { loginWithEmail, registerWithEmail, queryClient } from "../../api/auth";

const Login: React.FC = () => {
    const navigate = useNavigate();
    const { setUser, setLoggedIn } = useContext(AuthContext);

    const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Form inputs
    const [fullName, setFullName] = useState<string>("");
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [avatarUrl, setAvatarUrl] = useState<string>("");
    const [avatarUploading, setAvatarUploading] = useState<boolean>(false);
    const [cloudinaryReady, setCloudinaryReady] = useState<boolean>(false);

    const backendUrl = import.meta.env.VITE_URL || "http://localhost:4000";
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    // Load Cloudinary script dynamically
    useEffect(() => {
        if (!window.cloudinary) {
            const existingScript = document.getElementById("cloudinary-upload-script");
            if (!existingScript) {
                const script = document.createElement("script");
                script.id = "cloudinary-upload-script";
                script.src = "https://upload-widget.cloudinary.com/global/all.js";
                script.async = true;
                script.onload = () => setCloudinaryReady(true);
                document.body.appendChild(script);
            } else {
                existingScript.addEventListener("load", () => setCloudinaryReady(true));
            }
        } else {
            setCloudinaryReady(true);
        }
    }, []);

    // Social Auth Handlers
    const googleAuth = useCallback(() => {
        window.open(`${backendUrl}/auth/google`, "_self");
    }, [backendUrl]);

    const facebookAuth = useCallback(() => {
        window.open(`${backendUrl}/auth/facebook`, "_self");
    }, [backendUrl]);

    // Avatar Upload via Cloudinary
    const handleAvatarUpload = () => {
        if (!cloudName || !uploadPreset) {
            toast.warn("Cloudinary configuration missing. A default avatar will be generated.");
            return;
        }

        if (window.cloudinary) {
            setAvatarUploading(true);
            const widget = window.cloudinary.createUploadWidget(
                {
                    cloudName,
                    uploadPreset,
                    multiple: false,
                    maxFiles: 1,
                    resourceType: "image",
                    clientAllowedFormats: ["png", "jpg", "jpeg", "webp", "gif"],
                    maxFileSize: 10 * 1024 * 1024, // 10MB
                    sources: ["local", "url", "camera"],
                    cropping: true,
                    croppingAspectRatio: 1,
                    croppingShowDimensions: true,
                    theme: "minimal",
                },
                (error, result) => {
                    setAvatarUploading(false);
                    if (!error && result && result.event === "success") {
                        const uploadedUrl = result.info.secure_url || "";
                        setAvatarUrl(uploadedUrl);
                        toast.success("Profile photo uploaded!");
                    }
                }
            );
            widget.open();
        } else {
            toast.info("Upload widget is initializing. Please try again in a moment.");
        }
    };

    // Remove uploaded avatar
    const handleRemoveAvatar = (e: React.MouseEvent) => {
        e.stopPropagation();
        setAvatarUrl("");
    };

    // Submit handler
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);

        // Validation
        if (!email.trim()) {
            setErrorMessage("Please enter your email address.");
            return;
        }

        if (!password) {
            setErrorMessage("Please enter your password.");
            return;
        }

        if (authMode === "signup") {
            if (!fullName.trim()) {
                setErrorMessage("Please enter your full name.");
                return;
            }
            if (password.length < 6) {
                setErrorMessage("Password must be at least 6 characters long.");
                return;
            }
        }

        try {
            setLoading(true);
            if (authMode === "signin") {
                const response = await loginWithEmail({
                    email: email.trim(),
                    password,
                });
                if (response && response.user) {
                    setUser(response.user);
                    setLoggedIn(true);
                    queryClient.setQueryData(["user"], response.user);
                    toast.success("Welcome back!");
                    navigate(response.user.conversations && response.user.conversations.length > 0 ? "/chats" : "/people");
                }
            } else {
                const response = await registerWithEmail({
                    fullName: fullName.trim(),
                    email: email.trim(),
                    password,
                    picture: avatarUrl || undefined,
                });
                if (response && response.user) {
                    setUser(response.user);
                    setLoggedIn(true);
                    queryClient.setQueryData(["user"], response.user);
                    toast.success("Account created successfully!");
                    navigate("/people");
                }
            }
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } }; message?: string };
            const msg = error.response?.data?.message || error.message || "Authentication failed. Please try again.";
            setErrorMessage(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    // Keyboard navigation (Escape to Home)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) return;
            if (e.key === "Escape") {
                e.preventDefault();
                navigate("/");
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [navigate]);

    return (
        <div className="relative min-h-[100dvh] w-full bg-background text-foreground flex flex-col justify-between items-center px-4 py-6 sm:py-8 font-sans selection:bg-primary/20 selection:text-primary transition-colors duration-300 overflow-x-hidden">
            {/* Subtle Dot Grid Background */}
            <div className="absolute inset-0 bg-dot-grid pointer-events-none opacity-50 dark:opacity-30 -z-10" />

            {/* Ambient Background Gradient Orbs */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-gradient-to-tr from-primary/15 via-blue-500/10 to-indigo-500/5 blur-[120px] pointer-events-none -z-10 rounded-full dark:opacity-100 opacity-60" />

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
                className="w-full max-w-md my-auto z-10 py-4"
            >
                <div className="rounded-3xl border border-border bg-card/95 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl text-center">
                    {/* Brand Logo & Header */}
                    <div className="flex flex-col items-center mb-6">
                        <NexusLogo className="h-12 w-12 mb-2.5" size={48} />
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                            {authMode === "signin" ? "Welcome back" : "Create your account"}
                        </h1>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-xs">
                            {authMode === "signin"
                                ? "Sign in to access your chats and video rooms."
                                : "Join Nexus for real-time collaboration."}
                        </p>
                    </div>

                    {/* Mode Toggle Tabs */}
                    <div className="flex p-1 rounded-2xl bg-muted/70 border border-border mb-6">
                        <button
                            type="button"
                            onClick={() => {
                                setAuthMode("signin");
                                setErrorMessage(null);
                            }}
                            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
                                authMode === "signin"
                                    ? "bg-card text-foreground shadow-xs"
                                    : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            Sign In
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setAuthMode("signup");
                                setErrorMessage(null);
                            }}
                            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
                                authMode === "signup"
                                    ? "bg-card text-foreground shadow-xs"
                                    : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            Create Account
                        </button>
                    </div>

                    {/* Error Banner */}
                    <AnimatePresence>
                        {errorMessage && (
                            <motion.div
                                initial={{ opacity: 0, y: -6, height: 0 }}
                                animate={{ opacity: 1, y: 0, height: "auto" }}
                                exit={{ opacity: 0, y: -6, height: 0 }}
                                className="mb-5 p-3 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium flex items-center gap-2 text-left"
                            >
                                <AlertCircle className="h-4 w-4 shrink-0" />
                                <span>{errorMessage}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Auth Form */}
                    <form onSubmit={handleSubmit} className="space-y-4 text-left">
                        {/* Profile Picture Uploader (Signup Mode Only) */}
                        {authMode === "signup" && (
                            <div className="flex flex-col items-center justify-center pb-2">
                                <div
                                    onClick={handleAvatarUpload}
                                    className="relative group cursor-pointer"
                                    title="Click to upload profile photo via Cloudinary"
                                >
                                    <div className="h-20 w-20 rounded-full ring-2 ring-primary/40 ring-offset-2 ring-offset-background overflow-hidden bg-muted/80 flex items-center justify-center transition-all group-hover:ring-primary shadow-sm">
                                        {avatarUrl ? (
                                            <img
                                                src={avatarUrl}
                                                alt="Avatar Preview"
                                                className="h-full w-full object-cover"
                                            />
                                        ) : avatarUploading ? (
                                            <Loader2 className="h-6 w-6 text-primary animate-spin" />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                                                <Camera className="h-6 w-6" />
                                                <span className="text-[9px] font-semibold mt-0.5">Upload</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Upload Badge or Remove Badge */}
                                    {avatarUrl ? (
                                        <button
                                            type="button"
                                            onClick={handleRemoveAvatar}
                                            className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-xs hover:scale-110 transition-transform"
                                            title="Remove photo"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    ) : (
                                        <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
                                            <Camera className="h-3.5 w-3.5" />
                                        </div>
                                    )}
                                </div>
                                <span className="text-[11px] text-muted-foreground mt-2 text-center">
                                    {avatarUrl ? (
                                        <span className="text-emerald-500 font-medium flex items-center gap-1">
                                            <Check className="h-3 w-3" /> Custom photo attached
                                        </span>
                                    ) : (
                                        <span>Optional profile photo (or generated by default)</span>
                                    )}
                                </span>
                            </div>
                        )}

                        {/* Full Name Input (Signup Mode Only) */}
                        {authMode === "signup" && (
                            <div>
                                <label className="block text-xs font-semibold text-foreground mb-1.5 ml-1">
                                    Full Name
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                                        <UserIcon className="h-4 w-4" />
                                    </div>
                                    <input
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        placeholder="Aryan Dahiya"
                                        required
                                        disabled={loading}
                                        className="h-11 w-full pl-10 pr-4 rounded-2xl bg-background border border-input text-sm text-foreground placeholder:text-muted-foreground shadow-xs focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Email Address Input */}
                        <div>
                            <label className="block text-xs font-semibold text-foreground mb-1.5 ml-1">
                                Email Address
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                                    <Mail className="h-4 w-4" />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="aryan@example.com"
                                    required
                                    disabled={loading}
                                    className="h-11 w-full pl-10 pr-4 rounded-2xl bg-background border border-input text-sm text-foreground placeholder:text-muted-foreground shadow-xs focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                                />
                            </div>
                        </div>

                        {/* Password Input */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5 ml-1">
                                <label className="block text-xs font-semibold text-foreground">
                                    Password
                                </label>
                                {authMode === "signup" && (
                                    <span className="text-[10px] text-muted-foreground">Min. 6 characters</span>
                                )}
                            </div>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                                    <Lock className="h-4 w-4" />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder={authMode === "signup" ? "Create a strong password" : "Enter your password"}
                                    required
                                    disabled={loading}
                                    className="h-11 w-full pl-10 pr-11 rounded-2xl bg-background border border-input text-sm text-foreground placeholder:text-muted-foreground shadow-xs focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-2 h-11 rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:opacity-95 active:scale-[0.99] text-white font-semibold text-sm shadow-md shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>{authMode === "signin" ? "Signing In..." : "Creating Account..."}</span>
                                </>
                            ) : (
                                <span>{authMode === "signin" ? "Sign In with Email" : "Create Free Account"}</span>
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="my-6 flex items-center">
                        <div className="flex-1 h-px bg-border" />
                        <span className="px-3 text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                            Or continue with
                        </span>
                        <div className="flex-1 h-px bg-border" />
                    </div>

                    {/* SSO Providers */}
                    <div className="space-y-3">
                        {/* Google Button */}
                        <button
                            type="button"
                            onClick={googleAuth}
                            className="w-full flex items-center justify-center gap-3 h-11 px-4 rounded-2xl bg-background hover:bg-muted text-foreground font-semibold text-sm border border-input hover:border-primary/40 shadow-xs transition-all cursor-pointer group"
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
                            className="w-full flex items-center justify-center gap-3 h-11 px-4 rounded-2xl bg-[#1877F2] hover:bg-[#166fe5] active:bg-[#125ec7] text-white font-semibold text-sm shadow-xs transition-all cursor-pointer group"
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
                        <span>Encrypted sessions • No plaintext passwords</span>
                    </div>
                </div>

                {/* Switch hint below card */}
                <div className="mt-4 text-center">
                    <p className="text-xs text-muted-foreground">
                        {authMode === "signin" ? (
                            <>
                                Don't have an account yet?{" "}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setAuthMode("signup");
                                        setErrorMessage(null);
                                    }}
                                    className="font-semibold text-primary hover:underline cursor-pointer"
                                >
                                    Create one free
                                </button>
                            </>
                        ) : (
                            <>
                                Already have an account?{" "}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setAuthMode("signin");
                                        setErrorMessage(null);
                                    }}
                                    className="font-semibold text-primary hover:underline cursor-pointer"
                                >
                                    Sign in here
                                </button>
                            </>
                        )}
                    </p>
                </div>
            </motion.div>

            {/* Footer */}
            <div className="text-center z-10 pt-2">
                <p className="text-[11px] text-muted-foreground">
                    By continuing, you agree to Nexus terms of service and privacy policy.
                </p>
            </div>
        </div>
    );
};

export default Login;
