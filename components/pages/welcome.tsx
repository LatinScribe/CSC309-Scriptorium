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

export default function WelcomePage() {
    const { session } = useContext(SessionContext);
    const [searchTemplate, setSearchTemplate] = useState(true);
    const [searchBlog, setSearchBlog] = useState(true);
    const [filters, setFilters] = useState<Filters>({
        title: "",
        content: "",
        tags: [],
        ids: [],
    });

    const handleFiltersChange = (newFilters: Filters) => {
        setFilters({
            title: newFilters.title || "",
            content: newFilters.content || "",
            tags: newFilters.tags || [],
            ids: newFilters.ids || [],
        });
        console.log("Filters:", newFilters);
    };

    const handleSearch = () => {
        console.log(filters);
        fetchTemplates(filters, 1, 10)
            .then((templates) => {
                console.log("Templates:", templates);
            })
            .catch((error) => {
                console.error("Search failed:", error);
                alert(error);
            });
    };


    return (
        <div className="flex flex-col items-center justify-center pt-20 gap-10">
            <div className="flex flex-col items-center gap-3">
                <div className="text-4xl">Code. Collaborate. Create.</div>
                <div className="text-2xl">Welcome to Scriptorium.</div>
            </div>
            <div className="flex gap-3 flex-wrap justify-center">
                <Input
                    placeholder="Search"
                    className="w-96 sm:w-24 md:w-48 lg:w-96 xl:w-96"
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