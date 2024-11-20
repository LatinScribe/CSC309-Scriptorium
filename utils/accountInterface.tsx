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
        responseData.user = await getProfile(responseData.accessToken, responseData.refreshToken);
        return responseData;
    } catch (error) {
        console.error("An error occurred during login:", error);
        throw error;
    }
}

export async function register(username: string, password: string, email: string, avatar?: string, phoneNumber?: string, firstName?: string, lastName?: string): Promise<string> {
    try {
        const role = "USER"
        const response = await fetch(`${API_URL}/api/accounts/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ username, password, firstName, lastName, role, email, avatar, phoneNumber }),
        });
        // currently using backend for input checking!
        const responseData = await response.json();
        console.log(responseData);
        if (response.status !== 201) {
            throw new Error(responseData.error || "Unspecified error occured");
        }
        return responseData.username;
    } catch (error) {
        console.error("An error occurred during user register:", error);
        throw error;
    }
}

export async function registerADMIN(username: string, password: string, email: string, role: string, accessToken: string, refreshToken: string, avatar?: string, phoneNumber?: string, firstName?: string, lastName?: string): Promise<string> {
    try {
        const response = await fetch(`${API_URL}/api/admin/admin_register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x_refreshToken": refreshToken,
                Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ username, password, firstName, lastName, role, email, avatar, phoneNumber }),
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
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
                "x_refreshToken": refreshToken,
            },
            body: JSON.stringify({ username }),
        });
        const responseData = await response.json();
        console.log(responseData);
        if (response.status !== 200) {
            throw new Error(responseData.error || "Unspecified error occured");
        }
        return responseData['user'];
    } catch (error) {
        console.error(`An error occurred while fetching the profile for ${username} in ADMIN:`, error);
        throw error;
    }
}

// do we have search for users???


export async function editProfile(accessToken: string, refreshToken: string, avatar?: string, phoneNumber?: string, firstName?: string, lastName?: string, username?: string, password?: string): Promise<User> {
    try {
        const response = await fetch(`${API_URL}/api/accounts/profile`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "x_refreshToken": refreshToken,
                Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({username, password, firstName, lastName, avatar, phoneNumber }),
        });
        // currently using backend for input checking!
        const responseData = await response.json();
        console.log(responseData);
        if (response.status !== 201) {
            throw new Error(responseData.error || "Unspecified error occured");
        }
        return responseData['updated_user'];
    } catch (error) {
        console.error("An error occurred during profile editing:", error);
        throw error;
    }
}

export async function editProfileADMIN(username: string, accessToken: string, refreshToken: string, email?:string, role?:string, avatar?: string, phoneNumber?: string, firstName?: string, lastName?: string, password?: string): Promise<User> {
    try {
        const response = await fetch(`${API_URL}/api/admin/admin_users`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "x_refreshToken": refreshToken,
                Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({username, password, firstName, lastName, avatar, phoneNumber, email, role}),
        });
        // currently using backend for input checking!
        const responseData = await response.json();
        console.log(responseData);
        if (response.status !== 200) {
            throw new Error(responseData.error || "Unspecified error occured");
        }
        return responseData['updated_user'];
    } catch (error) {
        console.error(`An error occurred during profile editing for ${username} in ADMIN:`, error);
        throw error;
    }
}

export async function deleteAccount(accessToken: string, refreshToken: string): Promise<Boolean> {
    try {
        const response = await fetch(`${API_URL}/api/accounts/profile`, {
            method: "DELETE",
            headers: {
                "x_refreshToken": refreshToken,
                Authorization: `Bearer ${accessToken}`,
            },
        });
        // currently using backend for input checking!
        const responseData = await response.json();
        console.log(responseData);
        if (response.status !== 200) {
            throw new Error(responseData.error || "Unspecified error occured");
        }
        return true;
    } catch (error) {
        console.error("An error occurred during account deletion:", error);
        throw error;
    }
}

export async function deleteAccountADMIN(username: string, accessToken: string, refreshToken: string): Promise<boolean> {
    try {
        const response = await fetch(`${API_URL}/api/admin/admin_users`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "x_refreshToken": refreshToken,
                Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({username}),
        });
        // currently using backend for input checking!
        const responseData = await response.json();
        console.log(responseData);
        if (response.status !== 200) {
            throw new Error(responseData.error || "Unspecified error occured");
        }
        return true;
    } catch (error) {
        console.error(`An error occurred during account deletion for ${username} in ADMIN:`, error);
        throw error;
    }
}
