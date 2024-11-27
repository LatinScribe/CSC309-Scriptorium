import { useState, useEffect, useContext } from "react";
import { useRouter } from "next/router";
import { toast } from "sonner";
import { BlogPost } from "@/utils/types";
import { fetchBlogs } from "@/utils/dataInterface";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Input } from "../ui/input";

import { Textarea } from "../ui/textarea";
import {
    AlertDialog,
    AlertDialogTrigger,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogFooter,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogAction,
    AlertDialogCancel,
  } from "../ui/alert-dialog";
  import { SessionContext } from "@/contexts/session";
import { Separator } from "../ui/separator";

export default function BlogListPage() {
    const { session } = useContext(SessionContext);
    const [inputValue, setInputValue] = useState<string>(""); // Local input state
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [blogs, setBlogs] = useState<BlogPost[]>([]);     

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);
    const [pageCount, setPageCount] = useState(1);

    const [sortOption, setSortOption] = useState("mostValuable"); // Default sort by most upvotes

    const router = useRouter();
    
    
    useEffect(() => {
        if (!router.isReady) return;
        const { search, sort, page } = router.query;

        // initialize state from URL query params
        if (search) setSearchQuery(search as string);
        if (sort) setSortOption(sort as string);
        if (page) setCurrentPage(Number(page));
        
        fetchAndSetBlogs();
        
        
    }, [router.query]);

    useEffect(() => {
        // This effect handles URL updates for the parameters
        if (router.isReady) {
            updateUrl({ search: searchQuery, sort: sortOption, page: currentPage });
        }
    }, [searchQuery, sortOption, currentPage]);

    useEffect(() => {
        // updateUrl({ search: searchQuery, sort: sortOption, page: 1 });
        fetchAndSetBlogs();
    }, [searchQuery, currentPage, sortOption]);
    
    // useEffect(() => {   
    //     if (searchQuery) {  // once searchQuery state is updated, get search results
    //         handleSearch();
    //     }
    // }, [searchQuery]);
    

    const fetchAndSetBlogs = async () => {
        try {
            // Fetch the blogs based on the search query and sort option
            const response = await fetchBlogs(searchQuery, sortOption, currentPage, pageSize, session);
            setBlogs(response.blogPosts);       // returned blog posts are stored in the blogs state 
            setPageCount(response.totalPages);  // page count is updated based on totalPages
        } catch (error) {
            console.error("Search failed:", error);
            toast.error("Failed to fetch blogs.");
        }
        console.log("fetchAndSetBlogs", searchQuery, sortOption);
        console.log(blogs);

        // const query: { [key: string]: string } = {};
        // if (searchQuery) query.query = searchQuery;
        // if (sortOption) query.sort = sortOption;

        // let search = searchQuery;
        // router.push({           // update url
        //     pathname: "/blogs",
        //     query: { search },
        // });
    };
    const updateUrl = (queryUpdates: { [key: string]: string | number }) => {
        const newQuery = {
            search: searchQuery || undefined,
            sort: sortOption || undefined,
            page: currentPage || undefined,
            ...queryUpdates,
        };
        router.push({ pathname: "/blogs", query: newQuery }, undefined, {
            shallow: true,
        });
    };

    const handleSearch = () => {
        setSearchQuery(inputValue);
        setCurrentPage(1); // Reset to first page 
        // fetchAndSetBlogs(searchQuery); 
    };

    const handleSortChange = (newSort: string) => {
        setSortOption(newSort);
        setCurrentPage(1);
        updateUrl({ sort: newSort, page: 1 });
    };

    const handlePostClick = (id: number) => {
        // navigate to blog post page
        router.push({
            pathname: "/post",
            query: { id },
        });
    };


    const handlePaginationClick = (page: number) => {
        setCurrentPage(page);
        updateUrl({page});
    };
  
    return (
        <div className="flex justify-center">
            <div className="flex flex-col justify-center container pt-10 px-5 gap-5">
                <div className="text-2xl">Search Blogs</div>
                <div className="flex justify-between flex-wrap">
                    <div className="flex gap-3 pb-3 flex-wrap">
                        <Input
                            placeholder="Search"
                            className="w-36 md:w-48 lg:w-96 xl:w-96"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}        //update local input state
                            // searchQuery state changes here:
                        />                                                          
                        <Button onClick={handleSearch}>Search</Button>            
                    </div>
                    <div className="flex items-center space-x-6">
                        <label 
                            htmlFor="sortOption" 
                            className="text-sm font-medium whitespace-nowrap"
                        >
                            Sort By:
                        </label>
                        <Select
                            value={sortOption}
                            onValueChange={(value: string) => handleSortChange(value)}
                        >
                            <SelectTrigger>
                                <SelectValue>{ 
                                    sortOption === 'mostUpvoted' ? 'Most Upvoted' :
                                    sortOption === 'mostControversial' ? 'Most Downvoted' :
                                    sortOption === 'createdAt' ? 'Newest' : 'Select Sort'
                                }</SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="mostUpvoted">Most Upvoted</SelectItem>
                                <SelectItem value="mostControversial">Most Downvoted</SelectItem>
                                <SelectItem value="createdAt">Newest</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="flex flex-col gap-5">
                    {blogs?.length > 0 ? (
                        blogs.map((blog) => (
                            <div key={'b' + blog.id} className="blog-post-card" onClick={() => handlePostClick(blog.id)}>
                                <div className="cursor-pointer p-4 border rounded-lg flex flex-col gap-2">
                                    <h2 className="text-xl font-bold truncate">{blog.title}</h2>
                                    <p className="text-sm text-gray-600 truncate">{blog.description}</p>
                                    <div className="flex flex-wrap items-center gap-2">
                                        {blog.tags && blog.tags?.map((tag, index) => (
                                            <span
                                                key={index}
                                                className="px-2 py-1 text-sm rounded-md
                                                    bg-gray-200 text-gray-800 
                                                    dark:bg-gray-800 dark:text-gray-100"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="text-sm text-gray-500">By {blog.author.username}</div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div>No blogs found for "{searchQuery}".</div>
                    )}
                </div>
                <div className="flex justify-center mt-5">
                    <Pagination>
                        <PaginationContent className="flex flex-row justify-center gap-2">
                        <PaginationItem>
                            <PaginationPrevious
                                className={`${
                                    currentPage <= 1 ? "opacity-50 cursor-not-allowed" : ""
                                }`}
                                // disabled={currentPage <= 1}
                                onClick={() => {
                                    if (currentPage > 1) {
                                        const newPage = currentPage - 1;
                                        setCurrentPage(newPage); // Update the current page state
                                        fetchAndSetBlogs();     // Fetch and set blogs for the updated page
                                    }
                                }}
                            >
                                Previous
                            </PaginationPrevious>
                        </PaginationItem>

                            {Array.from({ length: pageCount }, (_, index) => (
                                <PaginationItem key={index}>
                                    <PaginationLink
                                        isActive={currentPage === index + 1}
                                        onClick={() => {
                                            // update current page and fetch blogs for that page
                                            setCurrentPage(index + 1); 
                                            fetchAndSetBlogs();
                                        }}
                                    >
                                        {index + 1}
                                    </PaginationLink>
                                </PaginationItem>
                            ))}

                            <PaginationItem>
                                <PaginationNext
                                    className={`${
                                        currentPage >= pageCount ? "opacity-50 cursor-not-allowed" : ""
                                    }`}
                                    // disabled={currentPage >= pageCount}
                                    onClick={() => {
                                        if (currentPage < pageCount) {
                                            const newPage = currentPage + 1;
                                            setCurrentPage(newPage); // update the current page state
                                            fetchAndSetBlogs();
                                        }
                                    }}
                                >
                                    Next
                                </PaginationNext>
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>
            </div>
        </div>
    );
}
