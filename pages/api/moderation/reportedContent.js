/* Hides blog post or comment 
 * from chatGPT
*/
import prisma from "@/utils/db";
import { verifyToken } from "@/utils/auth";
import { verifyTokenLocal } from "@/utils/auth";
import { attemptRefreshAccess } from "@/utils/auth";

export default async function handler(req, res) {
    // admin access only
    // const { x_refreshToken } = req.headers;
    // let payload;

    // try {
    //     payload = verifyToken(req.headers.authorization);
    // } catch (err) {
    //     try {
    //         // attempt refresh
    //         console.log("Initial token verification failed:", err);
    //         let newAccessToken;
    //         if (x_refreshToken) {
    //             newAccessToken = attemptRefreshAccess(x_refreshToken);
    //         } else {
    //             return res.status(401).json({ message: "Unauthorized" });
    //         }
    //         if (!newAccessToken) {
    //             return res.status(401).json({ message: "Unauthorized" });
    //         }
    //         payload = verifyTokenLocal(newAccessToken);
    //     } catch (refreshError) {
    //         return res.status(401).json({ message: "Unauthorized" });
    //     }
    // }

    // if (!payload) {
    //     try {
    //         if (x_refreshToken) {
    //             const newAccessToken = attemptRefreshAccess(x_refreshToken);
    //             if (newAccessToken) {
    //                 payload = verifyTokenLocal(newAccessToken);
    //             }
    //         }
    //     } catch (finalRefreshError) {
    //         return res.status(401).json({ message: "Unauthorized" });
    //     }
    // }

    // api middleware (USE THIS TO REFRESH/GET THE TOKEN DATA)
    // ======== TOKEN HANDLING STARTS HERE ==========
    var payload = null
    try {
        // attempt to verify the provided access token!!
        payload = verifyToken(req.headers.authorization);
    } catch (err) {
        // this happens if we can't succesfully verify the access token!!
        try {
            // attempt to refresh access token using refresh token
            console.log(err)
            let new_accessToken
            if (x_refreshToken) {
                new_accessToken = attemptRefreshAccess(x_refreshToken);
            } else {
                // no Refresh token, so we have Token Error
                return res.status(401).json({
                    error: "Token Error",
                });
            }
            if (!new_accessToken) {
                // new access token not generated!
                return res.status(401).json({
                    error: "Token Error",
                });
            }
            // set the payload to be correct using new access token
            payload = verifyTokenLocal(new_accessToken)

            if (!payload) {
                // new access token not generated!
                return res.status(401).json({
                    error: "Token Error",
                });
            }
        } catch (err) {
            // refresh token went wrong somewhere, push token error
            console.log(err)
            return res.status(401).json({
                error: "Token Error",
            });
        }
    }
    if (!payload) {
        // access token verification failed
        try {
            // attempt to refresh access token with refresh token
            let new_accessToken
            if (x_refreshToken) {
                new_accessToken = attemptRefreshAccess(x_refreshToken);
            } else {
                // no Refresh token, so we have Token Error
                return res.status(401).json({
                    error: "Token Error",
                });
            }
            if (!new_accessToken) {
                // new access token not generated!
                return res.status(401).json({
                    error: "Token Error",
                });
            }
            // set the payload to be correct using new access token
            payload = verifyTokenLocal(new_accessToken)

            if (!payload) {
                // new access token not generated!
                return res.status(401).json({
                    error: "Token Error",
                });
            }
        } catch (err) {
            console.log(err)
            return res.status(401).json({
                error: "Token Error",
            });
        }
    }

    // if we get here, assume that payload is correct!
    // ========== TOKEN HANDLING ENDS HERE ==========

    if (payload.role !== "ADMIN") {
        return res.status(403).json({ error: "Forbidden" });
    }


    if (req.method === 'PATCH') {

        const { id, type } = req.body; // type should be 'post' or 'comment' 

        try {

            if (type === 'post') {
                await prisma.blogPost.update({
                    where: { id },
                    data: { hidden: true },
                });

                // hide all comments associated with the blog post
                await prisma.comment.updateMany({
                    where: { blogPostId: id },
                    data: { hidden: true },
                });
            } else if (type === 'comment') {
                await prisma.comment.update({
                    where: { id },
                    data: { hidden: true },
                });

                // hide all replies associated with the comment
                await prisma.comment.updateMany({
                    where: { parentCommentId: id },
                    data: { hidden: true },
                });

            }
            res.status(200).json({ message: 'Content hidden successfully' });
        } catch (error) {
            res.status(500).json({ error: 'Could not hide content' });
        }
    } else if (req.method === 'GET') {
        const { type } = req.query; // get the 'type' query parameter

        try {
            if (type === 'post') {
                // get blog posts with reportsCount > 0
                const blogPosts = await prisma.blogPost.findMany({
                    where: { reportsCount: { gt: 0 } },
                    orderBy: { reportsCount: 'desc' },
                    include: {
                        comments: {
                            where: { reportsCount: { gt: 0 } }, // only include reported comments
                            orderBy: { reportsCount: 'desc' },
                        },
                    },
                });
                return res.status(200).json({ blogPosts });
            }

            else if (type === 'comment') {
                // get comments with reportsCount > 0
                const comments = await prisma.comment.findMany({
                    where: { reportsCount: { gt: 0 } },
                    orderBy: { reportsCount: 'desc' },
                });
                return res.status(200).json({ comments });
            }

            // check param
            res.status(400).json({ error: "Invalid type parameter. Use 'post' or 'comment'." });
        } catch (error) {
            console.error("Error fetching data:", error);
            res.status(500).json({ error: 'Could not fetch reports' });
        }
    } else {
        res.setHeader('Allow', ['PATCH', 'GET']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
