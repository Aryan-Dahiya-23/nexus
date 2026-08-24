import React, { useState, useEffect, useCallback, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeft,
    Mail,
    Lock,
    User as UserIcon,
    Eye,
    EyeOff,
    Loader2,
    AlertCircle,
    ShieldCheck,
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
    const [isSlowAuth, setIsSlowAuth] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Track if authentication request is taking longer than 2.5s (cold-start)
    useEffect(() => {
        if (loading) {
            const timer = setTimeout(() => {
                setIsSlowAuth(true);
            }, 2500);
            return () => clearTimeout(timer);
        } else {
            setIsSlowAuth(false);
        }
    }, [loading]);

    // Form inputs
    const [fullName, setFullName] = useState<string>("");
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");

    // Field-level error and touched tracking
    const [errors, setErrors] = useState<{ fullName?: string; email?: string; password?: string }>({});
    const [touched, setTouched] = useState<{ fullName?: boolean; email?: boolean; password?: boolean }>({});

    const backendUrl = import.meta.env.VITE_URL || "http://localhost:4000";

    // Social Auth Handlers
    const googleAuth = useCallback(() => {
        window.open(`${backendUrl}/auth/google`, "_self");
    }, [backendUrl]);

    const validateField = (field: "fullName" | "email" | "password", value: string, mode: "signin" | "signup" = authMode) => {
        let error = "";
        if (field === "fullName" && mode === "signup") {
            if (!value.trim()) {
                error = "Full name is required";
            } else if (value.trim().length < 2) {
                error = "Full name must be at least 2 characters";
            }
        }
        if (field === "email") {
            if (!value.trim()) {
                error = "Email address is required";
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
                error = "Please enter a valid email address";
            }
        }
        if (field === "password") {
            if (!value) {
                error = "Password is required";
            } else if (mode === "signup" && value.length < 6) {
                error = "Password must be at least 6 characters";
            }
        }
        return error;
    };

    const validateAll = () => {
        const newErrors: { fullName?: string; email?: string; password?: string } = {};
        if (authMode === "signup") {
            const fnErr = validateField("fullName", fullName, "signup");
            if (fnErr) newErrors.fullName = fnErr;
        }
        const emailErr = validateField("email", email, authMode);
        if (emailErr) newErrors.email = emailErr;

        const passErr = validateField("password", password, authMode);
        if (passErr) newErrors.password = passErr;

        setErrors(newErrors);
        setTouched({ fullName: true, email: true, password: true });
        return Object.keys(newErrors).length === 0;
    };

    const handleBlur = (field: "fullName" | "email" | "password") => {
        setTouched((prev) => ({ ...prev, [field]: true }));
        const val = field === "fullName" ? fullName : field === "email" ? email : password;
        const err = validateField(field, val);
        setErrors((prev) => ({ ...prev, [field]: err || undefined }));
    };

    const handleChange = (field: "fullName" | "email" | "password", val: string) => {
        if (field === "fullName") setFullName(val);
        if (field === "email") setEmail(val);
        if (field === "password") setPassword(val);

        if (touched[field]) {
            const err = validateField(field, val);
            setErrors((prev) => ({ ...prev, [field]: err || undefined }));
        }
    };

    const switchAuthMode = (mode: "signin" | "signup") => {
        setAuthMode(mode);
        setErrorMessage(null);
        setErrors({});
        setTouched({});
    };

    // Submit handler
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);

        // Perform custom field validation
        const isValid = validateAll();
        if (!isValid) return;

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
                    navigate("/chats");
                }
            } else {
                const response = await registerWithEmail({
                    fullName: fullName.trim(),
                    email: email.trim(),
                    password,
                });
                if (response && response.user) {
                    setUser(response.user);
                    setLoggedIn(true);
                    queryClient.setQueryData(["user"], response.user);
                    toast.success("Account created successfully!");
                    navigate("/chats");
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
                            onClick={() => switchAuthMode("signin")}
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
                            onClick={() => switchAuthMode("signup")}
                            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
                                authMode === "signup"
                                    ? "bg-card text-foreground shadow-xs"
                                    : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            Create Account
                        </button>
                    </div>

                    {/* Server Error Banner */}
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

                    {/* Cold-start notification banner */}
                    <AnimatePresence>
                        {isSlowAuth && (
                            <motion.div
                                initial={{ opacity: 0, y: -6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -6 }}
                                className="p-3 rounded-2xl bg-primary/10 border border-primary/20 text-primary text-xs font-medium flex items-center gap-2 mb-3 shadow-2xs text-left"
                            >
                                <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                                <span>Cloud backend is booting up from sleep mode (Render Free Tier ~30-40s). Please hold on...</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Auth Form (noValidate disables browser native error bubbles) */}
                    <form noValidate onSubmit={handleSubmit} className="space-y-4 text-left">
                        {/* Full Name Input (Signup Mode Only) */}
                        {authMode === "signup" && (
                            <div>
                                <label htmlFor="fullName" className="block text-xs font-semibold text-foreground mb-1.5 ml-1">
                                    Full Name
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                                        <UserIcon className={`h-4 w-4 ${errors.fullName ? "text-destructive" : ""}`} />
                                    </div>
                                    <input
                                        id="fullName"
                                        name="name"
                                        type="text"
                                        autoComplete="name"
                                        value={fullName}
                                        onChange={(e) => handleChange("fullName", e.target.value)}
                                        onBlur={() => handleBlur("fullName")}
                                        placeholder="Aryan Dahiya"
                                        disabled={loading}
                                        className={`h-11 w-full pl-10 pr-4 rounded-2xl bg-background border text-sm text-foreground placeholder:text-muted-foreground shadow-xs focus:outline-none transition-all ${
                                            errors.fullName
                                                ? "border-destructive focus:ring-2 focus:ring-destructive/30 focus:border-destructive"
                                                : "border-input focus:ring-2 focus:ring-primary/30 focus:border-primary"
                                        }`}
                                    />
                                </div>
                                <AnimatePresence>
                                    {errors.fullName && (
                                        <motion.p
                                            initial={{ opacity: 0, y: -4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -4 }}
                                            className="text-[11px] font-medium text-destructive mt-1.5 ml-1 flex items-center gap-1"
                                        >
                                            <AlertCircle className="h-3 w-3 shrink-0" />
                                            <span>{errors.fullName}</span>
                                        </motion.p>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}

                        {/* Email Address Input */}
                        <div>
                            <label htmlFor="email" className="block text-xs font-semibold text-foreground mb-1.5 ml-1">
                                Email Address
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                                    <Mail className={`h-4 w-4 ${errors.email ? "text-destructive" : ""}`} />
                                </div>
                                <input
                                    id="email"
                                    name="username"
                                    type="email"
                                    autoComplete="username email"
                                    value={email}
                                    onChange={(e) => handleChange("email", e.target.value)}
                                    onBlur={() => handleBlur("email")}
                                    placeholder="aryan@example.com"
                                    disabled={loading}
                                    className={`h-11 w-full pl-10 pr-4 rounded-2xl bg-background border text-sm text-foreground placeholder:text-muted-foreground shadow-xs focus:outline-none transition-all ${
                                        errors.email
                                            ? "border-destructive focus:ring-2 focus:ring-destructive/30 focus:border-destructive"
                                            : "border-input focus:ring-2 focus:ring-primary/30 focus:border-primary"
                                    }`}
                                />
                            </div>
                            <AnimatePresence>
                                {errors.email && (
                                    <motion.p
                                        initial={{ opacity: 0, y: -4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -4 }}
                                        className="text-[11px] font-medium text-destructive mt-1.5 ml-1 flex items-center gap-1"
                                    >
                                        <AlertCircle className="h-3 w-3 shrink-0" />
                                        <span>{errors.email}</span>
                                    </motion.p>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Password Input */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5 ml-1">
                                <label htmlFor="password" className="block text-xs font-semibold text-foreground">
                                    Password
                                </label>
                                {authMode === "signup" && (
                                    <span className="text-[10px] text-muted-foreground">Min. 6 characters</span>
                                )}
                            </div>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                                    <Lock className={`h-4 w-4 ${errors.password ? "text-destructive" : ""}`} />
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    autoComplete={authMode === "signup" ? "new-password" : "current-password"}
                                    value={password}
                                    onChange={(e) => handleChange("password", e.target.value)}
                                    onBlur={() => handleBlur("password")}
                                    placeholder={authMode === "signup" ? "Create a strong password" : "Enter your password"}
                                    disabled={loading}
                                    className={`h-11 w-full pl-10 pr-11 rounded-2xl bg-background border text-sm text-foreground placeholder:text-muted-foreground shadow-xs focus:outline-none transition-all ${
                                        errors.password
                                            ? "border-destructive focus:ring-2 focus:ring-destructive/30 focus:border-destructive"
                                            : "border-input focus:ring-2 focus:ring-primary/30 focus:border-primary"
                                    }`}
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
                            <AnimatePresence>
                                {errors.password && (
                                    <motion.p
                                        initial={{ opacity: 0, y: -4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -4 }}
                                        className="text-[11px] font-medium text-destructive mt-1.5 ml-1 flex items-center gap-1"
                                    >
                                        <AlertCircle className="h-3 w-3 shrink-0" />
                                        <span>{errors.password}</span>
                                    </motion.p>
                                )}
                            </AnimatePresence>
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
                                    <span>
                                        {isSlowAuth
                                            ? "Connecting to Cloud Server..."
                                            : authMode === "signin"
                                            ? "Signing In..."
                                            : "Creating Account..."}
                                    </span>
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

                    {/* Google SSO Button */}
                    <div>
                        <button
                            type="button"
                            onClick={googleAuth}
                            className="w-full flex items-center justify-center gap-3 h-11 px-4 rounded-2xl bg-background hover:bg-muted/80 text-foreground font-semibold text-sm border border-input hover:border-primary/40 shadow-xs hover:shadow-sm active:scale-[0.99] transition-all cursor-pointer group"
                        >
                            <svg
                                className="w-5 h-5 shrink-0 transition-transform group-hover:scale-105"
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
