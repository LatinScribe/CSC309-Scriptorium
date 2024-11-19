import React, { createContext, useState, useEffect } from "react";
import { ReactNode } from "react";
import { Session } from "@/utils/types";

interface SessionContextType {
    session: Session | null;
    setSession: (session: Session) => void;
    logout: () => void;
}

export const SessionContext = createContext<SessionContextType>({
    session: null,
    setSession: () => {},
    logout: () => {},
});

export function SessionProvider({ children }: { children: ReactNode }) {
    const [session, setSessionState] = useState<Session | null>(null);

    useEffect(() => {
        const savedSession = localStorage.getItem("session");
        if (savedSession) {
            setSessionState(JSON.parse(savedSession));
        }
    }, []);

    const setSession = (session: Session) => {
        setSessionState(session);
        localStorage.setItem("session", JSON.stringify(session));
    };

    const logout = () => {
        setSessionState(null);
        localStorage.removeItem("session");
    };

    return (
        <SessionContext.Provider value={{ session, setSession, logout }}>
            {children}
        </SessionContext.Provider>
    );
}