import { Session, User, Template, BlogPost, Comment, Report } from "./types";

const API_URL = "http://localhost:3000";

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
        return responseData;
    } catch (error) {
        console.error("An error occurred during login:", error);
        throw error;
    }
}

export async function fetchTemplates(): Promise<Template[]> {
    const response = await fetch(`${API_URL}/api/templates?page=1&pageSize=10`);
    return await response.json();
}