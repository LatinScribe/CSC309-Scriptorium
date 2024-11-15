import { SessionContext } from "@/contexts/session";
import React, { useContext, useState } from "react";
import { login } from "@/utils/dataInterface";
import { useRouter } from "next/router";

export default function LoginPage() {
    const { session, setSession } = useContext(SessionContext);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const router = useRouter();

    function handleLogin() {
        login(username, password)
            .then((session) => {
                setSession(session);
                router.push("/");
            })
            .catch((error) => {
                console.error("Login failed:", error);
                alert(error);
            });
    }

    return (
        <div className="flex flex-col items-center justify-center h-screen text-textcolor">
            <h1 className="text-3xl font-semibold">Login</h1>
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
                <button
                    onClick={handleLogin}
                    className="p-2 bg-primary text-buttontext rounded"
                >
                    Login
                </button>
            </div>
        </div>
    );
}