import Link from "next/link";
import { SessionContext } from "@/contexts/session";
import React, { useContext, useState } from "react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";

export default function NavBar() {
    const { session, logout } = useContext(SessionContext);
    // const [theme, setTheme] = useState("light");

    // const toggleTheme = () => {
    //     const newTheme = theme === "light" ? "dark" : "light";
    //     setTheme(newTheme);
    //     document.documentElement.setAttribute("data-theme", newTheme);
    // };

    // return (
    //     <div>
    //         <nav className="flex justify-between bg-primary p-4 align-center items-center text-white">
    //             <ul className="flex space-x-4 items-center">
    //             <li>
    //                 <Link href="/" className="font-bold hover:text-gray-300">
    //                 Scriptorium
    //                 </Link>
    //             </li>
    //             <li>
    //                 <Link href="/templates" className="hover:text-gray-300">
    //                 Templates
    //                 </Link>
    //             </li>
    //             <li>
    //                 <Link href="/blogs" className="hover:text-gray-300">
    //                 Blogs
    //                 </Link>
    //             </li>
    //             </ul>
    //             <ul className="flex space-x-4 items-center">
    //             <li>
    //                 <button
    //                 onClick={toggleTheme}
    //                 className="hover:text-gray-300"
    //                 >
    //                 {theme === "light" ? "Dark Mode" : "Light Mode"}
    //                 </button>
    //             </li>
    //             {session ? (
    //                 <li>
    //                 <button
    //                     onClick={logout}
    //                     className="hover:text-gray-300"
    //                 >
    //                     Logout
    //                 </button>
    //                 </li>
    //             ) : (
    //                 <li>
    //                 <Link href="/login" className="hover:text-gray-300">
    //                     Login
    //                 </Link>
    //                 </li>
    //             )}
    //             </ul>
    //         </nav>
    //     </div>
    // )

    const { theme, setTheme } = useTheme();

    return (
        <div>
            <nav className="flex justify-between bg-background p-4 align-center items-center">
                <ul className="flex space-x-4 items-center">
                    <li>
                        <Link href="/" className="font-bold hover:text-gray-300">
                            Scriptorium
                        </Link>
                    </li>
                    <li>
                        <Link href="/templates" className="hover:text-gray-300">
                            Templates
                        </Link>
                    </li>
                    <li>
                        <Link href="/blogs" className="hover:text-gray-300">
                            Blogs
                        </Link>
                    </li>
                </ul>
                <ul className="flex space-x-4 items-center">
                    <li>
                        <Button
                            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                        >
                            {theme === "light" ? "Dark Mode" : "Light Mode"}
                        </Button>
                    </li>
                    {session ? (
                        <li>
                            <Button
                                onClick={logout}
                            >
                                Logout
                            </Button>
                        </li>
                    ) : (
                        <li>
                            <Link href="/login">
                                <Button>
                                    Login
                                </Button>
                            </Link>
                        </li>
                    )}
                </ul>
            </nav>
        </div>
    );
}
