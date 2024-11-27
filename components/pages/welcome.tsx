import { SessionContext } from "@/contexts/session";
import React, { useContext, useState } from "react";
import { Input } from "../ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select"
import { Button } from "@/components/ui/button";
import AdvancedSearchModal, { AdvancedSearchProps } from "../AdvancedSearch";
import { fetchTemplates } from "@/utils/dataInterface";
import { Filters } from "@/utils/types";
import { toast } from "sonner";
import { TypeAnimation } from 'react-type-animation';
import { useRouter } from "next/router";
import Link from 'next/link';
import { useReward } from "react-rewards";

export default function WelcomePage() {
    const { session } = useContext(SessionContext);
    const [ searchCategory, setSearchCategory ] = useState<string>("");
    const [filters, setFilters] = useState<Filters>({});
    const router = useRouter();

    const handleFiltersChange = (newFilters: Filters) => {
        setFilters(newFilters);
        console.log(filters)
    };

    const handleSearch = () => {
        // if (searchTemplate) {
        //     const queryParams = new URLSearchParams({ ...filters, page: 1 } as any).toString();
        //     router.push(`/templates/?${queryParams}`);
        // }
        // if (searchBlog) {
        //     const queryParams = new URLSearchParams({ ...filters, page: 1 } as any).toString();
        //     window.location.href = `/blogs/?${queryParams}`;
        // }
        if (searchCategory === "templates") {
            const queryParams = new URLSearchParams({ ...filters, page: 1 } as any).toString();
            router.push(`/templates/?${queryParams}`);
        }
        if (searchCategory === "blogs") {
            const queryParams = new URLSearchParams({ ...filters, page: 1 } as any).toString();
            router.push(`/blogs/?${queryParams}`);
        }
    };


    return (
        <div className="flex flex-col items-center justify-center gap-12">
            <div className="flex flex-col items-center gap-3 p-20 w-full bg-secondary">
                <TypeAnimation 
                    sequence={[
                        'Code.',
                        1000,
                        'Code. Collaborate.',
                        1000,
                        'Code. Collaborate. Create.',
                        1000,
                        '',
                    ]}
                    speed={50}
                    className="text-4xl sm:text-5xl" 
                    repeat={Infinity}
                />
                <div className="text-2xl text-gray-400">It all happens on Scriptorium.</div>
                <Link href="/playground">
            <Button className='text-1xl p-5 mt-3'>
                Start Coding
            </Button>
            </Link>
            </div>
            <div className='flex flex-col gap-5 items-center'>
            <div className="text-2xl">Explore the Scriptorium</div>
            <div className="flex gap-3 flex-wrap justify-center">
                <Input
                    placeholder="Search"
                    className="w-56 sm:w-64 md:w-72 lg:w-96 xl:w-96"
                    value={filters.title}
                    onChange={(e) => setFilters({ ...filters, title: e.target.value })}
                />
                <div className="flex gap-3">
                    <Select value={searchCategory} onValueChange={(value: string) => setSearchCategory(value)}>
                        <SelectTrigger>
                        <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent className='bg-background'>
                            <SelectItem value="templates">
                                Templates
                            </SelectItem>
                            <SelectItem value="blogs">
                                Blogs
                            </SelectItem>
                        </SelectContent>
                    </Select>
                    {/* <AdvancedSearchModal onFiltersChange={handleFiltersChange} showIdFilter={true} /> */}
                    <Button onClick={handleSearch}>Search</Button>
                </div>
            </div>
            </div>
        </div>
    );
}