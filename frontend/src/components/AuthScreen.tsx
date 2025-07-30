import { lazy, Suspense, useState, useEffect, memo } from "react";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { motion } from "motion/react";
import mailAnimation from "../assets/lottie/send-email.json";

// Lazy load Lottie
const Lottie = lazy(() => import("lottie-react"));

const animationFadeUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
};

const animationFadeUpDelayed = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { delay: 0.4, duration: 0.5 },
};

function AuthScreen({ onLogin }: { onLogin: (apiKey: string) => void }) {
    const [key, setKey] = useState("");
    const [showKey, setShowKey] = useState(false);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
            document.documentElement.classList.toggle("dark", prefersDark);
        }
    }, []);

    const handleLogin = () => {
        if (key.trim().length >= 6) onLogin(key);
    };

    return (
        <div className="flex min-h-screen bg-white dark:bg-zinc-900 text-zinc-800 dark:text-white transition-all">
            {/* Left Lottie Animation */}
            <div className="hidden md:flex w-1/2 items-center justify-center p-10">
                <Suspense fallback={<div className="text-zinc-500">Loading animation...</div>}>
                    <Lottie animationData={mailAnimation} className="w-full max-w-xl" loop autoplay />
                </Suspense>
            </div>

            {/* Right Panel */}
            <div className="w-full md:w-1/2 flex flex-col justify-center px-12 py-20 space-y-10">
                {/* Taglines */}
                <motion.div {...animationFadeUp} className="space-y-4 text-left">
                    <h1 className="text-3xl font-bold leading-tight">
                        <span className="block text-green-600 dark:text-green-400">Spreadsheet-driven.</span>
                        <span className="block text-blue-600 dark:text-blue-400">Concurrency-backed.</span>
                        <span className="block text-purple-600 dark:text-purple-400">Inbox-bound.</span>
                    </h1>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Deliver hundreds in parallel. No scripts. No stress.
                    </p>
                    <p className="text-xs italic text-zinc-400 dark:text-zinc-500">
                        Designed for scale. Built for humans. Ready when you are.
                    </p>
                </motion.div>

                {/* Auth Input */}
                <motion.div {...animationFadeUpDelayed} className="space-y-3">
                    <div className="flex items-center space-x-3">
                        <div className="relative flex items-center border border-zinc-300 dark:border-zinc-700 rounded-md px-3 py-1.5 bg-white dark:bg-zinc-800 w-full">
                            <KeyRound className="w-4 h-4 text-zinc-400 mr-2" />
                            <input
                                type={showKey ? "text" : "password"}
                                aria-label="Authorization key"
                                className="bg-transparent outline-none w-full text-sm placeholder:text-zinc-400 pr-8"
                                placeholder="Authorization key"
                                value={key}
                                onChange={(e) => setKey(e.target.value)}
                            />
                            <button
                                onClick={() => setShowKey((prev) => !prev)}
                                type="button"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                                aria-label="Toggle visibility"
                            >
                <span key={showKey ? "eye-off" : "eye"}>
                  {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </span>
                            </button>
                        </div>

                        {/* Authorize */}
                        <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={handleLogin}
                            className="px-4 py-1.5 text-sm font-medium rounded-md bg-green-600 text-white hover:bg-green-700 transition whitespace-nowrap"
                        >
                            Authorize
                        </motion.button>
                    </div>

                    <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                        Don’t have the key?{" "}
                        <span
                            className="text-blue-500 hover:underline cursor-pointer"
                            role="button"
                            tabIndex={0}
                            onClick={() => alert("Redirect to key request flow")}
                        >
              Get your authorization key
            </span>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

export default memo(AuthScreen);
