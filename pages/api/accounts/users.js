// THIS FILE CONTAINS API CALLS TO UPDATE USER / PROFILE INFO

import { hashPassword } from "@/utils/auth";
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
    
        const user = await prisma.user.create({
            data: {
                username,
                password: await hashPassword(password),
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
        res.status(201).json({ user });

    } else if (req.method === "GET") {
        // FILTER A RETRIEVE A USER based on username
        const {username} = req.body;

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
        res.status(200).json({user});
    } else if (req.method === "PUT") {
        // Mofify the account to have the provided info
        const { username, password, firstName, lastName, email, avatar, phoneNumber, role } = req.body;
        if (!username) {
            return res.status(400).json({
                error: "Please provide all the required fields",
            });
        }
        var new_password = undefined
        if (password) {
            new_password = await hashPassword(password)
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

        const updated_user = await prisma.user.update({
            where: {
                username: username,
            },
            data: {
                username,
                password: new_password,
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
        res.status(201).json({updated_user});
    }else if (req.method === "DELETE") {
        // TODO: Use Prisma Client to retrieve and filter authors
        const {username} = req.body;

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
    }else {
      res.status(405).json({ message: "Method not allowed" });
    }
  }