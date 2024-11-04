/* rating comments */
import prisma from "@/utils/db";
import { verifyToken } from "@/utils/auth";
import { verifyTokenLocal } from "@/utils/auth";
import { attemptRefreshAccess } from "@/utils/auth";


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


    
    const { commentId } = req.query;  // `commentId` refers to the ID of the comment
    const { userId, action } = req.body;  // `action` should be either 'upvote' or 'downvote'

    try {
        if (!commentId || !action || !userId) {
            return res.status(400).json({ error: 'Missing parameters' });
        }

        // Find the comment
        const comment = await prisma.comment.findUnique({
            where: { id: parseInt(commentId) },
        });
    
        if (!comment || comment.deleted || comment.hidden) {
            return res.status(404).json({ error: 'Comment not found' });
        }

        let updatedComment;
        
        if (action === 'upvote') {
            // Check if user previously upvoted the comment
            let prevUpvote = await prisma.commentUpvote.findFirst({
                where: { commentId: parseInt(commentId), userId },
            });

            if (prevUpvote) {
                // Remove upvote
                await prisma.commentUpvote.delete({ where: { id: prevUpvote.id } });
                updatedComment = await prisma.comment.update({
                    where: { id: parseInt(commentId) },
                    data: { upvoteCount: { decrement: 1 } },
                });
            } else {
                // Check and remove any previous downvote
                let prevDownvote = await prisma.commentDownvote.findFirst({
                    where: { commentId: parseInt(commentId), userId },
                });
                if (prevDownvote) {
                    await prisma.commentDownvote.delete({ where: { id: prevDownvote.id } });
                    await prisma.comment.update({
                        where: { id: parseInt(commentId) },
                        data: { downvoteCount: { decrement: 1 } },
                    });
                }

                // Add upvote
                await prisma.commentUpvote.create({
                    data: { commentId: parseInt(commentId), userId },
                });
                updatedComment = await prisma.comment.update({
                    where: { id: parseInt(commentId) },
                    data: { upvoteCount: { increment: 1 } },
                });
            }

        } else if (action === 'downvote') {
            // Check if user previously downvoted the comment
            let prevDownvote = await prisma.commentDownvote.findFirst({
                where: { commentId: parseInt(commentId), userId },
            });

            if (prevDownvote) {
                // Remove downvote
                await prisma.commentDownvote.delete({ where: { id: prevDownvote.id } });
                updatedComment = await prisma.comment.update({
                    where: { id: parseInt(commentId) },
                    data: { downvoteCount: { decrement: 1 } },
                });
            } else {
                // Check and remove any previous upvote
                let prevUpvote = await prisma.commentUpvote.findFirst({
                    where: { commentId: parseInt(commentId), userId },
                });
                if (prevUpvote) {
                    await prisma.commentUpvote.delete({ where: { id: prevUpvote.id } });
                    await prisma.comment.update({
                        where: { id: parseInt(commentId) },
                        data: { upvoteCount: { decrement: 1 } },
                    });
                }

                // Add downvote
                await prisma.commentDownvote.create({
                    data: { commentId: parseInt(commentId), userId },
                });
                updatedComment = await prisma.comment.update({
                    where: { id: parseInt(commentId) },
                    data: { downvoteCount: { increment: 1 } },
                });
            }
        } else {
            return res.status(400).json({ error: 'Invalid action' });
        }

        res.status(200).json(updatedComment);
    } catch (error) {
        // return res.status(500).json({ error: 'Could not update comment ratings', details: error.message});
        return res.status(500).json({ error: 'Could not update comment ratings'});
    }
}
