/* fetching comments and 
 * creating new comments on blog post 
*/
import prisma from "@/utils/db";
import { verifyToken } from "@/utils/auth";
import { verifyTokenLocal } from "@/utils/auth";
import { attemptRefreshAccess } from "@/utils/auth";

export default async function handler(req, res) {
    const { blogPostId } = req.query;

    if (req.method === 'GET') {
        try {
            // get userId if user is logged in 
            const { authorization, x_refreshToken } = req.headers;
            if (authorization) {



                // if (authorization) {
                //     try {
                //         payload = verifyToken(authorization);
                //         username = payload?.username; // Extract username
                //     } catch (err) {
                //         console.log("Initial token verification failed:", err);

                //         // attempt to refresh the token
                //         if (x_refreshToken) {
                //             console.log("Attempting to refresh access token...");
                //             try {
                //                 const newAccessToken = attemptRefreshAccess(x_refreshToken);  
                //                 if (newAccessToken) {   // verify new access token 
                //                     payload = verifyTokenLocal(newAccessToken);
                //                     username = payload?.username;  // Extract username from the refreshed token
                //                 } else {
                //                     console.log("Refresh token failed");
                //                 }
                //             } catch (refreshError) {
                //                 console.log("Refresh token verification failed:", refreshError);
                //             }
                //         } 
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
            }

            // if we get here, assume that payload is correct!
            // ========== TOKEN HANDLING ENDS HERE ==========
            let username = null;
            if (payload) {
                username = payload.username;
            }
            let userId = null;
            if (username) {
                // query the database to get the user id
                const user = await prisma.user.findUnique({
                    where: { username },
                    // select: { id: true },
                });
                if (user) {
                    userId = user.id;
                }
            }


            const { sortOption } = req.query;
            const pageNum = parseInt(req.query.pageNum) || 1;
            const pageSize = parseInt(req.query.pageSize) || 5;

            let orderBy = [];
            if (sortOption === 'mostUpvotes') {
                orderBy = [
                    { upvoteCount: 'desc' },
                    { downvoteCount: 'asc' },
                    { createdAt: 'desc' },
                    { id: 'asc' }
                ];
            } else if (sortOption === 'mostDownvotes') {
                orderBy = [
                    { downvoteCount: 'desc' },
                    { createdAt: 'desc' },
                    { id: 'asc' }
                ];
            } else {
                orderBy = [
                    { createdAt: 'desc' }, // default sort by creation time
                    { id: 'asc' }
                ];
            }


            let whereCondition = {
                blogPostId: parseInt(blogPostId), // get the comments associated with the blog post
                deleted: false
            };

            // manage visibility of hidden content
            if (userId) {
                whereCondition = {
                    AND: [
                        whereCondition, // (combine with previous where conditition)
                        {
                            OR: [
                                { hidden: false },
                                { authorId: userId }, // let authors see their hidden content
                            ],
                        },
                    ],
                };
            } else {
                whereCondition = {
                    AND: [
                        whereCondition,
                        { hidden: false }, // only non-hidden content is returned for unauthenticated users
                    ],
                };
            }

            // fetch all comments
            const comments = await prisma.comment.findMany({
                where: whereCondition,
                orderBy: orderBy,
                include: {
                    author: {
                        select: {
                            username: true,
                        },
                    },
                },
                // skip: (pageNum - 1) * pageSize,
                // take: pageSize,
            });

            // ======== nest comments ==========

            const mapCommentsToParent = (comments) => {
                const commentMap = {};
                const result = [];

                comments.forEach((comment) => {
                    commentMap[comment.id] = {
                        ...comment,
                        replies: [] // create a replies field for each comment
                    };
                });

                comments.forEach((comment) => {
                    if (comment.parentCommentId) {
                        // comment has a parent; push it to the parent's replies array
                        commentMap[comment.parentCommentId].replies.push(commentMap[comment.id]);
                    } else {
                        // add top level comments to the result
                        result.push(commentMap[comment.id]);
                    }
                });
                return result;
            };

            const nestedComments = mapCommentsToParent(comments);
            // apply pagination to top-level comments only
            const paginatedTopLevel = nestedComments.slice((pageNum - 1) * pageSize, pageNum * pageSize);

            // iterates over comments array and copies all properties of the post object 
            // plus adds isReported flag that represents whether the comment is hidden and userId 
            // userId matches the authorId of the post 
            // (this field is specific to the requestor and indicates the comments that should show as flagged
            // to the author)
            const mappedComments = paginatedTopLevel.map((comment) => ({
                ...comment,
                isReported: comment.hidden && comment.authorId === userId,
                replies: comment.replies.map((reply) => ({
                    ...reply,
                    isReported: reply.hidden && reply.authorId === userId,
                })),
            }));

            // calculating the total number of pages for pagination:
            const totalPosts = nestedComments.length;
            const totalPages = Math.ceil(totalPosts / pageSize);

            const response = {
                comments: mappedComments,
                totalPages,
                totalPosts,
            };

            res.status(200).json(response);
        } catch (error) {
            // res.status(500).json({ error: "Could not fetch comment", details: error.message });
            res.status(500).json({ error: "Could not fetch comment", details: error.message });
        }
    } else if (req.method === 'POST') { // handle comment creation
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
        //}

        // if we get here, assume that payload is correct!
        // ========== TOKEN HANDLING ENDS HERE ==========

        if (payload.role !== "USER" && payload.role !== "ADMIN") {
            return res.status(403).json({ error: "Forbidden" });
        }


        // api start 

        const { content, parentCommentId } = req.body; // extract from req body

        try {
            // find the author of comment
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
            } else {
                res.status(404).json({ error: "Could not find user" });
            }


            if (parentCommentId) {
                // fetch parent comment and check check that it exists and is associated with this blog post
                const parentComment = await prisma.comment.findUnique({
                    where: { id: parseInt(parentCommentId) },
                });
                if (!parentComment || parentComment.deleted || parentComment.hidden ||
                    parentComment.blogPostId !== parseInt(blogPostId)) {
                    return res.status(400).json({ error: "Parent comment does not belong to the specified blog post." });
                }
            }

            // Create a new comment (or a reply if parentCommentId is provided)
            const newComment = await prisma.comment.create({
                data: {
                    blogPostId: parseInt(blogPostId),
                    authorId: userId,
                    content,
                    parentCommentId: parentCommentId ? parseInt(parentCommentId) : null, // If provided, marks this as a reply
                },
            });

            res.status(200).json(newComment);
        } catch (error) {
            res.status(500).json({ error: "Could not create comment" });
        }
    } else {
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).end(`Method ${method} Not Allowed`);
    }
}