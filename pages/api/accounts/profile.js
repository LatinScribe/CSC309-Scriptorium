// THIS ENDPOINT TO BE USED BY LOGGED IN USERS TO EDIT THEIR PROFILE
// CAN BE USED BY USERS AND ADMINS
// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
// EXAMPLE OF A LOGGED IN PROTECTED PATH

import { verifyToken } from "@/utils/auth";

export default async function handler(req, res) {

    // api middleware
    var payload = null
    try {
        payload = verifyToken(req.headers.authorization);
    } catch (err) {
        console.log(err)
        return res.status(401).json({
            message: "Unauthorized",
        });
    }
    if (!payload) {
        return res.status(401).json({
            message: "Unauthorized",
        });
    }

    // actual api starts
    if (req.method === "GET") {
        // Retrieve the profile of the logged in user

        try {

            const user = await prisma.user.findUnique({
                where: {
                    username: payload.username,
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
                error: "ERROR RETRIEVING PROFILE. PLEASE TRY AGAIN OR CONTACT SUPPORT!",
            });
        }


    } else if (req.method === "PUT") {
        // edit profile of currently logged in user
        // cannot edit email or role!
        const { username, password, firstName, lastName, avatar, phoneNumber } = req.body;
        try {
            // Mofify the account to have the provided info

            // verify all inputs

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

            if (username && !verifyUsername(username)) {
                return res.status(400).json({
                    error: "USERNAME SHOULD BE ALPHA-NUMERIC or underscore OF AT LEAST LENGTH 2",
                });
            }

            const user = await prisma.user.findUnique({
                where: {
                    username: payload.username,
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
                    username: payload.username,
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
                error: "ERROR MODIFIYING PROFILE. PLEASE TRY AGAIN OR CONTACT SUPPORT!",
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
                    role: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    avatar: true,
                    phoneNumber: true,
                    role: true,
                    createdAt: true,
                    updatedAt: true,
                    deleted: true,
                },
            });
            return res.status(200).json({ message: "User deleted successfully" });
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Error logging in! Unsuccessful! Please try again!",
            });
        }
    }
    // placeholder return
    res.status(405).json({ message: "Method not allowed" });
}