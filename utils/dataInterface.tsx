import { Session, PaginationInfo, Filters, User, Template, BlogPost, Comment, Report } from "./types";

const API_URL = "http://localhost:3000";

export async function getProfile(accessToken: string): Promise<User> {
    try {
        const response = await fetch(`${API_URL}/api/accounts/profile`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        const responseData = await response.json();
        console.log(responseData);
        if (response.status !== 200) {
            throw new Error(responseData.error || "Unspecified error occured");
        }
        return responseData['user'];
    } catch (error) {
        console.error("An error occurred while fetching profile:", error);
        throw error;
    }
}

export async function login(username: string, password: string): Promise<Session> {
    try {
        const response = await fetch(`${API_URL}/api/accounts/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ username, password }),
        });
        const responseData = await response.json();
        console.log(responseData);
        if (response.status !== 200) {
            throw new Error(responseData.error || "Unspecified error occured");
        }
        responseData.user = await getProfile(responseData.accessToken);
        return responseData;
    } catch (error) {
        console.error("An error occurred during login:", error);
        throw error;
    }
}

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
        const response = await fetch(`${API_URL}/api/templates/?${queryParams.toString()}`);
        const responseData = await response.json();
        if (response.status !== 200) {
            throw new Error(responseData.error || "Unspecified error occured");
        }
        responseData.templates = responseData.templates.map((template: any) => {
            template.tags = template.tags.split(",");
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
            throw new Error(responseData.error || "Unspecified error occured");
        }
        responseData.tags = responseData.tags.split(",");
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
            throw new Error(responseData.error || "Unspecified error occured");
        }
    } catch (error) {
        console.error("An error occurred while deleting template:", error);
        throw error;
    }
}