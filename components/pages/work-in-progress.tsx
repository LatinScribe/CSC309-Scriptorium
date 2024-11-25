import React from 'react';
import { Button } from "@/components/ui/button";
import Link from "next/link";

const WorkInProgress: React.FC = () => {
    return (
        <div className="flex items-center justify-center h-screen text-textcolor">
            <div className="w-96 text-center">
                <h1 className="text-4xl font-bold mb-4">Work in progress 🛠️</h1>
                <p className="mb-4">Coming to a Scriptorium near you!</p>
                <Button>
                    <Link href="/">
                        Home
                    </Link>
                </Button>
            </div>
        </div>
    );
};

export default WorkInProgress;