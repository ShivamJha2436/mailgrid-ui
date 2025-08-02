import { lazy, Suspense, useEffect, useState, memo } from "react";
import { Sun, Moon, ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { slides } from "../utils/slide.ts";

// Lazy-load Lottie component
const Lottie = lazy(() => import("lottie-react"));

const fadeUp = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -30 },
    transition: { duration: 0.5 },
};

function Onboarding({ onDone }: { onDone: () => void }) {
    const [index, setIndex] = useState(0);
    const [dark, setDark] = useState(true);
    const current = slides[index];
    const isLast = index === slides.length - 1;

    useEffect(() => {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        setDark(prefersDark);
        document.documentElement.classList.toggle("dark", prefersDark);
    }, []);

    const toggleDark = () => {
        const next = !dark;
        setDark(next);
        document.documentElement.classList.toggle("dark", next);
    };

    const finish = () => {
        localStorage.setItem("onboardingComplete", "true");
        onDone();
    };

    return (
        <div className={`flex min-h-screen bg-white dark:bg-zinc-900 text-zinc-800 dark:text-white transition-all ${dark ? "dark" : ""}`}>

            {/* 📽️ Left Animation */}
            <div className="hidden md:flex w-1/2 items-center justify-center p-10">
                <Suspense fallback={<div className="text-zinc-500">Loading animation...</div>}>
                    {current.animation && (
                        <Lottie
                            animationData={current.animation}
                            className="w-full max-w-xl"
                            loop
                            autoplay
                        />
                    )}
                </Suspense>
            </div>

            {/* 📝 Right Content */}
            <div className="w-full md:w-1/2 flex flex-col justify-center px-10 py-16 space-y-8 relative">

                {/* 🌗 Theme Toggle */}
                <div className="absolute top-4 right-4">
                    <button
                        onClick={toggleDark}
                        className="p-2 rounded-full border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200"
                        aria-label="Toggle Theme"
                    >
                        {dark ? <Sun size={18} /> : <Moon size={18} />}
                    </button>
                </div>

                {/* 🧠 Slide Text */}
                <AnimatePresence mode="wait">
                    <motion.div key={index} {...fadeUp} className="space-y-4">
                        <h1 className="text-3xl font-bold leading-tight text-zinc-800 dark:text-white">
                            {current.title}
                        </h1>
                        <p className="text-base text-zinc-600 dark:text-zinc-400">
                            {current.desc}
                        </p>
                    </motion.div>
                </AnimatePresence>

                {/* 🧭 Controls & Progress - Centered */}
                <div className="flex flex-col items-center mt-8 space-y-4">
                    {/* Progress Bar */}
                    <div className="w-full max-w-sm">
                        <div className="h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-green-500 transition-all duration-300"
                                style={{ width: `${((index + 1) / slides.length) * 100}%` }}
                            />
                        </div>
                    </div>

                    {/* Chevron / Finish */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIndex((i) => Math.max(i - 1, 0))}
                            disabled={index === 0}
                            className="p-2 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 disabled:opacity-30"
                            aria-label="Previous"
                        >
                            <ChevronLeft size={20} />
                        </button>

                        {!isLast ? (
                            <button
                                onClick={() => setIndex((i) => Math.min(i + 1, slides.length - 1))}
                                className="p-2 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200"
                                aria-label="Next"
                            >
                                <ChevronRight size={20} />
                            </button>
                        ) : (
                            <button
                                onClick={finish}
                                className="px-6 py-2 text-sm font-medium bg-green-600 text-white rounded-full hover:bg-green-700 transition"
                            >
                                Looks great — Let's go! 🎉
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default memo(Onboarding);
