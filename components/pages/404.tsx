import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Custom404() {
    return (
        <div className="flex items-center justify-center h-screen text-textcolor">
        <div className="w-96">
            <h1 className="text-4xl font-bold mb-4">404</h1>
            <p className="mb-4">Oops! Page not found. We'll get Scooby and the gang to solve this mystery!</p>
            <Button>
                <Link href="/">
                    Home
                </Link>
            </Button>
        </div>
        </div>
    );
}