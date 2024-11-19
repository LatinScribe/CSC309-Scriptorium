import { SessionContext } from "@/contexts/session";
import React, { useContext } from "react";

export default function WelcomePage() {
    const { session } = useContext(SessionContext);
    return (
        <div className="flex items-center justify-center h-screen">
        <div className="w-96 container text-textcolor">
            <h1 className="text-4xl font-bold mb-4">Welcome</h1>
            <p className="mb-4">This is a welcome page.</p>
            <p>Your access token: {session?.accessToken}</p>
            <p>Your refresh token: {session?.refreshToken}</p>
        </div>
        </div>
    );
}