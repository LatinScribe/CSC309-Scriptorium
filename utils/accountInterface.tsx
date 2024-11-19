import { API_URL } from "./dataInterface";
import { User, Session } from "./types";

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

export async function register(username: string, firstName: string, lastName:string, password: string, email:string, avatar: string, phoneNumber: string): Promise<string> {
    try {
        const role = "USER"
        const response = await fetch(`${API_URL}/api/accounts/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ username, password, firstName, lastName, role, email, avatar, phoneNumber}),
        });
        // currently using backend for input checking!
        const responseData = await response.json();
        console.log(responseData);
        if (response.status !== 200) {
            throw new Error(responseData.error || "Unspecified error occured");
        }
        return responseData.username;
    } catch (error) {
        console.error("An error occurred during user register:", error);
        throw error;
    }
}

export async function registerADMIN(username: string, firstName: string, lastName:string, password: string, email:string, avatar: string, phoneNumber: string, role: string, accessToken: string, refreshToken: string): Promise<string> {
    try {
        const response = await fetch(`${API_URL}/api/admin/admin_register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x_refreshToken": refreshToken,
                Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ username, password, firstName, lastName, role, email, avatar, phoneNumber}),
        });
        // currently using backend for input checking!
        const responseData = await response.json();
        console.log(responseData);
        if (response.status !== 200) {
            throw new Error(responseData.error || "Unspecified error occured");
        }
        return responseData.username;
    } catch (error) {
        console.error("An error occurred during ADMIN user register:", error);
        throw error;
    }
}

export async function getProfile(accessToken: string, refreshToken: string): Promise<User> {
    try {
        const response = await fetch(`${API_URL}/api/accounts/profile`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "x_refreshToken": refreshToken,
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

export async function getProfileADMIN(accessToken: string, refreshToken: string, username: string): Promise<User> {
    try {
        const response = await fetch(`${API_URL}/api/accounts/profile`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "x_refreshToken": refreshToken,
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
