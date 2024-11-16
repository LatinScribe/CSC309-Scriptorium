import { SessionContext } from "@/contexts/session";
import React, { useContext } from "react";

export default function WelcomePage() {
    const { session } = useContext(SessionContext);
    return (
        <div className="bg-background">
            hello
        </div>
    );
}