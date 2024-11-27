/* rating comments or fetching comment by id*/
import prisma from "@/utils/db";
import { verifyToken } from "@/utils/auth";
import { verifyTokenLocal } from "@/utils/auth";
import { attemptRefreshAccess } from "@/utils/auth";


export default async function handler(req, res) {
    if (!['PATCH', 'GET'].includes(req.method)) {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // user access
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

    if (payload.role !== "USER" &&  payload.role !== "ADMIN") {
        return res.status(403).json({ error: "Forbidden" });
    }


    const { commentId } = req.query;

    if (req.method === "GET") { // fetch comment by id
        // Fetch comment by ID
        if (!commentId) {
            return res.status(400).json({ error: 'Comment ID is required' });
        }



        try {
            // Check if `includeReplies` is passed as a query parameter
            const includeReplies = req.query.includeReplies === "true";

            const comment = await prisma.comment.findUnique({
                where: { id: parseInt(commentId) },
            });

            if (!comment || comment.deleted || comment.hidden) {
                return res.status(404).json({ error: 'Comment not found' });
            }

            let response = { comment };

            // If `includeReplies` is true, fetch the replies for this comment
            if (includeReplies) {
                const replies = await prisma.comment.findMany({
                    where: { parentCommentId: parseInt(commentId) },
                    orderBy: { createdAt: "asc" },
                });
                response = { ...response, replies };
            }

            return res.status(200).json(response);
        } catch (error) {
            console.error("Error fetching comment:", error);
            return res.status(500).json({ error: "Could not fetch comment", details: error.message });
        }
    }

    else if (req.method === "PATCH") { // handle comment rating updates
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

        const { action } = req.body;  // `action` should be either 'upvote' or 'downvote'

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
            return res.status(500).json({ error: 'Could not update comment ratings' });
        }
    }
}
