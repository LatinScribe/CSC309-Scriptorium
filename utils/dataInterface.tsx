import { Session, PaginationInfo, Filters, Template, BlogPost, Comment, Report } from "./types";

//const nodeEnv: string = (process.env.NODE_ENV as string);
//export const API_URL = process.env.API_URL;
//export const API_URL = nodeEnv
export const API_URL = "http://localhost:3000";

export async function fetchTemplates(filters: Filters, page: number, pageSize: number): Promise<{ templates: Template[], pagination: PaginationInfo }> {
    try {
        const queryParams = new URLSearchParams();
        queryParams.append("page", page.toString());
        queryParams.append("pageSize", pageSize.toString());
        if (filters.title) {
            queryParams.append("title", filters.title);
        }
        if (filters.content) {
            queryParams.append("content", filters.content);
        }
        if (filters.tags) {
            queryParams.append("tags", filters.tags.join(","));
        }
        if (filters.ids) {
            queryParams.append("ids", filters.ids.join(","));
        }
        if (filters.author) {
            queryParams.append("author", filters.author);
        }
        const response = await fetch(`${API_URL}/api/templates/?${queryParams.toString()}`);
        const responseData = await response.json();
        if (response.status !== 200) {
            // CHECKING FOR TOKEN ERROR STARTS HERE
            if (response.status === 401 && responseData.error === "Token Error") {
                throw new Error("Token Error");
            }
            // CHECKING FOR TOKEN ERROR ENDS HERE
            throw new Error(responseData.error || "Unspecified error occured");
        }
        responseData.templates = responseData.templates.map((template: any) => {
            if (template.tags === '') {
                template.tags = [];
            } else {
                template.tags = template.tags.split(",");
            }
            return template;
        });
        return {
            templates: responseData.templates,
            pagination: responseData.pagination,
        };
    } catch (error) {
        console.error("An error occurred while fetching templates:", error);
        throw error;
    }
}

export async function fetchTemplate(id: number): Promise<Template> {
    try {
        const response = await fetch(`${API_URL}/api/templates/content?id=${id}`);
        const responseData = await response.json();
        if (response.status !== 200) {
            // CHECKING FOR TOKEN ERROR STARTS HERE
            if (response.status === 401 && responseData.error === "Token Error") {
                throw new Error("Token Error");
            }
            // CHECKING FOR TOKEN ERROR ENDS HERE
            throw new Error(responseData.error || "Unspecified error occured");
        }
        if (responseData.tags === '') {
            responseData.tags = [];
        } else {
            responseData.tags = responseData.tags.split(",");
        }
        return await responseData;
    } catch (error) {
        console.error("An error occurred while fetching template:", error);
        throw error;
    }
}

export async function updateTemplate(template: Template, session: Session): Promise<Template> {
    try {
        console.log(template);
        const response = await fetch(`${API_URL}/api/templates/`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session.accessToken}`,
            },
            body: JSON.stringify(template),
        });
        const responseData = await response.json();
        if (response.status !== 200) {
            // CHECKING FOR TOKEN ERROR STARTS HERE
            if (response.status === 401 && responseData.error === "Token Error") {
                throw new Error("Token Error");
            }
            // CHECKING FOR TOKEN ERROR ENDS HERE
            throw new Error(responseData.error || "Unspecified error occured");
        }
        responseData.tags = responseData.tags.split(",");
        return responseData;
    } catch (error) {
        console.error("An error occurred while updating template:", error);
        throw error;
    }
}

export async function createTemplate(title: string, session: Session, tags?: string[], language?: string, explanation?: string, forkedSourceId?: number): Promise<Template> {
    try {
        if (!forkedSourceId && !language) {
            throw new Error("Language is required for new templates");
        }
        const response = await fetch(`${API_URL}/api/templates/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session.accessToken}`,
            },
            body: JSON.stringify({ title, tags, language, explanation, forkedSourceId }),
        });
        const responseData = await response.json();
        if (response.status !== 201) {
            // CHECKING FOR TOKEN ERROR STARTS HERE
            if (response.status === 401 && responseData.error === "Token Error") {
                throw new Error("Token Error");
            }
            // CHECKING FOR TOKEN ERROR ENDS HERE
            throw new Error(responseData.error || "Unspecified error occured");
        }
        responseData.tags = responseData.tags.split(",");
        return responseData;
    } catch (error) {
        console.error("An error occurred while creating template:", error);
        throw error;
    }
}

export async function deleteTemplate(id: number, session: Session): Promise<void> {
    console.log(id);
    try {
        const response = await fetch(`${API_URL}/api/templates/`, {
            method: "DELETE",
            headers: {
            Authorization: `Bearer ${session.accessToken}`,
            "Content-Type": "application/json",
            },
            body: JSON.stringify({ id }),
        });
        const responseData = await response.json();
        if (response.status !== 200) {
            // CHECKING FOR TOKEN ERROR STARTS HERE
            if (response.status === 401 && responseData.error === "Token Error") {
                throw new Error("Token Error");
            }
            // CHECKING FOR TOKEN ERROR ENDS HERE
            throw new Error(responseData.error || "Unspecified error occured");
        }
    } catch (error) {
        console.error("An error occurred while deleting template:", error);
        throw error;
    }
}

export async function executeCode(language: string, code: string, input: string[]): Promise<{ output: string, error: string }> {
    try {
        const response = await fetch(`${API_URL}/api/templates/execute`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ language, code, input }),
        });
        const responseData = await response.json();
        if (response.status !== 200) {
            // CHECKING FOR TOKEN ERROR STARTS HERE
            if (response.status === 401 && responseData.error === "Token Error") {
                throw new Error("Token Error");
            }
            // CHECKING FOR TOKEN ERROR ENDS HERE
            throw new Error(responseData.error || "Unspecified error occured");
        }
        return responseData;
    } catch (error) {
        console.error("An error occurred while executing code:", error);
        throw error;
    }
}



export async function searchTemplatesByTitle(title: string) {
    const response = await fetch(`${API_URL}/api/templates/?page=1&pageSize=10&title=${title}`, {
        method: "GET",
    });
    const data = await response.json();
    return data.templates;
}

export async function fetchUserBlogs(session: Session, author: string, currentPage: number, pageSize: number) {
    const response = await fetch(`${API_URL}/api/blogs?author=${author}&page=${currentPage}&pageSize=${pageSize}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.accessToken}`,
            x_refreshToken: session.refreshToken,
        },
    });

    return await response.json();
}

export async function fetchBlogs(searchTerm: string, sortOption: string, currentPage: number = 1, 
    pageSize: number = 5, session: Session | null) {
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
    };
    if (session) {
        headers["Authorization"] = `Bearer ${session.accessToken}`;
        headers["x_refreshToken"] = session.refreshToken;
    }

    const response = await fetch(`${API_URL}/api/blogs?search=${searchTerm}&sort=${sortOption}&page=${currentPage}&pageSize=${pageSize}`, {
        method: "GET",
        headers,

    });
    
    return await response.json();
}

export async function fetchBlogPost(id: number) {
    const response = await fetch(`${API_URL}/api/blogs/post?id=${id}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            // "Authorization": `Bearer ${session?.accessToken}`,
            // x_refreshToken: session?.refreshToken,
        },

    });
    const data = await response.json();
        if (data.codeTemplates && data.codeTemplates.length > 0) {
            data.codeTemplates = data.codeTemplates.map((template: any) => {
                if (template.tags && template.tags !== '') {
                    template.tags = template.tags.split(',').map((tag: string) => tag.trim());
                } else {
                    template.tags = [];
                }
                return template;
            });
    }
    return data;
}

export async function createBlog(title: string, 
    description: string, 
    tags: string, 
    codeTemplates: { id: number; }[], 
    session: Session) {
    const response = await fetch(`${API_URL}/api/blogs`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.accessToken}`,
            x_refreshToken: session.refreshToken,
        },
        body: JSON.stringify({ title, description, tags, codeTemplates }),
    });
    return await response.json();
}

export async function deleteBlog(id: number, session: Session) {
    const response = await fetch(`${API_URL}/api/blogs/post?id=${id}`, {
        method: "DELETE",
        headers: {
            "Authorization": `Bearer ${session.accessToken}`,
            x_refreshToken: session.refreshToken,
        },
    });
    return await response.json();
}

export async function updateBlog(
    id: number, 
    title: string,
    description: string, 
    tags: string, 
    codeTemplates: { id: number; }[], 
    session: Session) {
    const response = await fetch(`${API_URL}/api/blogs/post?id=${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.accessToken}`,
            x_refreshToken: session.refreshToken,
        },
        body: JSON.stringify({ title, description, tags, codeTemplates }),
    });
    return await response.json();
}


export async function fetchComments(blogId: number, sortOption: string, pageNum: number, session: Session | null) {
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
    };

    if (session) {
        headers["Authorization"] = `Bearer ${session.accessToken}`;
        headers["x_refreshToken"] = session.refreshToken;
    }

    const response = await fetch(`${API_URL}/api/blogs/comments?blogPostId=${blogId}&sortOption=${sortOption}&pageNum=${pageNum}`, 
    {
        method: "GET",
        headers,

    });
    return await response.json();
}

export async function fetchCommentbyId(id: number, includeReplies: boolean, session: Session) {
    const response = 
        await fetch(`${API_URL}/api/blogs/comments/post?commentId=${id}&IncludeReplies=${includeReplies}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session?.accessToken}`,
            x_refreshToken: session?.refreshToken,
        },
    });
    return await response.json();
}

export async function postComment(blogId: number, content: string, parentCommentId: null | number, session: Session): Promise<Comment>  {
    const response = await fetch(`${API_URL}/api/blogs/comments?blogPostId=${blogId}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.accessToken}`,
            x_refreshToken: session.refreshToken,
        },
        body: JSON.stringify({ content, parentCommentId }),

    });
    return await response.json();
}

export async function rateBlog(id: number, action: string, session: Session)  {
    const response = await fetch(`${API_URL}/api/blogs/rating?id=${id}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.accessToken}`,
            x_refreshToken: session.refreshToken,
        },
        body: JSON.stringify({ action }),

    });
    return await response.json();
}

export async function reportBlog(blogPostId: number, explanation: string, session: Session)  {
    const response = await fetch(`${API_URL}/api/moderation/reports`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.accessToken}`,
            x_refreshToken: session.refreshToken,
        },
        body: JSON.stringify({
            explanation,
            blogPostId: Number(blogPostId), 
        }),

    });
    return await response.json();
}

export async function rateComment(id: number, action: string, session: Session)  {
    const response = await fetch(`${API_URL}/api/blogs/comments/post?commentId=${id}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.accessToken}`,
            x_refreshToken: session.refreshToken,
        },
        body: JSON.stringify({ action }),

    });
    return await response.json();
}

export async function reportComment(commentId: number, explanation: string, session: Session)  {
    const response = await fetch(`${API_URL}/api/moderation/reports`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.accessToken}`,
            x_refreshToken: session.refreshToken,
        },
        body: JSON.stringify({ commentId, explanation }),

    });
    return await response.json();
}

export async function getBlogByTemplate(templateId: number) {
    console.log(templateId);
    try {
        const response = await fetch(`${API_URL}/api/blogs/byTemplate?templateId=${templateId}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });
        const data = await response.json();
        console.log(data);
        if (!Array.isArray(data)) {
            return [];
        }
        return data;
    } catch (error) {
        console.error("An error occurred while fetching blog by template:", error);
        throw error;
    }
}

// =========== MODERATION ===========
export async function fetchReportedContent(searchTerm: string, sortOption: string, currentPage: number = 1, 
    pageSize: number = 5, session: Session) {
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
    };
    if (session) {
        headers["Authorization"] = `Bearer ${session.accessToken}`;
        headers["x_refreshToken"] = session.refreshToken;
    }

    const response = await fetch(`${API_URL}/api/moderation/reportedContent?search=${searchTerm}&sort=${sortOption}&page=${currentPage}&pageSize=${pageSize}`, {
        method: "GET",
        headers,

    });
    
    return await response.json();
}
