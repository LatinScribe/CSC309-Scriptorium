// THIS ENDPOINT TO BE USED BY USERS TO REGISTER FOR A NEW ACCOUNT
// NOT FOR ADMINS TO REGISTER ADMIN ACCOUNTS

import { hashPassword, generateSalt } from "@/utils/auth";
import { verifyEmail, verifyFirstname, verifyLastname, verifyPassword, verifyPhonenumber, verifyUsername, verifyRole } from "@/utils/verification";
import prisma from "@/utils/db";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { username, password, firstName, lastName, email, avatar, phoneNumber, role, output_bool } = req.body;

    var output = output_bool
    // check if user wants output. Default to false!
    if (!output || typeof output !== "boolean") {
        output = false
    } 

    // currently only requiring username, password, email, and role
    if (!username || !role || !password || !email) {
        return res.status(400).json({
            error: "Please provide all the required fields",
        });
    }
    if (role !== "USER") {
        return res.status(400).json({
            error: "ROLE MUST BE USER",
        });
    }

    try {
        // verify all inputs
        if (!verifyEmail(email)) {
            return res.status(400).json({
                error: "INVALID EMAIL FORMAT",
            });
        }

        if (firstName && !verifyFirstname(firstName)) {
            return res.status(400).json({
                error: "FIRSTNAME SHOULD BE ALPHABETICAL CHARACTERS of at least length 2",
            });
        }

        if (lastName && !verifyLastname(lastName)) {
            return res.status(400).json({
                error: "LASTNAME SHOULD BE ALPHABETICAL CHARACTERS of at least length 2",
            });
        }

        if (phoneNumber && !verifyPhonenumber(phoneNumber)) {
            return res.status(400).json({
                error: "INVALID PHONENUMBER FORMAT",
            });
        }

        if (!verifyPassword(password)) {
            return res.status(400).json({
                error: "PASSWORD SHOULD BE AT LEAST 8 Characters, with 1 uppercase, 1 lowercase, 1 number, 1 special char",
            });
        }

        if (!verifyUsername(username)) {
            return res.status(400).json({
                error: "USERNAME SHOULD BE ALPHA-NUMERIC or underscore OF AT LEAST LENGTH 2",
            });
        }

        if (!verifyRole(role)) {
            return res.status(400).json({
                error: "ROLE MUST BE EITHER USER OR ADMIN",
            })
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

        if (output) {
            return res.status(201).json({ user });
        } else {
            return res.status(201).json({ message: "User created sucessfully!" })
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            error: "Error creating user! Unsuccessful! Please try again!",

        });
    }
}
