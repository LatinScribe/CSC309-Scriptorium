import { SessionContext } from "@/contexts/session";
import React, { useContext, useState } from "react";
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
import { fetchTemplates } from "@/utils/dataInterface";
import { Filters } from "@/utils/types";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export default function WelcomePage() {
    const { session } = useContext(SessionContext);
    const [searchTemplate, setSearchTemplate] = useState(true);
    const [searchBlog, setSearchBlog] = useState(true);
    const [filters, setFilters] = useState<Filters>({});

    const handleFiltersChange = (newFilters: Filters) => {
        setFilters(newFilters);
        console.log(filters)
    };

    const handleSearch = () => {
        console.log(filters);
        if (!searchTemplate && !searchBlog) {
            toast.error("Please select at least one type of content to search.");
            return;
        }
        if (searchTemplate) {
            const queryParams = new URLSearchParams({ ...filters, page: 1 } as any).toString();
            window.location.href = `/templates/?${queryParams}`;
        }
    };


    return (
        <div className="flex flex-col items-center justify-center pt-20 gap-10">
            <div className="flex flex-col items-center gap-3">
                <div className="text-2xl md:text-4xl">Code. Collaborate. Create.</div>
                <div className="text-1xl md:text-2xl">Welcome to Scriptorium.</div>
            </div>
            <div className="flex gap-3 flex-wrap justify-center">
                <Input
                    placeholder="Search"
                    className="w-72 sm:w-48 md:w-48 lg:w-96 xl:w-96"
                    value={filters.title}
                    onChange={(e) => setFilters({ ...filters, title: e.target.value })}
                />
                <div className="flex gap-3">
                    <DropdownMenu>
                        <DropdownMenuTrigger>
                            <Button>Category</Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuLabel>Type of content:</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuCheckboxItem
                                checked={searchTemplate}
                                onCheckedChange={setSearchTemplate}>
                                Templates
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                                checked={searchBlog}
                                onCheckedChange={setSearchBlog}>
                                Blogs
                            </DropdownMenuCheckboxItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <AdvancedSearchModal onFiltersChange={handleFiltersChange} />
                    <Button onClick={handleSearch}>Search</Button>
                </div>
            </div>
        </div>
    );
}