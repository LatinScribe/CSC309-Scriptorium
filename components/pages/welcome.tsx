import { SessionContext } from "@/contexts/session";
import React, { useContext, useEffect, useState } from "react";
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
import { fetchBlogPost, fetchTemplate } from "@/utils/dataInterface";
import { Filters, User } from "@/utils/types";
import { toast } from "sonner";
import { TypeAnimation } from 'react-type-animation';
import { useRouter } from "next/router";
import Link from 'next/link';
import { useReward } from "react-rewards";
import { UserIcon } from "lucide-react";
import UserCard from "../usercard";

interface ContentCardProps {
    user: User;
    title: string;
    content: string;
    tags: string[];
}

function ContentCard({ user, title, content, tags }: ContentCardProps) {
    return (
        <div className="flex flex-col gap-2 p-4 border border-gray-300 rounded-lg w-full md:max-w-[33%]">
            <div className="text-lg font-semibold truncate">{title}</div>
            <div className="text-gray-500 truncate">{content}</div>
            <div className="flex gap-2 items-center flex-wrap">
                <div className="text-gray-500">Tags:</div>
                {tags.map((tag) => (
                    <div key={tag} className="text-gray-500 bg-secondary rounded-full px-3 py-1">{tag}</div>
                ))}
            </div>
            <div className="flex gap-1 items-center">
                <UserIcon className="h-4 w-4" />
                <UserCard user={user} />
            </div>
        </div>
    );
}

export default function WelcomePage() {
    const { session } = useContext(SessionContext);
    const [searchCategory, setSearchCategory] = useState<string>("");
    const [filters, setFilters] = useState<Filters>({});
    const [featuredTemplates, setFeaturedTemplates] = useState<ContentCardProps[]>([]);
    const [featuredBlogs, setFeaturedBlogs] = useState<ContentCardProps[]>([]);
    const router = useRouter();

    const featuredTemplatesIds = [1, 1, 29];
    const featuredBlogsIds = [1, 1, 1];

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

    useEffect(() => {
        const fetchFeaturedTemplates = async () => {
            try {
                const templates = await Promise.all(
                    featuredTemplatesIds.map(async (id) => {
                        const template = await fetchTemplate(id);
                        return {
                            user: template.author,
                            title: template.title,
                            content: template.explanation || '',
                            tags: template.tags,
                        };
                    })
                );
                setFeaturedTemplates(templates);
            } catch (error) {
                toast.error("Failed to fetch featured templates");
            }
        };
        const fetchFeaturedBlogs = async () => {
            const blogs = await Promise.all(
                featuredBlogsIds.map(async (id) => {
                    const blog = await fetchBlogPost(id);
                    return {
                        user: blog.author,
                        title: blog.title,
                        content: blog.content,
                        tags: blog.tags,
                    };
                })
            );
            setFeaturedBlogs(blogs);
        }

        fetchFeaturedTemplates();
        fetchFeaturedBlogs();
    }, []);


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
            <div className="flex flex-col gap-5 items-center container">
                <div className="text-2xl">Featured Templates</div>
                <div className="flex flex-col gap-3 md:flex-row md:gap-5 justify-center w-full">
                    {featuredTemplates.map((template, index) => (
                        <ContentCard key={index} {...template} />
                    ))}
                </div>
            </div>
            <div className="flex flex-col gap-5 items-center container">
                <div className="text-2xl">Featured Blogs</div>
                <div className="flex flex-col gap-3 md:flex-row md:gap-5 justify-center w-full">
                    {featuredBlogs.map((blog, index) => (
                        <ContentCard key={index} {...blog} />
                    ))}
                </div>
            </div>
        </div>
    );
}