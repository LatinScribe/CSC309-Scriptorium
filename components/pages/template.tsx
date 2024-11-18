import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { SessionContext } from "@/contexts/session";
import { useContext } from "react";
import { fetchTemplate, updateTemplate, createTemplate, deleteTemplate } from "@/utils/dataInterface";
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
// import 'prismjs/themes/prism.css';
import { Pencil1Icon } from "@radix-ui/react-icons";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "../ui/separator";
import { toast } from "sonner"
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
import { ScrollArea } from "@/components/ui/scroll-area"

export default function TemplatePage() {
    const router = useRouter();
    const id = parseInt(router.asPath.split("/")[2])
    const { session } = useContext(SessionContext);
    const [template, setTemplate] = useState<Template | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [showForkDialog, setShowForkDialog] = useState(false);
    const [forkTitle, setForkTitle] = useState("");
    const [forkExplanation, setForkExplanation] = useState("");
    const [forkTags, setForkTags] = useState<string[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const template = await fetchTemplate(id);
                setTemplate(template);
                setForkTitle(template.title);
                setForkExplanation(template.explanation || "");
                setForkTags(template.tags);
            } catch (error) {
                console.error("Faxiled to fetch template:", error);
                setError(`Failed to fetch template: ${(error as Error).message}`);
            }
        };
        fetchData();
    }, [router.query]);

    const handleSave = () => {
        if (!session) {
            return;
        }
        if (!template) {
            return;
        }
        const saveTemplate = async () => {
            try {
                const updatedTemplate = await updateTemplate(template, session);
                setTemplate(updatedTemplate);
                setIsEditing(false);
                setTemplate(template);
                setForkTitle(template.title);
                setForkExplanation(template.explanation || "");
                setForkTags(template.tags);
                toast.success("Template updated successfully");
            } catch (error) {
                console.error("Failed to update template:", error);
                setError("Failed to update template: " + (error as Error).message);
            }
        };
        saveTemplate();
    }

    const handleFork = () => {
        if (!session) {
            return;
        }
        if (!template) {
            return;
        }
        if (!forkTitle) {
            toast.error("Title is required");
            return;
        }
        const forkTemplate = async () => {
            try {
                const newTemplate = await createTemplate(forkTitle, session, forkTags, template.language, forkExplanation, template.id);
                router.push(`/templates/${newTemplate.id}`);
                toast.success("Template forked successfully");
            } catch (error) {
                console.error("Failed to fork template:", error);
                setError("Failed to fork template: " + (error as Error).message);
            }
        };
        forkTemplate();
        setShowForkDialog(false);
    }

    const handleDelete = () => {
        if (!session) {
            return;
        }
        if (!template) {
            return;
        }
        const deleteT = async () => {
            try {
                await deleteTemplate(template.id, session);
                router.push("/templates");
                toast.success("Template deleted successfully");
            } catch (error) {
                console.error("Failed to delete template:", error);
                setError("Failed to delete template: " + (error as Error).message);
            }
        };
        deleteT();
    }

    const openDialog = () => {
        setForkTitle("Fork of " + template?.title || "");
        setForkExplanation(template?.explanation || "");
        setForkTags(template?.tags || []);
        setShowForkDialog(true);
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
                    <div className='flex flex-col gap-3 p-4 h-screen'>
                        <div className='flex flex-col gap-1'>
                            <div className='flex justify-between flex-wrap'>
                                {
                                    isEditing ? (
                                        <div className='flex items-center gap-3'>
                                            <Label htmlFor="title" className="block text-sm font-medium text-gray-700">
                                                Title
                                            </Label>
                                            <Input
                                                id="title"
                                                type="text"
                                                value={template?.title}
                                                onChange={(e) => setTemplate({ ...template, title: e.target.value } as Template)}
                                                className="text-2xl"
                                            />
                                        </div>
                                    ) : (
                                        <div className="text-2xl">{template?.title}</div>
                                    )
                                }
                                <div className='flex gap-3'>
                                    {isEditing && (
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button className='bg-destructive text-primary'>
                                                    Delete Template
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent className='bg-background'>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you sure you want to delete this template?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This action cannot be undone.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>
                                                        Cancel
                                                    </AlertDialogCancel>
                                                    <AlertDialogAction onClick={handleDelete} className='bg-destructive text-primary'>
                                                        Delete
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    )}
                                    {session && !isEditing && (
                                        <>
                                            <Button onClick={openDialog}>
                                                <CodeIcon />
                                                Fork
                                            </Button>
                                            <Dialog open={showForkDialog} onOpenChange={setShowForkDialog}>
                                                <DialogContent className="bg-background">
                                                    <DialogHeader>
                                                        <DialogTitle>Fork Template</DialogTitle>
                                                        <DialogDescription>
                                                            Create a new fork of the template by providing the details below.
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    <div className="flex flex-col gap-3">
                                                        <Label htmlFor="fork-title" className="block text-sm font-medium text-gray-700">
                                                            Title
                                                        </Label>
                                                        <Input
                                                            id="fork-title"
                                                            type="text"
                                                            value={forkTitle}
                                                            onChange={(e) => setForkTitle(e.target.value)}
                                                            className="p-2 border border-gray-300 rounded"
                                                        />
                                                        <Label htmlFor="fork-explanation" className="block text-sm font-medium text-gray-700">
                                                            Explanation
                                                        </Label>
                                                        <Textarea
                                                            id="fork-explanation"
                                                            value={forkExplanation}
                                                            onChange={(e) => setForkExplanation(e.target.value)}
                                                            className="p-2 border border-gray-300 rounded"
                                                        />
                                                        <Label htmlFor="fork-tags" className="block text-sm font-medium text-gray-700">
                                                            Tags (comma-separated)
                                                        </Label>
                                                        <Input
                                                            id="fork-tags"
                                                            type="text"
                                                            value={forkTags}
                                                            onChange={(e) => setForkTags(e.target.value.split(","))}
                                                            className="p-2 border border-gray-300 rounded"
                                                        />
                                                    </div>
                                                    <DialogFooter>
                                                        <Button variant="outline" onClick={() => setShowForkDialog(false)}>
                                                            Cancel
                                                        </Button>
                                                        <Button onClick={handleFork}>
                                                            <SaveIcon />
                                                            Fork
                                                        </Button>
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>
                                        </>
                                    )}
                                    {(session && (session?.user?.username === template?.author?.username || session?.user?.role === "ADMIN")) &&
                                        <Button onClick={() => setIsEditing(!isEditing)}>
                                            <Pencil1Icon />
                                            Edit
                                        </Button>
                                    }
                                    {(session && (session?.user?.username === template?.author?.username || session?.user?.role === "ADMIN")) &&
                                        <Button onClick={handleSave}>
                                            <SaveIcon />
                                            Save
                                        </Button>
                                    }
                                </div>
                            </div>
                            {
                                isEditing ? (
                                    <>
                                        <Label htmlFor="explanation" className="block text-sm font-medium text-gray-700">
                                            Explanation
                                        </Label>
                                        <Textarea
                                            id="explanation"
                                            value={template?.explanation}
                                            onChange={(e) => setTemplate({ ...template, explanation: e.target.value } as Template)}
                                            className="p-2 border border-gray-300 rounded"
                                        />
                                    </>
                                ) : (
                                    <div className="text-sm text-gray-500">{template?.explanation}</div>
                                )
                            }
                            {
                                isEditing ? (
                                    <>
                                        <Label htmlFor="tags" className="block text-sm font-medium text-gray-700">
                                            Tags (comma-separated)
                                        </Label>
                                        <Input
                                            id="tags"
                                            type="text"
                                            value={template?.tags.join(",")}
                                            onChange={(e) => setTemplate({ ...template, tags: e.target.value.split(",") } as Template)}
                                            className="p-2 border border-gray-300 rounded"
                                        />
                                    </>
                                ) : (
                                    <div className='flex items-center gap-3'>
                                        <div className="text-sm text-gray-500">Tags: {Array.isArray(template?.tags) ? (template.tags.join(", ").length > 20 ? template.tags.join(", ").substring(0, 20) + "..." : template.tags.join(", ")) : ""}</div>
                                        <Separator orientation="vertical" />
                                        <div className="text-sm text-gray-500">Author: {template?.author?.username}</div>
                                        {template?.forkedSourceId && (
                                            <Separator orientation="vertical" />)}
                                        {template?.forkedSourceId && (

                                            <div className='flex gap-2 items-center'>
                                                <div className="text-sm text-gray-500 italic">
                                                    This template is a fork.
                                                </div>
                                                {/* <Button> */}
                                                    <Link href={`/templates/${template.forkedSourceId}`} className='text-sm text-primary italic'>
                                                        View source
                                                    </Link>
                                                {/* </Button> */}
                                            </div>
                                        )}
                                    </div>
                                )
                            }
                            {/* {template?.forkedSourceId && (
                                <div className='flex gap-3 items-center'>
                                    <div className="text-sm text-gray-500 italic">
                                        This template is a fork.
                                    </div>
                                    <Button>
                                        <Link href={`/templates/${template.forkedSourceId}`}>
                                            View source
                                        </Link>
                                    </Button>
                                </div>
                            )} */}
                        </div>
                        <Separator />
                        <div className="flex justify-center">
                            <Button className='p-5 text-1xl'>
                                <PlayIcon />
                                Run
                            </Button>
                        </div>
                        <ScrollArea className="rounded-lg border max-h-[50%] md:max-h-none md:flex-grow">
                            <Editor
                                value={template?.content || ""}
                                onValueChange={(code) => setTemplate({ ...template, content: code } as Template)}
                                highlight={(code) => Prism.highlight(code, Prism.languages[template?.language || 'javascript'], template?.language || 'javascript')}
                                padding={10}
                                style={{
                                    fontFamily: '"Fira code", "Fira Mono", monospace',
                                    fontSize: 14,
                                }}
                                className="w-full"
                            />
                        </ScrollArea>
                    </div>
                </div>
            )}
        </>

    );
}