import {useEffect, useState} from "react";
import {AnimatePresence, motion} from "motion/react";
import {Sun, Moon, ChevronLeft, ChevronRight} from "lucide-react";
import {slides} from "../utils/slide.ts";

export default function Onboarding({onDone}: { onDone: () => void }) {
    const [index, setIndex] = useState(0);
    const [dark, setDark] = useState(true);
    const isLast = index === slides.length - 1;
    const current: { title: string, desc: string } = slides[index];

    useEffect(() => {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        setDark(prefersDark);
        document.documentElement.classList.toggle("dark", prefersDark);
    }, []);

    const toggleDark = () => {
        const newDark = !dark;
        setDark(newDark);
        document.documentElement.classList.toggle("dark", newDark);
    };

    const finish = () => {
        localStorage.setItem("onboardingComplete", "true");
        onDone();
    };

    return (
        <div className={`w-screen h-screen ${dark ? "dark" : ""}`}>
            <div
                className="relative flex flex-col items-center justify-between h-full px-6 py-10 bg-zinc-100 dark:bg-zinc-900 transition-colors">

                {/* 🌙 Top-right: Theme toggle */}
                <div className="absolute top-4 right-4">
                    <button
                        onClick={toggleDark}
                        className="p-2 rounded-full border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200"
                        aria-label="Toggle Theme"
                    >
                        {dark ? <Sun size={18}/> : <Moon size={18}/>}
                    </button>
                </div>

                {/* Slide content */}
                <div className="max-w-xl text-center mt-10 flex-1 flex items-center justify-center">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={index}
                            initial={{opacity: 0, x: 40}}
                            animate={{opacity: 1, x: 0}}
                            exit={{opacity: 0, x: -40}}
                            transition={{duration: 0.3}}
                            className="w-full"
                        >
                            <h1 className="text-2xl md:text-3xl font-semibold mb-3 text-zinc-800 dark:text-white">
                                {current.title}
                            </h1>
                            <p className="text-base text-zinc-600 dark:text-zinc-400">{current.desc}</p>
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Progress bar */}
                <div className="w-full max-w-sm mb-4">
                    <div className="h-1 w-full bg-zinc-300 dark:bg-zinc-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-green-500 transition-all duration-300"
                            style={{width: `${((index + 1) / slides.length) * 100}%`}}
                        />
                    </div>
                </div>

                <div className="w-full flex justify-between items-center max-w-sm mb-2">
                    {/* Arrows centered */}
                    <div className="flex items-center gap-4 mx-auto">
                        <button
                            onClick={() => setIndex((i) => Math.max(i - 1, 0))}
                            disabled={index === 0}
                            className="p-2 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 disabled:opacity-30"
                        >
                            <ChevronLeft size={20}/>
                        </button>

                        {!isLast ? (
                            <button
                                onClick={() => setIndex((i) => Math.min(i + 1, slides.length - 1))}
                                className="p-2 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200"
                            >
                                <ChevronRight size={20}/>
                            </button>
                        ) : (
                            <button
                                onClick={finish}
                                className="px-6 py-2 text-sm bg-green-600 text-white rounded-full hover:bg-green-700 transition"
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
