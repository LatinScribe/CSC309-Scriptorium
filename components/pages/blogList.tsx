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
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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

export default function BlogListPage() {
    // const { session } = useContext(SessionContext);
    const [inputValue, setInputValue] = useState<string>(""); // Local input state
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [blogs, setBlogs] = useState<BlogPost[]>([]);     
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);
    const [pageCount, setPageCount] = useState(1);
    const [sortOption, setSortOption] = useState("mostValuable"); // Default sort by most upvotes

    const router = useRouter();
    const { search } = router.query;
    // const postId = id ? Number(id) : null;
    // const searchQuery = router.query.search ? router.query.search : null;


    // useEffect(() => {
    //     if (search) {
    //         setSearchQuery(search as string);
    //         handleSearch();
    //     }
    //     // Initialize state from URL query params
    //     setSortOption((sortOption as string) || "mostValuable");
    //     // setCurrentPage(Number(page) || 1);
    // }, [search, sortOption]);

    useEffect(() => {
        if (search) {   // set searchQuery state
            setSearchQuery(search as string);
        }
        setSortOption((sortOption as string) || "mostValuable");
    }, [search, sortOption]);
    
    useEffect(() => {   
        if (searchQuery) {  // once searchQuery state is updated, get search results
            handleSearch();
        }
    }, [searchQuery]);
    

    // useEffect(() => {
    //     // Fetch blogs when searchQuery or sortOption changes
    //     if (searchQuery || sortOption) {
    //         fetchAndSetBlogs(searchQuery);
    //     }
    // }, [searchQuery, sortOption]);

    const fetchAndSetBlogs = async (queryToSearch: string = searchQuery) => {
        try {
            // Fetch the blogs based on the search query and sort option
            const response = await fetchBlogs(searchQuery, sortOption, currentPage, pageSize);
            setBlogs(response.blogPosts);       // returned blog posts are stored in the blogs state 
            setPageCount(response.totalPages);  // page count is updated based on totalPages
        } catch (error) {
            console.error("Search failed:", error);
            toast.error("Failed to fetch blogs.");
        }

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
        router.replace({ pathname: "/blogs", query: newQuery }, undefined, {
            shallow: true,
        });
    };

    const handleSearch = () => {
        setSearchQuery(inputValue);
        setCurrentPage(1); // Reset to first page when searching
        fetchAndSetBlogs(searchQuery);
        updateUrl({ search: searchQuery, sort: sortOption, page: 1 });
    };

    const handleSortChange = (newSort: string) => {
        setSortOption(newSort);
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
                    <div>
                        <label htmlFor="sortOption" className="mr-2">Sort By:</label>
                        <select
                            id="sortOption"
                            value={sortOption}
                            onChange={(e) => handleSortChange(e.target.value)}
                            className="border p-2"
                        >
                            <option value="mostUpvoted">Most Upvoted</option>
                            <option value="mostControversial">Most Downvoted</option>
                            <option value="createdAt">Newest</option>
                        </select>
                    </div>
                </div>
                <div className="flex flex-col gap-5">
                    {blogs?.length > 0 ? (
                        blogs.map((blog) => (
                            <div key={blog.id} className="blog-post-card" onClick={() => handlePostClick(blog.id)}>
                                <div className="cursor-pointer p-4 border border-gray-300 rounded-lg">
                                    <h2 className="text-xl font-bold">{blog.title}</h2>
                                    <p className="text-sm text-gray-600">{blog.description}</p>
                                    <p className="text-sm text-gray-400">By {blog.author.username}</p>
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
                                            // Update the current page and fetch blogs for that page
                                            setCurrentPage(index + 1); // Update the state for the current page
                                            fetchAndSetBlogs(); // Call the function to fetch blogs with the updated currentPage
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
