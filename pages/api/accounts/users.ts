// This endpoint contains methods to access user data that non-logged in users can access
// currently only handles searching / filtering for users (only finds non-deleted users).


// import { hashPassword, generateSalt } from "@/utils/auth";
import prisma from "@/utils/db";
//import { verifyEmail, verifyFirstname, verifyLastname, verifyPassword, verifyPhonenumber, verifyUsername, verifyRole } from "@/utils/verification";
import { verifyUsername } from "@/utils/verification";

interface QueryParams {
    username?: string;
    firstName_bool?: boolean;
    lastName_bool?: boolean;
    email_bool?: boolean;
    avatar_bool?: boolean;
    phoneNumber_bool?: boolean;
    createdAt_bool?: boolean;
    role_bool?: boolean;
    page?: number;
    pageSize?: number;
}

function parseQueryParams(query: NextApiRequest['query']): QueryParams {
    const {
        username,
        firstName_bool,
        lastName_bool,
        email_bool,
        avatar_bool,
        phoneNumber_bool,
        createdAt_bool,
        role_bool,
        page,
        pageSize
    } = query;

    return {
        username: username as string,
        firstName_bool: firstName_bool === 'true',
        lastName_bool: lastName_bool === 'true',
        email_bool: email_bool === 'true',
        avatar_bool: avatar_bool === 'true',
        phoneNumber_bool: phoneNumber_bool === 'true',
        createdAt_bool: createdAt_bool === 'true',
        role_bool: role_bool === 'true',
        page: page ? parseInt(page as string, 10) : undefined,
        pageSize: pageSize ? parseInt(pageSize as string, 10) : undefined,
    };
}

// pages/api/accounts/user
import { NextApiRequest, NextApiResponse } from 'next';
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === "GET") {
        // FILTER and RETRIEVE USER(s) based on username
        //const { username, firstName_bool, lastName_bool, email_bool, avatar_bool, phoneNumber_bool, createdAt_bool, role_bool, page, pageSize } = req.body;
        const queryParams = parseQueryParams(req.query);

        if (queryParams.page && isNaN(queryParams.page)) {
            return res.status(400).json({
                error: "Page should be a number",
            });
        }
        if (queryParams.pageSize && isNaN(queryParams.pageSize)) {
            return res.status(400).json({
                error: "Page size should be a number",
            });
        }

        // default to 1 and 5
        var page_num = queryParams.page || 1;
        var pageSize_num = queryParams.pageSize || 5;

        if (!queryParams.username) {
            return res.status(400).json({
                error: "Please provide all the required fields",
            });
        }

        var firstname = queryParams.firstName_bool
        // check if user wants output. Default to false!
        if (!firstname || typeof firstname !== "boolean") {
            firstname = false
        }
        var lastName = queryParams.lastName_bool
        // check if user wants output. Default to false!
        if (!lastName || typeof lastName !== "boolean") {
            lastName = false
        }
        var email = queryParams.email_bool
        // check if user wants output. Default to false!
        if (!email || typeof email !== "boolean") {
            email = false
        }
        var avatar = queryParams.avatar_bool
        // check if user wants output. Default to false!
        if (!avatar || typeof avatar !== "boolean") {
            avatar = false
        }
        var phonenumber = queryParams.phoneNumber_bool
        // check if user wants output. Default to false!
        if (!phonenumber || typeof phonenumber !== "boolean") {
            phonenumber = false
        }

        var createdat = queryParams.createdAt_bool
        // check if user wants output. Default to false!
        if (!createdat || typeof createdat !== "boolean") {
            createdat = false
        }

        var role = queryParams.role_bool
        // check if user wants output. Default to false!
        if (!role || typeof role !== "boolean") {
            role = false
        }
        try {
            // verify username 
            if (!verifyUsername(queryParams.username)) {
                return res.status(400).json({
                    error: "NOT A VALID USERNAME FORMAT: USERNAME SHOULD BE ALPHA-NUMERIC or underscore OF AT LEAST LENGTH 2",
                });
            }

            let where: { username?: { contains: string } } = {};

            where.username = {
                contains: queryParams.username,
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