import { Input } from "../ui/input";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button";
import AdvancedSearchModal, { AdvancedSearchProps } from "../AdvancedSearch";
import { fetchTemplates, createTemplate } from "@/utils/dataInterface";
import { Filters, PaginationInfo, Template } from "@/utils/types";
import { useState, useEffect, useContext } from "react";
import { useRouter } from "next/router";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination"
import { Separator } from "../ui/separator";
import { SessionContext } from "@/contexts/session";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { PlayIcon, PlusIcon } from "@radix-ui/react-icons";
import { toast } from "sonner";
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
import Link from "next/link";

const languages = [
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
        "label": "Brainf--k"
    }
]


export default function TemplatesPage() {
    const { session } = useContext(SessionContext);
    const [filters, setFilters] = useState<Filters>({});

    const [templates, setTemplates] = useState<Template[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);
    const [pageCount, setPageCount] = useState(1);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [templateTitle, setTemplateTitle] = useState("");
    const [templateExplanation, setTemplateExplanation] = useState("");
    const [templateTags, setTemplateTags] = useState<string[]>([]);
    const [comboOpen, setComboOpen] = useState(false);
    const [templateLanguage, setTemplateLanguage] = useState("");
    const router = useRouter();

    useEffect(() => {
        if (!router.isReady) return;
        const { title, content, tags, page } = router.query;

        const initialFilters: Filters = {
            title: title as string || "",
            content: content as string || "",
            tags: tags ? (Array.isArray(tags) ? tags : [tags]) : [],
        };

        setFilters(initialFilters);
        fetchTemplates(initialFilters, page ? parseInt(page as string) : 1, pageSize)
            .then((templates) => {
                console.log("Templates:", templates);
                setTemplates(templates['templates']);
                setPageCount(templates['pagination'].totalPages);
                if (page) {
                    setCurrentPage(parseInt(page as string));
                } else {
                    setCurrentPage(1);
                }
            })
            .catch((error) => {
                console.error("Search failed:", error);
                toast.error("Failed to fetch templates.");
            });
    }, [router.query]);

    const handleFiltersChange = (newFilters: Filters) => {
        setFilters(newFilters);
    };

    const handleSearch = () => {
        const query: { [key: string]: string } = {};
        if (filters.title) query.title = filters.title;
        if (filters.content) query.content = filters.content;
        if (filters.tags && filters.tags.length > 0) query.tags = filters.tags.join(",");

        router.push({
            pathname: "/templates",
            query,
        });
    };

    const handleCreate = () => {
        if (!session) {
            toast.error("You must be logged in to create a template.");
            setShowCreateDialog(false);
            return;
        }
        // Create a new template
        if (!templateTitle) {
            toast.error("Please provide a title for the template.");
            return;
        }
        if (!templateLanguage) {
            toast.error("Please select a language for the template.");
            return;
        }
        setShowCreateDialog(false);
        const create = async () => {
            try {
                const response = await createTemplate(templateTitle, session, templateTags, templateLanguage, templateExplanation);
                console.log("Template created:", response);
                toast.success("Template created successfully.");
                router.push(`/templates/${response.id}`);
            } catch (error) {
                console.error("Failed to create template:", error);
                toast.error("Failed to create template.");
            }
        }
        create();
    }

    const openDialog = () => {
        setTemplateTitle("");
        setTemplateExplanation("");
        setTemplateTags([]);
        setTemplateLanguage("");
        setShowCreateDialog(true);
    }

    return (
        <div className="flex justify-center">
            <div className="flex flex-col justify-center container pt-10 px-5 gap-5">
                <div className="text-2xl">Dive into the Scriptorium</div>
                <div className="flex justify-between flex-wrap">
                    <div className="flex gap-3 pb-3 flex-wrap">
                        <Input
                            placeholder="Search"
                            className="w-36 md:w-48 lg:w-96 xl:w-96"
                            value={filters.title}
                            onChange={(e) => setFilters({ ...filters, title: e.target.value })}
                        />
                        <AdvancedSearchModal onFiltersChange={handleFiltersChange} />
                        <Button onClick={handleSearch}>Search</Button>
                    </div>
                    <div className='flex gap-3'>
                        <Link href='/playground'>
                            <Button>
                                <PlayIcon />
                                Playground
                            </Button>
                        </Link>
                        {session && (
                            <>
                                <Button onClick={openDialog}>
                                    <PlusIcon />
                                    Create Template
                                </Button>
                                <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                                    <DialogContent className="bg-background">
                                        <DialogHeader>
                                            <DialogTitle>Create Template</DialogTitle>
                                            <DialogDescription>
                                                Create a new code template by providing the details below.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="flex flex-col gap-3">
                                            <Label htmlFor="fork-title" className="block text-sm font-medium text-gray-500">
                                                Title
                                            </Label>
                                            <Input
                                                id="fork-title"
                                                type="text"
                                                value={templateTitle}
                                                onChange={(e) => setTemplateTitle(e.target.value)}
                                                className="p-2 border border-gray-300 rounded"
                                            />
                                            <Label htmlFor="fork-explanation" className="block text-sm font-medium text-gray-500">
                                                Explanation
                                            </Label>
                                            <Textarea
                                                id="fork-explanation"
                                                value={templateExplanation}
                                                onChange={(e) => setTemplateExplanation(e.target.value)}
                                                className="p-2 border border-gray-300 rounded"
                                            />
                                            <Label htmlFor="fork-tags" className="block text-sm font-medium text-gray-500">
                                                Tags (comma-separated)
                                            </Label>
                                            <Input
                                                id="fork-tags"
                                                type="text"
                                                value={templateTags}
                                                onChange={(e) => setTemplateTags(e.target.value.split(","))}
                                                className="p-2 border border-gray-300 rounded"
                                            />
                                            <Label htmlFor="fork-language" className="block text-sm font-medium text-gray-500">
                                                Language
                                            </Label>
                                            <Popover open={comboOpen} onOpenChange={setComboOpen}>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        aria-expanded={comboOpen}
                                                        className="w-full justify-between"
                                                    >
                                                        {templateLanguage
                                                            ? languages.find((lang) => lang.value === templateLanguage)?.label
                                                            : "Select language..."}
                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-full p-0 bg-background">
                                                    <Command>
                                                        <CommandInput placeholder="Search language..." />
                                                        <CommandList>
                                                            <CommandEmpty>No language found.</CommandEmpty>
                                                            <CommandGroup>
                                                                {languages.map((language) => (
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
                                        </div>
                                        <DialogFooter>
                                            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                                                Cancel
                                            </Button>
                                            <Button onClick={handleCreate}>
                                                <PlusIcon />
                                                Create
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </>
                        )}
                    </div>

                </div>
                <div className='flex flex-col gap-5'>
                    {templates.map((template) => (
                        <a key={template.id} className="flex flex-col gap-2 p-4 border rounded-lg" href={`/templates/${template.id}`}>
                            <div className="text-xl">{template.title}</div>
                            <div className="text-sm">{template.explanation && template.explanation.length > 100 ? `${template.explanation.substring(0, 100)}...` : template.explanation}</div>
                            <div className="flex h-5 items-center space-x-4 text-sm">
                                <div>
                                    {template.tags.length > 0
                                        ? template.tags.join(", ").length > 20
                                            ? `${template.tags.join(", ").substring(0, 20)}...`
                                            : template.tags.join(", ")
                                        : <div className='italic text-muted'>No tags provided</div>}
                                </div>
                                <Separator orientation="vertical" />
                                <div>
                                    {template.author?.username}
                                </div>
                                <Separator orientation="vertical" className="hidden sm:block" />
                                <div className="hidden sm:block">
                                    Last updated: {new Date(template.modifiedAt).toLocaleDateString()}
                                </div>
                                <Separator orientation="vertical" className="hidden sm:block" />
                                <div className="hidden sm:block">
                                    {template.language}
                                </div>
                            </div>
                        </a>
                    ))}
                </div>
                <Pagination>
                    <PaginationContent className='flex flex-row justify-center'>
                        <PaginationItem>
                            <PaginationPrevious
                                onClick={() => {
                                    if (currentPage > 1) {
                                        const query: { [key: string]: string } = {};
                                        if (filters.title) query.title = filters.title;
                                        if (filters.content) query.content = filters.content;
                                        if (filters.tags && filters.tags.length > 0) query.tags = filters.tags.join(",");
                                        query.page = (currentPage - 1).toString();

                                        router.push({
                                            pathname: "/templates",
                                            query,
                                        });
                                    }
                                }}
                            />
                        </PaginationItem>
                        {Array.from({ length: pageCount }, (_, index) => (
                            <PaginationItem key={index}>
                                <PaginationLink
                                    isActive={currentPage === index + 1}
                                    onClick={() => {
                                        const query: { [key: string]: string } = {};
                                        if (filters.title) query.title = filters.title;
                                        if (filters.content) query.content = filters.content;
                                        if (filters.tags && filters.tags.length > 0) query.tags = filters.tags.join(",");
                                        query.page = (index + 1).toString();

                                        router.push({
                                            pathname: "/templates",
                                            query,
                                        });
                                    }}
                                >
                                    {index + 1}
                                </PaginationLink>
                            </PaginationItem>
                        ))}
                        <PaginationItem>
                            <PaginationNext
                                onClick={() => {
                                    if (currentPage < pageCount) {
                                        const query: { [key: string]: string } = {};
                                        if (filters.title) query.title = filters.title;
                                        if (filters.content) query.content = filters.content;
                                        if (filters.tags && filters.tags.length > 0) query.tags = filters.tags.join(",");
                                        query.page = (currentPage + 1).toString();

                                        router.push({
                                            pathname: "/templates",
                                            query,
                                        });
                                    }
                                }}
                            />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            </div>
        </div>
    );
}