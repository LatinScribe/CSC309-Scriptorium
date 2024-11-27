import { SessionContext } from "@/contexts/session";
import React, { useContext, useState, useEffect } from "react";
import { createBlog, deleteBlog, updateBlog, searchTemplatesByTitle, fetchUserBlogs, fetchBlogPost } from "@/utils/dataInterface";
import { useRouter } from "next/router";
import { Template, BlogPost } from '@/utils/types'; 

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
import { toast } from "sonner"
import { ExclamationTriangleIcon, Pencil2Icon } from "@radix-ui/react-icons";

export default function BlogsPage() {
    const [isCreating, setIsCreating] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [newBlog, setNewBlog] = useState<{
        title: string;
        description: string;
        tags: string[];    
        codeTemplates: Template[]; 
      }>({
        title: "",
        description: "",
        tags: [],
        codeTemplates: [],
      });
    const [currentBlog, setCurrentBlog] = useState<BlogPost | null>(null);
    const [tagInput, setTagInput] = useState("");
    const [blogs, setBlogs] = useState<BlogPost[]>([]);
    const [searchTerm, setSearchTerm] = useState("");  // For template search
    const [filteredTemplates, setFilteredTemplates] = useState([]);  // Filtered templates
    
    const [currentPage, setCurrentPage] = useState(1); 
    const [pageSize, setPageSize] = useState(5);
    const [pageCount, setPageCount] = useState(1);


    const { session } = useContext(SessionContext);
    const router = useRouter();

    useEffect(() => {

        if (!session || !session?.accessToken || !session?.refreshToken) {
            router.replace("/login"); 
        }
    }, [session, router]);

    useEffect(() => {
        if (!router.isReady) return;
        const { page } = router.query;
        if (page) setCurrentPage(Number(page));
        
        fetchAndSetUserBlogs();
    }, [router.query]);

    

    useEffect(() => {
        if (router.isReady) {
            router.push({ 
                pathname: "/my-blogs", 
                query: { page: currentPage || undefined } }, 
                undefined, 
                { shallow: true, }
            );
        }
        fetchAndSetUserBlogs();
    }, [currentPage]);

    // useEffect(() => {
    //     fetchAndSetUserBlogs();
    // }, [currentPage]);
   
    const fetchAndSetUserBlogs = async () => {
        if (session && session.accessToken && session.refreshToken) {
            const fetchUserPosts = async () => {
                try{
                    const blogsResponse = await fetchUserBlogs(session, session.user.username, currentPage, pageSize); 
                    setBlogs(blogsResponse.blogPosts);
                    setPageCount(blogsResponse.totalPages);
                } catch (error) {
                    console.error("Failed to fetch template:", error);
                    toast.error("Failed to fetch your blog posts.");
                }
            }
            fetchUserPosts();
        } else {
            router.push("/login");
        }
        
    };

    // Fetch templates when the search term changes
    useEffect(() => {
        if (searchTerm) {
            searchTemplatesByTitle(searchTerm).then((templates) => {
                setFilteredTemplates(templates);
            });
        } else {
            setFilteredTemplates([]);
        }
    }, [searchTerm]);


    const resetFields = () => {
        setNewBlog({ title: "", description: "", tags: [], codeTemplates: [] });
        setSearchTerm("");
    };

    const handleCreateBlog = () => {
        if (!session || !session.accessToken) {
            toast.error("You must be logged in to create a blog");
            return;
        }

        // validate title and description
        if (!newBlog.title.trim()) {
            toast.error("Title is required");
            return;
        }
        if (!newBlog.description.trim()) {
            toast.error("Content is required");
            return;
        }

        // Map selected templates to the format required by the API
        const formattedTemplates = newBlog.codeTemplates.map((template: Template) => ({ id: template.id }));

        createBlog(
            newBlog.title,
            newBlog.description,
            newBlog.tags.join(","),
            formattedTemplates,  
            session
        )
            .then((newPost: BlogPost) => {
                setBlogs([newPost, ...blogs]);
                setIsCreating(false);
                resetFields();
            })
            .catch(console.error);
    };

    // Handle editing a blog post
    const handleEditBlog = (blogId: number, isHidden: boolean) => {
        if (!isHidden) {
            const loadBlogForEditing = async () => {
                const blog = await fetchBlogPost(blogId);  // Fetch the blog data
    
                setNewBlog({
                    title: blog.title,
                    description: blog.description,
                    tags: Array.isArray(blog.tags) ? blog.tags : [], 
                    codeTemplates: blog.codeTemplates || [],
                });
                setIsEditing(true);
                setCurrentBlog(blog); 
            };
            loadBlogForEditing();
        } else {
            toast.error("Post is hidden and cannot be edited.");
        }
        
    };

    const handlePrevPage = () => {
        if (currentPage > 1) {
          setCurrentPage(currentPage - 1);
          fetchAndSetUserBlogs();
        }
    };

    const handleNextPage = () => {
        if (currentPage < pageCount) {
            setCurrentPage(currentPage + 1);
            fetchAndSetUserBlogs();
        }
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        fetchAndSetUserBlogs();
    };

    // Handle updating blog post
    const handleUpdateBlog = () => {
        if (!session || !session.accessToken || !currentBlog) {
            toast.error("You must be logged in to update a blog post");
            return;
        }

        // Validate title and description
        if (!newBlog.title.trim()) {
            toast.error("Title is required");
            return;
        }
        if (!newBlog.description.trim()) {
            toast.error("Content is required");
            return;
        }

        // Map selected templates to the format required by the API
        const formattedTemplates = newBlog.codeTemplates.map((template: Template) => ({ id: template.id }));
        console.log(newBlog);
        updateBlog(
            currentBlog.id,
            newBlog.title,
            newBlog.description,
            newBlog.tags.join(","),
            formattedTemplates,
            session
        )
            .then((updatedPost: BlogPost) => {
                setBlogs(blogs.map((blog) => (blog.id === updatedPost.id ? updatedPost : blog)));
                setIsEditing(false);
                setCurrentBlog(null);
                resetFields();
            })
            .catch(console.error);

        
    };

    // Handle adding a tag
    const handleAddTag = () => {
        if (tagInput.trim() && !newBlog.tags.includes(tagInput)) {
            setNewBlog({ ...newBlog, tags: [...newBlog.tags, tagInput.trim()] });
            setTagInput("");
        }
    };

    // Handle removing a tag
    const handleRemoveTag = (tag: string) => {
        setNewBlog({ ...newBlog, tags: newBlog.tags.filter((t) => t !== tag) });
    };

    // Handle adding a template
    const handleAddTemplate = (template: Template) => {
        if (!newBlog.codeTemplates.some((t: Template) => t.id === template.id)) {
            setNewBlog(prev => ({
                ...prev,
                codeTemplates: [...prev.codeTemplates, template],
            }));
        }
        setSearchTerm('');  // clear to hide dropdown

    };

    // Handle removing a template
    const handleRemoveTemplate = (templateId: number) => {
        setNewBlog({
            ...newBlog,
            codeTemplates: newBlog.codeTemplates.filter((template: Template) => template.id !== templateId),
        });
    };

    // Handle deleting a blog post
    const handleDeleteBlog = (blogId: number) => {
        if (!session || !session.accessToken) {
            alert("You must be logged in to delete a blog.");
            return;
        }

        const deletePost = async () => {
            try {
                await deleteBlog(blogId, session);
                setBlogs(blogs.filter((blog: BlogPost) => blog.id !== blogId));
                // router.push("/myblogs");
                toast.success("Blog post deleted successfully");
            } catch (error) {
                console.error("Failed to delete blog post:", error);
                // setError("Failed to delete blog post: " + (error as Error).message);
            }
        };
        deletePost();

    };

    const handleCancel = () => {
        resetFields(); 
        setIsCreating(false); 
        setIsEditing(false); 
    };

    return (
        <div className="p-6 bg-background min-h-screen m-10">

            {/* Create New Blog */}
            {!isEditing && !isCreating && (
                <div className="mb-6">
                    <h1 className="text-2xl font-bold mb-6">Your Blog Posts</h1>
                    <Button
                        onClick={() => setIsCreating(true)}
                    >
                        <Pencil2Icon />
                        New Post
                    </Button>
                </div>)
            }

            {isCreating && (
                <div className="bg-background p-6 shadow rounded mb-6">
                    <h2 className="text-xl font-semibold mb-4">Create New Post</h2>

                    <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-8">  {/* Two-column grid */}
                        {/* Left Column (Title and Content) */}
                        <div className="flex flex-col space-y-4">
                            <Input
                                type="text"
                                placeholder="Add Title"
                                value={newBlog.title}
                                onChange={(e) => setNewBlog({ ...newBlog, title: e.target.value })}
                                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:ring-primary"
                            />
                            <Textarea
                                placeholder="Add Content"
                                value={newBlog.description}
                                onChange={(e) => setNewBlog({ ...newBlog, description: e.target.value })}
                                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:ring-primary min-h-[400px] resize-y"
                            />
                        </div>
                        {/* Right Column (Tags and Templates) */}
                        <div className="flex flex-col space-y-6">
                            {/* Tags Section */}
                            <div>
                                <h2 className="font-semibold mb-4">Add Tags</h2>
                                <div className="flex items-center space-x-2 mb-2">
                                    <Input
                                        type="text"
                                        placeholder="Add a tag (max 40 characters)"
                                        value={tagInput}
                                        onChange={(e) => {
                                            if (e.target.value.length <= 40) { //char limit
                                                setTagInput(e.target.value);
                                            }
                                        }}
                                        className="w-64 px-2 py-1"
                                        />
                                        <Button onClick={handleAddTag}> + </Button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {newBlog.tags.map((tag) => (
                                        <div
                                            key={tag}
                                            className="flex items-center space-x-2 bg-gray-200 text-gray-700 px-3 py-1 rounded-full "
                                        >
                                            <span>{tag}</span>
                                            <button
                                                onClick={() => handleRemoveTag(tag)}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Template Search Section */}
                            <div className="mb-4">
                                <h2 className="font-semibold mb-4">Link Templates</h2>
                                <Input
                                    type="text"
                                    placeholder="Search Templates"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:ring-primary"
                                />
                                {searchTerm && filteredTemplates.length > 0 && (
                                    <div className="mt-2 bg-white border rounded shadow-lg max-h-60 overflow-y-auto">
                                        {filteredTemplates.map((template: Template) => (
                                            <div
                                                key={template.id}
                                                onClick={() => handleAddTemplate(template)}
                                                className="p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 "
                                            >
                                                <span> {template.title} </span>
                                                <span className="text-sm text-gray-400">by {template.author?.username}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Display Selected Templates */}
                            <div className="mb-4">
                                {newBlog.codeTemplates.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {newBlog.codeTemplates.map((template: Template) => (
                                            <div
                                                key={template.id}
                                                className="bg-gray-200 text-gray-800 px-3 py-1 rounded-full flex items-center"
                                            >
                                                {template.title}
                                                
                                                <button
                                                    onClick={() => handleRemoveTemplate(template.id)}
                                                    className="ml-2 text-red-500 hover:text-red-700"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>          
                        
                            {/* action buttons */}
                            <div className="flex justify-left space-x-4">
                                <Button
                                    onClick={handleCancel}  variant="outline">
                                Cancel </Button>
                                <Button onClick={handleCreateBlog}>
                                    Publish
                                </Button>   
                            </div>
                        </div>
                    </div>
                </div>
            )}



            {/* Edit Blog Form */}
            {(isEditing && currentBlog) && (
                <div className="bg-background p-6 shadow rounded mb-6">
                    <h2 className="text-xl font-semibold mb-4">Edit Blog Post</h2>

                    <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-8">
                        {/* Left Column (Title and Content) */}
                        <div className="flex flex-col space-y-4">
                            <Input
                                type="text"
                                placeholder="Add Title"
                                value={newBlog.title}
                                onChange={(e) => setNewBlog({ ...newBlog, title: e.target.value })}
                                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:ring-primary"
                            />
                            <Textarea
                                placeholder="Add Content"
                                value={newBlog.description}
                                onChange={(e) => setNewBlog({ ...newBlog, description: e.target.value })}
                                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:ring-primary min-h-[400px] resize-y"
                            />
                        </div>
                        {/* Right Column (Tags and Templates) */}
                        <div className="flex flex-col space-y-6">
                            {/* Tags Section */}
                            <div>
                                <h2 className="font-semibold mb-4">Edit Tags</h2>
                                <div className="flex items-center space-x-2 mb-2">
                                    <Input
                                        type="text"
                                        placeholder="Add a tag (max 40 characters)"
                                        value={tagInput}
                                        onChange={(e) => {
                                            if (e.target.value.length <= 40) { //char limit
                                                setTagInput(e.target.value);
                                            }
                                        }}
                                        className="w-64 px-2 py-1"
                                        />
                                        <Button onClick={handleAddTag}> + </Button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {newBlog.tags.map((tag) => (    // pre-populate
                                        <div
                                            key={tag}
                                            className="flex items-center space-x-2 bg-gray-200 text-gray-700 px-3 py-1 rounded-full"
                                        >
                                            <span>{tag}</span>
                                            <button
                                                onClick={() => handleRemoveTag(tag)}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h2 className="font-semibold mb-4">Edit Templates</h2>
                                <Input
                                    type="text"
                                    placeholder="Search Templates"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:ring-primary"
                                />
                                {searchTerm && filteredTemplates.length > 0 && (
                                    <div className="mt-2 bg-white border rounded shadow-lg max-h-60 overflow-y-auto">
                                        {filteredTemplates
                                            .filter((template: Template) => !newBlog.codeTemplates.some((t) => t.id === template.id)) // Filter out already selected templates
                                            .map((template: Template) => (
                                            <div
                                                key={template.id}
                                                onClick={() => handleAddTemplate(template)} // Add template to selected list
                                                className="p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                                            >
                                                <span>{template.title}</span>
                                                <span className="text-sm text-gray-400 ml-1">by {template.author?.username}</span>
                                            </div>
                                            ))}
                                    </div>
                                )}

                                {/* Display Selected Templates */}
                                {newBlog.codeTemplates.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-4">
                                        {newBlog.codeTemplates.map((template: Template) => (
                                            <div
                                                key={template.id}
                                                className="bg-gray-200 text-gray-800 px-3 py-1 rounded-full flex items-center"
                                            >
                                                {template.title}
                                                <button
                                                    onClick={() => handleRemoveTemplate(template.id)}
                                                    className="ml-2 text-red-500 hover:text-red-700"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            
                        </div>
                        {/* Action buttons */}
                        <div className="flex justify-left space-x-4">
                            <Button onClick={handleCancel} variant="outline">Cancel</Button>
                            <Button onClick={handleUpdateBlog} >Update Post</Button>
                        </div>
                    </div>
                </div>
            )}

            
            {/* Display User's Blog Posts*/}
            {!isEditing && !isCreating && (
                <div className="grid grid-cols-1 gap-4">
                    {(Array.isArray(blogs) && blogs.length === 0) ? (
                        <p className="text-gray-600">No blog posts available. Please create one!</p>
                    ) : (
                        blogs && blogs.map((blog: BlogPost) => (
                            <div key={blog.id} className="bg-background p-6 border shadow rounded w-full max-w-full">
                                 <div className="flex flex-col sm:flex-row justify-between sm:items-center">
                                    <div className="flex-grow">
                                        <h2 className="text-2xl font-bold break-words md:max-w-[70vw] sm:max-w-[50vw] ">{blog.title}</h2>
                                        {blog.hidden && (
                                             <div className="flex items-center gap-2 p-4">
                                                <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
                                                <span className="text-red-500 p-1 rounded">Hidden</span>
                                            </div>
                                        )}
                                        {blog.flagged && (
                                            <div className="flex items-center gap-2">
                                                <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
                                                <span className="text-sm text-red-500 bg-yellow-100 p-1 rounded">Flagged</span>
                                            </div>
                                        )}
                                        <p className="text-sm text-gray-500 mb-4">
                                            Published on {new Date(blog.createdAt).toLocaleDateString()}
                                        </p>

                                        {/* Display tags */}
                                        <div className="flex flex-wrap gap-2 md:max-w-[70vw] mb-8">
                                            {blog.tags && blog.tags?.map((tag, index) => (
                                                <span
                                                key={index}
                                                className="px-2 py-1 text-xs rounded-md
                                                    bg-gray-200 text-gray-800 
                                                    dark:bg-gray-800 dark:text-gray-100
                                                    sm:px-2 sm:py-0.5 sm:text-base
                                                    "
                                                >
                                                {tag}
                                                </span>
                                            ))}
                                            </div>
                                    </div>
                                </div>
                                <p className="text-gray-500 mt-2 line-clamp-3 md:max-w-[50vw] ">{blog.description}</p>
                                <div className="mt-4 flex justify-end space-x-4">
                                    <Button onClick={() => handleEditBlog(blog.id, blog.hidden)}
                                            disabled={blog.hidden}>
                                        Edit Post
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => handleDeleteBlog(blog.id)}
                                        className="text-red-500 hover:text-red-700"
                                    >
                                        Delete
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}

                    {/* Pagination */}
                    <div className="flex justify-center mt-5">
                        <Pagination>
                        <PaginationContent className="flex flex-row justify-center gap-2">
                            <PaginationItem>
                            <PaginationPrevious
                                className={`${currentPage <= 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                onClick={handlePrevPage}
                            >
                                Previous
                            </PaginationPrevious>
                        </PaginationItem>

                            {Array.from({ length: pageCount }, (_, index) => (
                                <PaginationItem key={index}>
                                    <PaginationLink
                                        isActive={currentPage === index + 1}
                                        onClick={() => handlePageChange(index + 1)}
                                        >
                                        {index + 1}
                                    </PaginationLink>
                                </PaginationItem>
                            ))}

                            <PaginationItem>
                            <PaginationNext
                                className={`${currentPage >= pageCount ? 'opacity-50 cursor-not-allowed' : ''}`}
                                onClick={handleNextPage} 
                            >
                                Next
                            </PaginationNext>
                            </PaginationItem>
                        </PaginationContent>
                        </Pagination>
                    </div>
                    
                </div>
                
            )}
        </div>
    );
}
