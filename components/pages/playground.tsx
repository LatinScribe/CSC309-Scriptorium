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
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-ruby';
import 'prismjs/components/prism-php';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-markup-templating';
import 'prismjs/components/prism-perl';
import 'prismjs/components/prism-swift';
import 'prismjs/components/prism-brainfuck';
import { Pencil1Icon, TrashIcon } from "@radix-ui/react-icons";
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
import { ScrollArea } from "../ui/scroll-area";
import { executeCode } from "@/utils/dataInterface";

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
        "value": "cpp",
        "label": "C++"
    },
    {
        "value": "rust",
        "label": "Rust"
    },
    {
        "value": "go",
        "label": "Go"
    },
    {
        "value": "ruby",
        "label": "Ruby"
    },
    {
        "value": "php",
        "label": "PHP"
    },
    {
        "value": "perl",
        "label": "Perl"
    },
    {
        "value": "swift",
        "label": "Swift"
    },
    {
        "value": "brainfuck",
        "label": "Brainfuck"
    }
]


export default function PlaygroundPage() {
    const [code, setCode] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [templateLanguage, setTemplateLanguage] = useState("javascript");
    const [comboOpen, setComboOpen] = useState(false);
    const [isRunning, setIsRunning] = useState(false);
    const [inputs, setInputs] = useState<string[]>([]);
    const [stdout, setStdout] = useState("");
    const [stderr, setStderr] = useState("");

    const handleRun = async () => {
        toast.info("Running code...");
        setIsRunning(true);
        try {
            const { output, error } = await executeCode(templateLanguage, code, inputs);
            setStdout(output);
            setStderr(error);
            toast.success("Code executed successfully");
        } catch (error) {
            console.error("Failed to execute code:", error);
            toast.error("Failed to execute code: " + (error as Error).message);
        }
        setIsRunning(false);
    }

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
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2">
                    <div className='flex flex-col gap-3 p-4 h-fit'>
                        <Alert variant="default">
                            <CodeIcon className="h-4 w-4" />
                            <AlertTitle>Welcome to the Playground!</AlertTitle>
                            <AlertDescription>Write and run your code immediately, without needing first log in or create a template.</AlertDescription>
                        </Alert>
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
                        {isRunning ? (
                                <Button disabled>
                                    Running...
                                </Button>
                            ) : (
                                <Button onClick={handleRun}>
                                    <PlayIcon />
                                    Run
                                </Button>
                            )}
                        </div>
                        <ScrollArea className="rounded-lg border h-[calc(100vh-400px)]">
                            <Editor
                                value={code}
                                onValueChange={setCode}
                                highlight={(code) => Prism.highlight(code, Prism.languages[templateLanguage], templateLanguage)}
                                padding={10}
                                style={{
                                    fontFamily: '"Fira code", "Fira Mono", monospace',
                                    fontSize: 14,
                                }}
                                className="w-full"
                            />
                        </ScrollArea>
                    </div>
                    <div className="flex flex-col gap-3 p-4">
                        <div className="flex flex-col gap-3">
                            <div className="flex justify-between items-center">
                                <div className="text-lg font-medium">Inputs (Stdin)</div>
                                <Button onClick={() => setInputs([...inputs, ""])}>Add Input</Button>
                            </div>
                              {inputs.map((input, index) => (
                                <div key={index} className="flex items-center gap-3">
                                    <Input
                                        type="text"
                                        value={input}
                                        onChange={(e) => {
                                            const newInputs = [...inputs];
                                            newInputs[index] = e.target.value;
                                            setInputs(newInputs);
                                        }}
                                        className="flex-grow"
                                    />
                                    <Button
                                        variant="destructive"
                                        onClick={() => {
                                            const newInputs = inputs.filter((_, i) => i !== index);
                                            setInputs(newInputs);
                                        }}
                                    >
                                        <TrashIcon />
                                    </Button>
                                </div>
                              ))}  
                              {inputs.length === 0 && (
                                <div className="text-sm text-gray-500">No inputs added.</div>
                              )}
                            
                        </div>
                        <div className="text-lg font-medium">Output (Stdout)</div>
                        <ScrollArea className="p-4 border rounded-lg max-h-64">
                            {stdout.split('\n').map((line, index) => (
                                <div key={index}>{line}</div>
                            ))}
                        </ScrollArea>
                        <div className="text-lg font-medium">Error (Stderr)</div>
                        <ScrollArea className="p-4 border rounded-lg max-h-64">
                            {stderr.split('\n').map((line, index) => (
                                <div key={index}>{line}</div>
                            ))}
                        </ScrollArea>
                    </div>
                </div>
            )}
        </>

    );
}