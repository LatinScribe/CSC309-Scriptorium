import { SessionContext } from "@/contexts/session";
import React, { useContext, useState } from "react";
import { register } from "@/utils/accountInterface";
import { useRouter } from "next/router";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

export default function RegisterPage() {
    const { session, setSession } = useContext(SessionContext);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [email, setEmail] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [avatar, setAvatar] = useState("");
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const router = useRouter();

    function handleRegister() {
        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        register(username, password, email, avatar, phoneNumber, firstName, lastName)
            .then((session) => {
                router.push("/login");
            })
            .catch((error) => {
                console.error("Registration failed:", error);
                setError(error.message || "Registration failed");
            });
    }

    return (
        <div className="flex flex-col items-center justify-center h-screen text-textcolor">
            <h1 className="text-3xl font-semibold p-4">Register</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-lg p-4">
                <Input
                    type="text"
                    placeholder="Username *"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="p-2 border border-gray-300 rounded"
                    required
                />
                <div className="relative">
                    <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Password *"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="p-2 border border-gray-300 rounded w-full"
                        required
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 p-2"
                    >
                        {showPassword ? "Hide" : "Show"}
                    </button>
                </div>
                <div className="relative">
                    <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Confirm Password *"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="p-2 border border-gray-300 rounded w-full"
                        required
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 p-2"
                    >
                        {showPassword ? "Hide" : "Show"}
                    </button>
                </div>
                <Input
                    type="email"
                    placeholder="Email *"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="p-2 border border-gray-300 rounded"
                    required
                />
                <Input
                    type="text"
                    placeholder="First Name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="p-2 border border-gray-300 rounded"
                />
                <Input
                    type="text"
                    placeholder="Last Name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="p-2 border border-gray-300 rounded"
                />
                <Input
                    type="text"
                    placeholder="Phone Number"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="p-2 border border-gray-300 rounded"
                />
                <Input
                    type="text"
                    placeholder="Avatar (URL)"
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    className="p-2 border border-gray-300 rounded"
                />
                <div className="col-span-1 md:col-span-2 flex justify-center">
                    <Button onClick={handleRegister}>
                        Register
                    </Button>
                </div>
                {error && (
                    <div className="col-span-1 md:col-span-2 text-red-500 text-center mt-4">
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
}
