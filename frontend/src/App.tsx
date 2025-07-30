import {useState, useEffect} from "react";
import Onboarding from "./components/OnBoarding.tsx";
import AuthScreen from "./components/AuthScreen.tsx";

export default function App() {
    const [onboarded, setOnboarded] = useState(false);

    // Optional: Skip onboarding if user has already completed it
    useEffect(() => {
        const done : boolean = localStorage.getItem("onboardingComplete") === "false";
        setOnboarded(done);
    }, []);

    return onboarded ? (
        <AuthScreen onLogin={(token) => console.log("Logged in with", token)}/>
    ) : (
        <Onboarding onDone={() => setOnboarded(true)}/>
    );
}
