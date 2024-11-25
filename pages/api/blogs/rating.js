import prisma from "@/utils/db";
import { verifyToken } from "@/utils/auth";
import { verifyTokenLocal } from "@/utils/auth";
import { attemptRefreshAccess } from "@/utils/auth";
// rating blog post

export default async function handler(req, res) {
    if (req.method !== 'PATCH') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // user access
    const { x_refreshToken } = req.headers;
    let payload;

    try {
        payload = verifyToken(req.headers.authorization);
    } catch (err) {
        try {
            // attempt refresh
            console.log("Initial token verification failed:", err);
            let newAccessToken;
            if (x_refreshToken) {
                newAccessToken = attemptRefreshAccess(x_refreshToken);
            } else {
                return res.status(401).json({ message: "Unauthorized" });
            }
            if (!newAccessToken) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            payload = verifyTokenLocal(newAccessToken);
        } catch (refreshError) {
            return res.status(401).json({ message: "Unauthorized" });
        }
    }

    if (!payload) {
        try {
            if (x_refreshToken) {
                const newAccessToken = attemptRefreshAccess(x_refreshToken);
                if (newAccessToken) {
                    payload = verifyTokenLocal(newAccessToken);
                }
            }
        } catch (finalRefreshError) {
            return res.status(401).json({ message: "Unauthorized" });
        }
    }

    if (payload.role !== "USER") {
        return res.status(403).json({ error: "Forbidden" });
    }

    let username = null;
    username = payload?.username; // Extract username
    let userId = null;
    // query the database to get the user id
    const user = await prisma.user.findUnique({
        where: { username },
        // select: { id: true },
    });
    if (user) {
        userId = user.id;
    }

    try {
        // Expecting the body to contain action and userId 
        // action should be either 'upvote' or 'downvote'
        const { action } = req.body;
        const { id } = req.query;
        

        // Find the blog post
        const blogPost = await prisma.blogPost.findUnique({
            where: { id: parseInt(id) },
            // include: {
            //     // Include current upvotedUserIds and downvotedUserIds to check if the user voted already
            //     upvotedUserIds: true,
            //     downvotedUserIds: true,
            // },
        });

        if (!blogPost || blogPost.deleted || blogPost.hidden) {
            return res.status(404).json({ error: "Blog post not found" });
        }


        // let updatedPost;
        if (action === 'upvote') {
            // check if user previously upvoted
            let prevUpvote = await prisma.blogPostUpvote.findFirst({
                where: { blogPostId: parseInt(id), userId },
            });

            if (prevUpvote) { // remove upvote
                await prisma.blogPostUpvote.delete({ where: { id: prevUpvote.id } });
                await prisma.blogPost.update({
                    where: { id: parseInt(id) },
                    data: { upvoteCount: { decrement: 1 } },
                });
            } else {
                // Remove any existing downvote, if present
                let prevDownvote = await prisma.blogPostDownvote.findFirst({
                    where: { blogPostId: parseInt(id), userId },
                });
                if (prevDownvote) {
                    await prisma.blogPostDownvote.delete({ where: { id: prevDownvote.id } });
                    await prisma.blogPost.update({
                        where: { id: parseInt(id) },
                        data: { downvoteCount: { decrement: 1 } },
                    });
                }

                // Add new upvote
                await prisma.blogPostUpvote.create({
                    data: { blogPostId: parseInt(id), userId },
                });
                await prisma.blogPost.update({
                    where: { id: parseInt(id) },
                    data: { upvoteCount: { increment: 1 } },
                });
            }
 
        } else if (action === 'downvote') {
            let prevDownvote = await prisma.blogPostDownvote.findFirst({
                where: { blogPostId: parseInt(id), userId },
            });

            if (prevDownvote) {
                // Remove downvote
                await prisma.blogPostDownvote.delete({ where: { id: prevDownvote.id } });
                await prisma.blogPost.update({
                    where: { id: parseInt(id) },
                    data: { downvoteCount: { decrement: 1 } },
                });
            } else {
                let prevUpvote = await prisma.blogPostUpvote.findFirst({
                    where: { blogPostId: parseInt(id), userId },
                });
                if (prevUpvote) { // remove previous upvote if necessary
                    await prisma.blogPostUpvote.delete({ where: { id: prevUpvote.id } });
                    await prisma.blogPost.update({
                        where: { id: parseInt(id) },
                        data: { upvoteCount: { decrement: 1 } },
                    });
                }

                // add new downvote
                await prisma.blogPostDownvote.create({
                    data: { blogPostId: parseInt(id), userId },
                });
                await prisma.blogPost.update({
                    where: { id: parseInt(id) },
                    data: { downvoteCount: { increment: 1 } },
                });
            }
        } else {    // not downvote or upvote
            return res.status(401).json({ error: "Invalid action" });
        }

        // Fetch the updated blog post to return
        const updatedPost = await prisma.blogPost.findUnique({
            where: { id: parseInt(id) },
        });

        return res.status(200).json(updatedPost);
    } catch (error) { 
        res.status(500).json({ error: 'Could not rate blog post', details:error.message });
    }
}
