import { useEffect, useState } from "react";
import { AlertCircle, CodeIcon, PlayIcon, SaveIcon } from "lucide-react";
import {
    Alert,
    AlertDescription,
    AlertTitle,
} from "@/components/ui/alert"
import { Button } from "@/components/ui/button";
import { Template } from "@/utils/types";
import Link from "next/link";
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs/components/prism-core';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/themes/prism.css';
import { Pencil1Icon } from "@radix-ui/react-icons";
import { Input } from "../ui/input";
import { Separator } from "../ui/separator";
import { toast } from "sonner"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Label } from "../ui/label";

const codeLanguages = [
    {
        "value": "python",
        "label": "Python"
    },
    {
        "value": "javascript",
        "label": "JavaScript"
    },
    {
        "value": "java",
        "label": "Java"
    },
    {
        "value": "c",
        "label": "C"
    },
    {
        "value": "c++",
        "label": "C++"
    }
]


export default function PlaygroundPage() {
    const [code, setCode] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [templateLanguage, setTemplateLanguage] = useState("javascript");
    const [comboOpen, setComboOpen] = useState(false);

    return (
        <>
            {error ? (
                <div className="flex flex-col items-center justify-center space-y-4">
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                    <Button>
                        <Link href="/">
                            Return to home
                        </Link>
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-3">
                    <div className='flex flex-col gap-3 p-4'>
                        <div className="flex gap-3 items-center justify-between">
                            <div className="text-2xl">Playground</div>
                            <>
                            <Popover open={comboOpen} onOpenChange={setComboOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={comboOpen}
                                        className="justify-between"
                                        id="language"
                                    >
                                        {templateLanguage
                                            ? codeLanguages.find((lang) => lang.value === templateLanguage)?.label
                                            : "Select language..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="p-0 bg-background">
                                    <Command>
                                        <CommandInput placeholder="Search language..." />
                                        <CommandList>
                                            <CommandEmpty>No language found.</CommandEmpty>
                                            <CommandGroup>
                                                {codeLanguages.map((language) => (
                                                    <CommandItem
                                                        key={language.value}
                                                        onSelect={() => {
                                                            setTemplateLanguage(language.value);
                                                            setComboOpen(false);
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                templateLanguage === language.value ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                        {language.label}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                            </>
                            
                        </div>
                        <Separator />
                        <div className="flex justify-center">
                            <Button className='p-5 text-1xl'>
                                <PlayIcon />
                                Run
                            </Button>
                        </div>
                        <div className="rounded-lg border bg-gray-100">
                            <Editor
                                value={code}
                                onValueChange={setCode}
                                highlight={(code) => highlight(code, languages.js)}
                                padding={10}
                                style={{
                                    fontFamily: '"Fira code", "Fira Mono", monospace',
                                    fontSize: 14,
                                }}
                                className="h-96 w-full"
                            />
                        </div>
                    </div>
                    <div>

                    </div>
                </div>
            )}
        </>

    );
}