/* Hides blog post or comment 
 * from chatGPT
*/
import prisma from "@/utils/db";
import { verifyToken } from "@/utils/auth";
import { verifyTokenLocal } from "@/utils/auth";
import { attemptRefreshAccess } from "@/utils/auth";
import { use } from "react";
import { useState } from "react";

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

        const { id, type, state } = req.body; // type should be 'post' or 'comment' 


        try {

            var use_state = true;
            if (state && state === "false") {
                use_state = false;
            }

            if (type === 'post') {
                await prisma.blogPost.update({
                    where: { id },
                    data: { hidden: use_state },
                });

                // hide all comments associated with the blog post
                // do not unhide them if the blog post is unhidden
                if (use_state) {
                    await prisma.comment.updateMany({
                        where: { blogPostId: id },
                        data: { hidden: use_state },
                    });
                }
                } else if (type === 'comment') {
                    await prisma.comment.update({
                        where: { id },
                        data: { hidden: use_state },
                    });

                    // hide all replies associated with the comment
                    await prisma.comment.updateMany({
                        where: { parentCommentId: id },
                        data: { hidden: use_state },
                    });

                }
                res.status(200).json({ message: useState ? 'Content hidden successfully' : 'Content unhidden successfully' });
            } catch (error) {
                res.status(500).json({ error: useState ? 'Could not hide content' : 'Could not unhide content' });
            }
            
        } else if (req.method === 'GET') {
            // const { type } = req.query; // get the 'type' query parameter

            // try {
            //     if (type === 'post') {
            //         // get blog posts with reportsCount > 0
            //         const blogPosts = await prisma.blogPost.findMany({
            //             where: { reportsCount: { gt: 0 } },
            //             orderBy: { reportsCount: 'desc' },
            //             include: {
            //                 comments: {
            //                     where: { reportsCount: { gt: 0 } }, // only include reported comments
            //                     orderBy: { reportsCount: 'desc' },
            //                 },
            //             },
            //         });
            //         return res.status(200).json({ blogPosts });
            //     }

            //     else if (type === 'comment') {
            //         // get comments with reportsCount > 0
            //         const comments = await prisma.comment.findMany({
            //             where: { reportsCount: { gt: 0 } },
            //             orderBy: { reportsCount: 'desc' },
            //         });
            //         return res.status(200).json({ comments });
            //     }

            //     // check param
            //     res.status(400).json({ error: "Invalid type parameter. Use 'post' or 'comment'." });
            // } catch (error) {
            //     console.error("Error fetching data:", error);
            //     res.status(500).json({ error: 'Could not fetch reports' });
            // }


            try {
                const pageNum = parseInt(req.query.page) || 1; // default to 1 
                const pageSize = parseInt(req.query.pageSize) || 10; // default to 10
                const searchQuery = req.query.search || '';
                const author = req.query.author;

                const sortOption = req.query.sort;
                const templateId = req.query.templateId; // for searching by code template

                const orderBy = []; //
                if (sortOption === 'mostUpvoted') {
                    orderBy.push({ upvoteCount: 'desc' }, { downvoteCount: 'asc' }, { createdAt: 'desc' });
                } else if (sortOption === 'mostDownvoted') {
                    orderBy.push({ downvoteCount: 'desc' }, { createdAt: 'desc' });
                } else if (sortOption === 'mostRecent') {
                    orderBy.push({ createdAt: 'desc' });
                } else if (sortOption === 'mostReported') {
                    orderBy.push({ reportsCount: 'desc' });
                }
                else {
                    orderBy.push({ reportsCount: 'desc' }); // Default sort by most reported
                }

                let whereCondition;

                if (templateId) { // search by code template
                    whereCondition = {
                        codeTemplates: {
                            some: {
                                id: Number(templateId),     // match blog posts that 
                            },
                        },
                    };
                } else { // searches all blog posts
                    whereCondition = {
                        OR: [ // matching of any of these fields (search could match title, description, tags)
                            { title: { contains: searchQuery } },
                            { description: { contains: searchQuery } },
                            { tags: { contains: searchQuery } },
                            {
                                codeTemplates: {
                                    some: {
                                        title: { contains: searchQuery },
                                    },
                                },
                            },
                        ], reportsCount: { gt: 0 }, deleted: false,// only include reported posts
                    };
                }

                // manage visibility of hidden content
                // if (userId) {
                //     whereCondition = {
                //         AND: [
                //             whereCondition, // (combine with previous where conditition)
                //             {
                //                 OR: [
                //                     { hidden: false },
                //                     { authorId: userId }, // let authors see their hidden content
                //                 ],
                //             },
                //             { deleted: false }, // deleted posts not shown for everyone
                //         ],
                //     };
                // } else {
                //     whereCondition = {
                //         AND: [
                //             whereCondition,
                //             { hidden: false }, // only non-hidden content is returned for unauthenticated users
                //             { deleted: false },
                //         ],
                //     };
                // }


                // if (author) {
                //     whereCondition.AND = whereCondition.AND || [whereCondition];
                //     whereCondition.AND.push({
                //         author: {
                //             is: {
                //                 username: {
                //                     equals: author,
                //                 },
                //             },
                //         },
                //     });
                // }


                // const blogPosts = await prisma.blogPost.findMany({ // use find many to get list of posts from db
                //     where: whereCondition,
                //     include: { // relations
                //         codeTemplates: true,         // fetch each blog post and all the related code templates stored in codeTemplatse field
                //         author: {
                //             select: {
                //                 username: true,
                //             },
                //         },
                //     },
                //     skip: (pageNum - 1) * pageSize,           // pagination offset
                //     take: pageSize,
                //     orderBy: orderBy,
                // });

                //get blog posts with reportsCount > 0
                const blogPosts = await prisma.blogPost.findMany({
                    //where: { reportsCount: { gt: 0 } },
                    where: whereCondition,
                    include: {
                        comments: {
                            where: { reportsCount: { gt: 0 } }, // only include reported comments
                            orderBy: orderBy,
                            // }, author: {
                            //     select: {
                            //         username: true,
                            //     },
                        },
                    },
                    skip: (pageNum - 1) * pageSize,           // pagination offset
                    take: pageSize,
                    orderBy: orderBy,
                });

                // get comments with reportsCount > 0
                const comments = await prisma.comment.findMany({
                    where: { reportsCount: { gt: 0 } },
                    orderBy: orderBy,
                    skip: (pageNum - 1) * pageSize,           // pagination offset
                    take: pageSize,
                });

                // iterates over blogPosts array and copies all properties of the post object 
                // plus adds isReported flag that represents whether the post is hidden and userId 
                // userId matches the authorId of the post 
                // (this field is specific to the requestor and indicates the posts that should show as flagged
                // to the autho)
                let mappedBlogPosts = blogPosts.flat().map((post) => ({
                    ...post,

                    tags: post.tags ? post.tags.split(",") : [], // Ensure tags are an array

                    isHidden: post.hidden, // isReported flag is set to true if the post is hidden
                    numReported: post.reportsCount, // numReported is set to the number of reports
                }));

                let mappedComments = comments.flat().map((comment) => ({
                    ...comment,
                    isHidden: comment.hidden,
                    numReported: comment.reportsCount,
                }));

                // calculating the total number of pages for pagination:
                // count the total number of blog posts 
                const totalPosts = await prisma.blogPost.count({
                    where: whereCondition,
                });

                const totalComments = await prisma.comment.count({
                    where: { reportsCount: { gt: 0 } },
                });
                const totalPages = Math.ceil(totalPosts / pageSize);
                const totalCommentPages = Math.ceil(totalComments / pageSize);
                const total = Math.max(totalPages, totalCommentPages);

                const response = {
                    blogPosts: mappedBlogPosts,
                    comments: mappedComments,
                    totalPages: total,
                    // totalPosts,
                };

                console.log("sending response");
                //                 totalPosts,
                //             };


                res.status(200).json(response);
            } catch (error) {
                res.status(500).json({ error: 'Could not fetch blog posts', details: error.message });
            }

        } else {
            res.setHeader('Allow', ['PATCH', 'GET']);
            res.status(405).end(`Method ${req.method} Not Allowed`);
        }
    }
