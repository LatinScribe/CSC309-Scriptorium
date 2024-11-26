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
import { Pencil2Icon } from "@radix-ui/react-icons";

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
    

    const { session } = useContext(SessionContext);
    const router = useRouter();

    useEffect(() => {

        if (!session || !session?.accessToken || !session?.refreshToken) {
            router.replace("/login"); 
        }
    }, []); 

    if (!session || !session?.accessToken || !session?.refreshToken) {
        return null; // Don't render the page while redirecting
    }


    // Fetch user's blog posts on component mount
    useEffect(() => {
        if (session && session.accessToken && session.refreshToken) {
            const fetchUserPosts = async () => {
                try{
                    const blogs = await fetchUserBlogs(session, session.user.username); 
                    setBlogs(blogs);

                } catch (error) {
                    console.error("Failed to fetch template:", error);
                    toast.error("Failed to fetch your blog posts.");
                }
            }
            fetchUserPosts();
            
            // fetchUserBlogs(session)
            //     .then((data) => {
            //         setBlogs(data);
            //     })
            //     .catch((error) => {
            //         console.error("Failed to fetch blogs:", error);
            //         toast.error("Failed to fetch your blog posts.");
            //     });
        } else {
            router.push("/login");
        }
        
    }, [session, router]);

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
    const handleEditBlog = (blogId: number) => {
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

        
        //     setNewBlog({
        //         title: blogToEdit.title,
        //         description: blogToEdit.description,
        //         tags: blogToEdit.tags || [],  
        //         codeTemplates: blogToEdit.templates || [],
        //     });
        // }
    };

    // useEffect(() => {
    //     const loadBlogForEditing = async (blogId: number) => {
    //       const blog = await fetchBlogPost(blogId);  // Fetch the blog data, including tags
    //       setNewBlog({
    //         ...blog,
    //         tags: Array.isArray(blog.tags) ? blog.tags : [], // Ensure it's an array
    //       });
    //     };
      
    //     if (newBlog && newBlog.id) {
    //       loadBlogForEditing(newBlog.id);
    //     }
    // }, [newBlog?.id]);

    // Handle updating a blog post
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
                setNewBlog({ title: "", description: "", tags: [], codeTemplates: [] });  // Reset selected templates
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
                                        placeholder="Add a tag"
                                        value={tagInput}
                                        onChange={(e) => setTagInput(e.target.value)}
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
                                                className="p-3 cursor-pointer hover:bg-gray-100"
                                            >
                                                <span> {template.title} </span>
                                                <span className="text-sm text-gray-500">by {template.author?.username}</span>
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
                                        placeholder="Add a tag"
                                        value={tagInput}
                                        onChange={(e) => setTagInput(e.target.value)}
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
                                                className="p-3 cursor-pointer hover:bg-gray-100"
                                            >
                                                <span>{template.title}</span>
                                                <span className="text-sm text-gray-500">by {template.author?.username}</span>
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
                <div className="grid gap-4">
                    {(Array.isArray(blogs) && blogs.length === 0) ? (
                        <p className="text-gray-600">No blog posts available. Please create one!</p>
                    ) : (
                        blogs && blogs.map((blog: BlogPost) => (
                            <div key={blog.id} className="bg-background p-6 shadow rounded">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h2 className="text-3xl font-bold">{blog.title}</h2>
                                        <p className="text-sm text-gray-500">
                                            Published on {new Date(blog.createdAt).toLocaleDateString()}
                                        </p>
                                        {/* Display tags */}
                                        <div className="flex flex-wrap gap-2">
                                            {blog.tags && blog.tags?.map((tag, index) => (
                                                <span
                                                key={index}
                                                className="px-2 py-1 text-sm rounded-md mt-4
                                                    bg-gray-200 text-gray-800 
                                                    dark:bg-gray-800 dark:text-gray-100"
                                                >
                                                {tag}
                                                </span>
                                            ))}
                                            </div>
                                    </div>
                                    <div className="flex space-x-4">
                                        <Button onClick={() => handleEditBlog(blog.id)}>
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
                                <p className="text-gray-500 mt-2">{blog.description}</p>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
