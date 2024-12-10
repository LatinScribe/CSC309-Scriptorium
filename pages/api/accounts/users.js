// This endpoint contains methods to access user data that non-logged in users can access
// currently only handles searching / filtering for users (only finds non-deleted users).


// import { hashPassword, generateSalt } from "@/utils/auth";
import prisma from "@/utils/db";
//import { verifyEmail, verifyFirstname, verifyLastname, verifyPassword, verifyPhonenumber, verifyUsername, verifyRole } from "@/utils/verification";
import { verifyUsername } from "@/utils/verification";

// pages/api/accounts/user
export default async function handler(req, res) {
    if (req.method === "GET") {
        // FILTER and RETRIEVE USER(s) based on username
        const { username, firstName_bool, lastName_bool, email_bool, avatar_bool, phoneNumber_bool, createdAt_bool, role_bool, page, pageSize } = req.body;

        if (page && isNaN(parseInt(page))) {
            return res.status(400).json({
                error: "Page should be a number",
            });
        }
        if (pageSize && isNaN(parseInt(pageSize))) {
            return res.status(400).json({
                error: "Page size should be a number",
            });
        }

        // default to 1 and 5
        var page_num = page
        var pageSize_num = pageSize
        if (!page || !pageSize) {
            page_num = 1;
            pageSize_num = 5;
        }

        if (!username) {
            return res.status(400).json({
                error: "Please provide all the required fields",
            });
        }

        var firstname = firstName_bool
        // check if user wants output. Default to false!
        if (!firstname || typeof firstname !== "boolean") {
            firstname = false
        }
        var lastName = lastName_bool
        // check if user wants output. Default to false!
        if (!lastName || typeof lastName !== "boolean") {
            lastName = false
        }
        var email = email_bool
        // check if user wants output. Default to false!
        if (!email || typeof email !== "boolean") {
            email = false
        }
        var avatar = avatar_bool
        // check if user wants output. Default to false!
        if (!avatar || typeof avatar !== "boolean") {
            avatar = false
        }
        var phonenumber = phoneNumber_bool
        // check if user wants output. Default to false!
        if (!phonenumber || typeof phonenumber !== "boolean") {
            phonenumber = false
        }

        var createdat = createdAt_bool
        // check if user wants output. Default to false!
        if (!createdat || typeof createdat !== "boolean") {
            createdat = false
        }

        var role = role_bool
        // check if user wants output. Default to false!
        if (!role || typeof role !== "boolean") {
            role = false
        }
        try {
            // verify username 
            if (!verifyUsername(username)) {
                return res.status(400).json({
                    error: "NOT A VALID USERNAME FORMAT: USERNAME SHOULD BE ALPHA-NUMERIC or underscore OF AT LEAST LENGTH 2",
                });
            }

            let where = {};

            where.username = {
                contains: username,
                // mode: "insensitive",
            }
            let users = await prisma.user.findMany({
                where: where,
                select: {
                    username: true,
                    firstName: firstname,
                    lastName: lastName,
                    email: email,
                    avatar: avatar,
                    phoneNumber: phonenumber,
                    createdAt: createdat,
                    deleted: true,
                    role: role,
                },
            })

            if (!users || users.length === 0) {
                return res.status(200).json({
                    message: "No users could be found!",
                });
            }

            // filter out all deleted templates
            users = users.filter((user) => !user.deleted);

            // paginate 
            const start = (page_num - 1) * pageSize_num;
            const end = start + pageSize_num;
            const paginatedUsers = users.slice(start, end);

            res.status(200).json(paginatedUsers);
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Error retrieving User(s)! Unsuccessful! Please try again!",
            });
        }
    } else {
        res.status(405).json({ message: "Method not allowed" });
    }
}