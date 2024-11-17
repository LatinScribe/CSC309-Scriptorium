import Link from "next/link";
import { SessionContext } from "@/contexts/session";
import React, { useContext, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { CodeIcon, FaceIcon, Pencil2Icon, PersonIcon } from "@radix-ui/react-icons";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
  } from "@/components/ui/sheet"
  import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
  } from "@/components/ui/alert-dialog"

export default function NavBar() {
    const { session, logout } = useContext(SessionContext);
    const { theme, setTheme } = useTheme();

    useEffect(() => {
        console.log('aaaa')
        console.log(session);
    }
    , []);

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
                            <Sheet>
                                <SheetTrigger asChild>
                                    <Button>
                                        <PersonIcon />
                                        {session?.user?.username}
                                    </Button>
                                </SheetTrigger>
                                <SheetContent className="bg-background gap-3 flex flex-col">
                                    <SheetHeader>
                                        <SheetTitle>User Menu</SheetTitle>
                                        <SheetDescription>
                                            All of your user options in one place.
                                        </SheetDescription>
                                    </SheetHeader>
                                    <ul className="space-y-4">
                                        <li>
                                            <Link href="/my-templates" className="flex items-center space-x-2">
                                               <CodeIcon />
                                               <span>My Templates</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link href="/my-blogs" className="flex items-center space-x-2">
                                                <Pencil2Icon />
                                                <span>My Blogs</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link href="/edit-profile" className="flex items-center space-x-2">
                                                <PersonIcon />
                                                <span>Edit Profile</span>
                                            </Link>
                                        </li>
                                        {session?.user?.role === "ADMIN" && (
                                            <li>
                                                <Link href="/moderation" className="flex items-center space-x-2 text-primary">
                                                    <FaceIcon />
                                                    <span>(Admins) Moderation</span>
                                                </Link>
                                            </li>
                                        )}
                                        <li>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button>
                                                        Logout
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent className="bg-background">
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>
                                                            Confirm Logout
                                                        </AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            {session?.user?.username}, are you sure you want to logout?
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>
                                                            Cancel
                                                        </AlertDialogCancel>
                                                        <AlertDialogAction onClick={logout} className="bg-destructive">
                                                            Logout
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </li>
                                    </ul>
                                </SheetContent>
                            </Sheet>
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
