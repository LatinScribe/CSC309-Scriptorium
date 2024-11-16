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

export default function WelcomePage() {
    const { session } = useContext(SessionContext);
    const [searchTemplate, setSearchTemplate] = useState(true);
    const [searchBlog, setSearchBlog] = useState(true);
    const [filters, setFilters] = useState({
        title: "",
        content: "",
        tags: "",
        ids: "",
      });

    interface Filters {
        title: string;
        content: string;
        tags: string;
        ids: string;
    }

    const handleFiltersChange = (newFilters: Filters) => {
        setFilters(newFilters);
        console.log("Filters:", newFilters);
    };

    const handleSearch = () => {
        const searchParams = {
          ...filters,
          tags: filters.tags.split(","),
          ids: filters.ids.split(","),
        };
        console.log("Search Params:", searchParams);
        // Implement your search logic here
      };
    

    return (
        <div className="flex flex-col items-center justify-center pt-20 gap-10">
            <div className="flex flex-col items-center gap-3">
                <div className="text-4xl">Code. Collaborate. Create.</div>
                <div className="text-2xl">Welcome to Scriptorium.</div>
            </div>
            <div className="flex gap-3 flex-wrap justify-center">
            <Input placeholder="Search" className="w-96 sm:w-24 md:w-48 lg:w-96 xl:w-96"/>
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
            <Button>Search</Button>
            </div>
            </div>
        </div>
    );
}