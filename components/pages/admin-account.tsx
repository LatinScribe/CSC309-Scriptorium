import { SessionContext } from "@/contexts/session";
import React, { useContext, useState } from "react";
import { login, getProfileADMIN, searchUsers } from "@/utils/accountInterface";
import { useRouter } from "next/router";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

export default function AdminAccount() {
    const { session, setSession } = useContext(SessionContext);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    const router = useRouter();

    if (!session) {
        router.push("/login");
    }

    if (session?.user.role !== "ADMIN") {
        router.push("/");
    }

    function handleLogin() {
        if (session?.accessToken && session?.refreshToken) {
            searchUsers(username)
                .then((result) => {
                    if (result === false) {
                        setErrorMessage("User not found");
                        //return;
                    }
                    
                    setErrorMessage(`User ${username} found`);
                router.push(`/admin-profile?username=${encodeURIComponent(username)}`);
                })
                .catch((error) => {
                    console.error("Could not retrieve the provided username in ADMIN:", error);
                    setErrorMessage(error.message || "Could not retrieve the provided username in ADMIN");
                });
        } else {
            setErrorMessage("Session tokens are missing");
        }
    }

    function handleForgotPassword() {
        router.push("/work-in-progress");
    }

    return (
        <div className="flex flex-col items-center justify-center h-screen text-textcolor">
            <h1 className="text-3xl font-semibold p-4">Select a User</h1>
            <div className="flex flex-col items-center justify-center space-y-4">
                <Input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="p-2 border border-gray-300 rounded"
                />
                <Button onClick={handleLogin}>
                    Select
                </Button>
                {errorMessage && (
                    <p className="text-red-500 mt-4">{errorMessage}</p>
                )}
            </div>
        </div>
    );
}