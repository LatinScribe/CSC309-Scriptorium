// THIS FILE CONTAINS API CALLS TO UPDATE USER / PROFILE INFO

import { hashPassword, generateSalt } from "@/utils/auth";
import prisma from "@/utils/db";

// pages/api/accounts/user
export default async function handler(req, res) {
    // if (req.method !== "POST" && req.method !=="PUT" && req.method !=="GET" && req.method !=="DELETE") {
    //     return res.status(405).json({ error: "Method not allowed" });
    //   }

    // CREATE A USER, SHOULD USE REGISTER NORMALLY
    if (req.method === "POST") {
        const { username, password, firstName, lastName, email, avatar, phoneNumber, role } = req.body;

        // currently only requiring username, password, email, and role
        if (!username || !role || !password || !email) {
            return res.status(400).json({
                error: "Please provide all the required fields",
            });
        }
        if (role !== "USER" && role !== "ADMIN") {
            return res.status(400).json({
                error: "Not user or admin",
            });
        }

        try {
            // check if user already exists
            const userExists = await prisma.user.findUnique({
                where: {
                    username: username,
                },
            })
            if (userExists) {
                return res.status(400).json({
                    error: "USER ALREADY EXISTS",
                });
            }

            // check for email uniqueness
            const userExists2 = await prisma.user.findUnique({
                where: {
                    email: email,
                },
            })
            if (userExists2) {
                return res.status(400).json({
                    error: "USER ALREADY EXISTS",
                });
            }
        } catch (error) {
            return res.status(500).json({
                error: "Prisma error!",
            });
        }

        try {

            const salt = await generateSalt()
            const user = await prisma.user.create({
                data: {
                    username,
                    password: await hashPassword(password, salt),
                    salt: salt,
                    firstName,
                    lastName,
                    email,
                    avatar,
                    phoneNumber,
                    role,
                },
                select: {
                    id: true,
                    username: true,
                    role: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    avatar: true,
                    phoneNumber: true,
                    createdAt: true,
                },
            });

            return res.status(201).json({ user });
        } catch (error) {
            return res.status(500).json({
                error: "Error creating user! Unsuccessful! Please try again!",
            });
        }

    } else if (req.method === "GET") {
        // FILTER A RETRIEVE A USER based on username
        const { username } = req.body;

        if (!username) {
            return res.status(400).json({
                error: "Please provide all the required fields",
            });
        }
        try {
            const user = await prisma.user.findUnique({
                where: {
                    username: username,
                },
            })
            if (!user) {
                return res.status(200).json({
                    message: "Requested user could not be found",
                });
            }
            res.status(200).json({ user });
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Error logging in! Unsuccessful! Please try again!",
            });
        }
    } else if (req.method === "PUT") {
        try {
            // Mofify the account to have the provided info
            const { username, password, firstName, lastName, email, avatar, phoneNumber, role } = req.body;
            if (!username) {
                return res.status(400).json({
                    error: "Please provide all the required fields",
                });
            }

            const user = await prisma.user.findUnique({
                where: {
                    username: username,
                },
            })

            if (!user) {
                return res.status(400).json({
                    error: "Requested user could not be found",
                });
            }
            const salt = user.salt

            var new_password = undefined
            if (password) {
                new_password = await hashPassword(password, salt)
            }

            if (password && new_password === undefined) {
                throw new Error("New password creation error")
            }

            const updated_user = await prisma.user.update({
                where: {
                    username: username,
                },
                data: {
                    username,
                    password: new_password,
                    salt: salt,
                    firstName,
                    lastName,
                    email,
                    avatar,
                    phoneNumber,
                    role,
                },
                select: {
                    id: true,
                    username: true,
                    role: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    avatar: true,
                    phoneNumber: true,
                    role: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });
            res.status(201).json({ updated_user });
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Error logging in! Unsuccessful! Please try again!",
            });
        }

    } else if (req.method === "DELETE") {
        try {
            // TODO: Use Prisma Client to retrieve and filter authors
            const { username } = req.body;

            if (!username) {
                return res.status(400).json({
                    error: "Please provide all the required fields",
                });
            }

            const user = await prisma.user.findUnique({
                where: {
                    username: username,
                },
            })
            if (!user) {
                return res.status(200).json({
                    message: "Requested user could not be found",
                });
            }

            await prisma.user.delete({
                where: {
                    username: username,
                },
            });
            return res.status(200).json({ message: "User deleted successfully" });
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Error logging in! Unsuccessful! Please try again!",
            });
        }
    } else {
        res.status(405).json({ message: "Method not allowed" });
    }
}