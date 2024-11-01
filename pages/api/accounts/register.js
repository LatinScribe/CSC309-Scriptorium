import { hashPassword, generateSalt } from "@/utils/auth";
import prisma from "@/utils/db";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

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
        console.log("Gengerated salt: " + salt);
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
        console.log(error);
        return res.status(500).json({
            error: "Error creating user! Unsuccessful! Please try again!",
           
        });
    }
}
