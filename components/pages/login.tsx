import { SessionContext } from "@/contexts/session";
import React, { useContext, useState } from "react";
import { login } from "@/utils/accountInterface";
import { useRouter } from "next/router";
import { Button } from "../ui/button";

export default function LoginPage() {
    const { session, setSession } = useContext(SessionContext);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    const router = useRouter();

    function handleLogin() {
        login(username, password)
            .then((session) => {
                setSession(session);
                router.push("/");
            })
            .catch((error) => {
                console.error("Login failed:", error);
                setErrorMessage(error.message || "Login failed");
            });
    }

    return (
        <div className="flex flex-col items-center justify-center h-screen text-textcolor">
            <h1 className="text-3xl font-semibold p-4">Login</h1>
            <div className="flex flex-col items-center justify-center space-y-4">
                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="p-2 border border-gray-300 rounded"
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="p-2 border border-gray-300 rounded"
                />
                <Button onClick={handleLogin}>
                    Login
                </Button>
                {errorMessage && (
                    <p className="text-red-500 mt-4">{errorMessage}</p>
                )}
            </div>
        </div>
    );
}