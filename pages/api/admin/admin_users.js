// THIS FILE CONTAINS API CALLS TO UPDATE USER / PROFILE INFO FOR ADMINS
// This endpoint has MORE PERMS THAN USUAL USER. CAN MODIFY EVERYONE!!!!!
// This endpoint assumes a admin/debugging role, so most amount of output is assumed to be required.

import { hashPassword, generateSalt, verifyToken, attemptRefreshAccess, verifyTokenLocal } from "@/utils/auth";
import prisma from "@/utils/db";
import { verifyEmail, verifyFirstname, verifyLastname, verifyPassword, verifyPhonenumber, verifyUsername, verifyRole } from "@/utils/verification";

// pages/api/accounts/user
export default async function handler(req, res) {
    // if (req.method !== "POST" && req.method !=="PUT" && req.method !=="GET" && req.method !=="DELETE") {
    //     return res.status(405).json({ error: "Method not allowed" });
    //   }

    // api middleware
    const { x_refreshToken } = req.headers;
    var payload = null
    try {
        payload = verifyToken(req.headers.authorization);
    } catch (err) {
        try {
            // attempt to refresh access token using refresh token
            console.log(err)
            let new_accessToken
            if (x_refreshToken) {
                new_accessToken = attemptRefreshAccess(x_refreshToken);
            } else {
                return res.status(401).json({
                    message: "Unauthorized",
                });
            }
            if (!new_accessToken) {
                return res.status(401).json({
                    message: "Unauthorized",
                });
            }
            payload = verifyTokenLocal(new_accessToken)
        } catch (err) {
            console.log(err)
            return res.status(401).json({
                message: "Unauthorized",
            });
        }
    }
    if (!payload) {
        try {
            // attempt to refresh access token with refresh token
            let new_accessToken
            if (x_refreshToken) {
                new_accessToken = attemptRefreshAccess(x_refreshToken);
            } else {
                return res.status(401).json({
                    message: "Unauthorized",
                });
            }
            if (!new_accessToken) {
                return res.status(401).json({
                    message: "Unauthorized",
                });
            }
            payload = verifyTokenLocal(new_accessToken)
        } catch (err) {
            console.log(err)
            return res.status(401).json({
                message: "Unauthorized",
            });
        }
    }

    if (payload.role !== "ADMIN") {
        return res.status(403).json({
            error: "Forbidden",
        });
    }

    // actual api starts

    // CREATE A USER Manually by Admin (somewhat redundant with admin_register endpoint)
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
        // For Admins, they recieve all the Data on the user!
        const { username } = req.body;

        if (!username) {
            return res.status(400).json({
                error: "Please provide all the required fields",
            });
        }
        try {
            // verify username 
            if (!verifyUsername(username)) {
                return res.status(400).json({
                    error: "USERNAME SHOULD BE ALPHA-NUMERIC or underscore OF AT LEAST LENGTH 2",
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

            if (user.deleted) {
                return res.status(401).json({
                    error: "User has been deleted! Please contact Support!",
                });
            }
            res.status(200).json({ user });
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "ERROR GETTING USER, PLEASE TRY AGAIN",
            });
        }
    } else if (req.method === "PUT") {
        const { username, newUsername, password, firstName, lastName, email, avatar, phoneNumber, role } = req.body;
        try {
            // Mofify the account to have the provided info
            if (!username) {
                return res.status(400).json({
                    error: "Please provide all the required fields",
                });
            }

            // verify all inputs
            if (email && !verifyEmail(email)) {
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

            if (password && !verifyPassword(password)) {
                return res.status(400).json({
                    error: "PASSWORD SHOULD BE AT LEAST 8 Characters, with 1 uppercase, 1 lowercase, 1 number, 1 special char",
                });
            }

            if (newUsername && !verifyUsername(newUsername)) {
                return res.status(400).json({
                    error: "USERNAME SHOULD BE ALPHA-NUMERIC or underscore OF AT LEAST LENGTH 2",
                });
            }

            if (role && !verifyRole(role)) {
                return res.status(400).json({
                    error: "ROLE MUST BE EITHER USER OR ADMIN",
                })
            }

            if (newUsername) {
                // check if user already exists
                const userExists = await prisma.user.findUnique({
                    where: {
                        username: newUsername,
                    },
                })
                if (userExists) {
                    return res.status(400).json({
                        error: "USER ALREADY EXISTS",
                    });
                }
            }

            if (email) {
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

            if (user.deleted) {
                return res.status(401).json({
                    error: "User has been deleted! Please contact Support!",
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
                    username:newUsername,
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
                error: "ERROR MODIFYING USER! PLEASE TRY AGAIN!",
            });
        }

    } else if (req.method === "DELETE") {
        try {
            const { username } = req.body;
            if (!username) {
                return res.status(400).json({
                    error: "Please provide all the required fields",
                });
            }

            // verify username
            if (!verifyUsername(username)) {
                return res.status(400).json({
                    error: "USERNAME SHOULD BE ALPHA-NUMERIC or underscore OF AT LEAST LENGTH 2",
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

            if (user.deleted) {
                return res.status(200).json({
                    error: "User has already been deleted! Please contact Support!",
                });
            }

            // await prisma.user.delete({
            //     where: {
            //         username: username,
            //     },
            // });

            const updated_user = await prisma.user.update({
                where: {
                    username: username,
                },
                data: {
                    deleted: true,
                },
                select: {
                    id: true,
                    username: true,
                },
            });
            return res.status(200).json({ message: "User deleted successfully" });
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Error deleting user! Unsuccessful! Please try again!",
            });
        }
    } else {
        res.status(405).json({ message: "Method not allowed" });
    }
}