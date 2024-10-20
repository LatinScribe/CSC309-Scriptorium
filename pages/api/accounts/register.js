import { hashPassword } from "@/utils/auth";
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
}
