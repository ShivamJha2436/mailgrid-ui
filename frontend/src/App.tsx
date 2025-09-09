import {useState, useEffect} from "react";
import Onboarding from "./components/OnBoarding.tsx";
import AuthScreen from "./components/AuthScreen.tsx";
import DashboardFinal from "./components/DashboardFinal.tsx";
import { ThemeProvider } from "./context/theme";

export default function App() {
    const [onboarded, setOnboarded] = useState(false);
    const [authed, setAuthed] = useState(false);

    // Optional: Skip onboarding if user has already completed it
    useEffect(() => {
        const done: boolean = localStorage.getItem("onboardingComplete") === "true";
        setOnboarded(done);
        const hasKey = !!localStorage.getItem("apiKey");
        setAuthed(hasKey);
    }, []);

    if (!onboarded) {
        return <Onboarding onDone={() => { localStorage.setItem("onboardingComplete", "true"); setOnboarded(true); }}/>
    }

    if (!authed) {
        return <AuthScreen onLogin={(token) => { localStorage.setItem("apiKey", token); setAuthed(true); }}/>
    }

    return (
        <ThemeProvider>
            <DashboardFinal />
        </ThemeProvider>
    );
}
