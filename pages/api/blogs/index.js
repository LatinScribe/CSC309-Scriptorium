/* GET all blog posts or create new blog post
*/
import prisma from "@/utils/db";
import { verifyToken } from "@/utils/auth";
import { verifyTokenLocal } from "@/utils/auth";
import { attemptRefreshAccess } from "@/utils/auth";

export default async function handler(req, res) {
    if (req.method === 'GET') { // retrieve blog posts

        console.log("sending response");
        // get userId if user is logged in 
        const { authorization, x_refreshToken } = req.headers;
        let username = null;
        let userId = null;

        if (!authorization) {
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

        try {

            // if (authorization) {
            //     payload = verifyToken(authorization);
            //     username = payload?.username; // Extract username
            //     if (!payload) {
            //         console.log("Initial token verification failed:", err);

            //         // attempt to refresh the token
            //         if (x_refreshToken) {
            //             console.log("Attempting to refresh access token...");

            // // ============== DIFFFERENCE ===============

            //             const newAccessToken = attemptRefreshAccess(x_refreshToken);  
            //             if (newAccessToken) {   // verify new access token 
            //                 payload = verifyTokenLocal(newAccessToken);
            //                 username = payload?.username;  // Extract username from the refreshed token
            //             } else {
            //                 console.log("Refresh token failed");
            //             }
            //         } 
            //     }

            username = payload?.username;
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
            //}

            // ============== DIFFFERENCE =============== (use control k + control u to uncomment)
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
            // // try {
            // //     payload = verifyToken(req.headers.authorization);
            // // } catch (err) {
            // //     console.log(err);
            // //     return res.status(401).json({
            // //         error: "Unauthorized",
            // //     });
            // // }
            // // if (!payload) {
            // //     return res.status(401).json({
            // //         error: "Unauthorized",
            // //     });
            // // }
            // let userId = null;
            // if (username) {
            //     // query the database to get the user id
            //     const user = await prisma.user.findUnique({
            //         where: { username },
            //         // select: { id: true },
            //     });
            //     if (user) {
            //         userId = user.id;
            //     }
            // }

            // ============== DIFFFERENCE ===============


            // const userId = payload?.id || null; // if authenticated, extract userid
            const pageNum = parseInt(req.query.page) || 1; // default to 1 
            const pageSize = parseInt(req.query.pageSize) || 10; // default to 10
            const searchQuery = req.query.query || '';
            const author = req.query.author;

            const sortOption = req.query.sort;
            const templateId = req.query.templateId; // for searching by code template

            const orderBy = []; //
            if (sortOption === 'mostValuable') {
                orderBy.push({ upvoteCount: 'desc' }, { downvoteCount: 'asc' }, { createdAt: 'desc' });
            } else if (sortOption === 'mostControversial') {
                orderBy.push({ downvoteCount: 'desc' }, { createdAt: 'desc' });
            } else {
                orderBy.push({ createdAt: 'desc' }); // Default sort by creation date
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
                    ],
                };
            }

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
                        { deleted: false }, // deleted posts not shown for everyone
                    ],
                };
            } else {
                whereCondition = {
                    AND: [
                        whereCondition,
                        { hidden: false }, // only non-hidden content is returned for unauthenticated users
                        { deleted: false },
                    ],
                };
            }


            if (author) {
                whereCondition.AND = whereCondition.AND || [whereCondition];
                whereCondition.AND.push({
                    author: {
                        is: {
                            username: {
                                equals: author,
                            },
                        },
                    },
                });
            }


            const blogPosts = await prisma.blogPost.findMany({ // use find many to get list of posts from db
                where: whereCondition,
                include: { // relations
                    codeTemplates: true,         // fetch each blog post and all the related code templates stored in codeTemplatse field
                    author: {
                        select: {
                            username: true,
                        },
                    },
                },
                skip: (pageNum - 1) * pageSize,           // pagination offset
                take: pageSize,
                orderBy: orderBy,
            });

            // iterates over blogPosts array and copies all properties of the post object 
            // plus adds isReported flag that represents whether the post is hidden and userId 
            // userId matches the authorId of the post 
            // (this field is specific to the requestor and indicates the posts that should show as flagged
            // to the autho)
            let mappedBlogPosts = blogPosts.map((post) => ({
                ...post,

                tags: post.tags ? post.tags.split(",") : [], // Ensure tags are an array

                isReported: post.hidden && post.authorId === userId,
            }));

            // calculating the total number of pages for pagination:
            // count the total number of blog posts 
            const totalPosts = await prisma.blogPost.count({
                where: whereCondition,
            });
            const totalPages = Math.ceil(totalPosts / pageSize);

            if (mappedBlogPosts.length === 0) {

                console.log("no results");

                return res.status(404).json({ message: "No blog posts found matching your criteria." });
            }

            const response = {
                blogPosts: mappedBlogPosts,
                totalPages,
                // totalPosts,
            };

            console.log("sending response");
            //                 totalPosts,
            //             };


            res.status(200).json(response);
        } catch (error) {
            res.status(500).json({ error: 'Could not fetch blog posts', details: error.message });
        }
    } else if (req.method === 'POST') {     // create new blog post 

        console.log("creating blog post...");

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
    }

    // if we get here, assume that payload is correct!
    // ========== TOKEN HANDLING ENDS HERE ==========

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

    console.log("authentication successful");

    const { title, description, tags, codeTemplates } = req.body;
    try {
        const newBlogPost = await prisma.blogPost.create({

            data: {
                title,
                description,
                tags,
                author: {
                    connect: {
                        id: userId,
                    },
                },

                codeTemplates: {
                    connect: codeTemplates.map(template => ({ id: template.id })), // Connecting to existing CodeTemplates by ID
                },
            },
            include: {
                codeTemplates: true, // This will include the related codeTemplates in the result
            },
        });
        console.log(newBlogPost.codeTemplates);
        console.log("blog post created");
        res.status(200).json(newBlogPost);
    } catch (error) {
        // res.status(500).json({ error: 'Could not create blog post', details: error.message });
        res.status(500).json({ error: 'Could not create blog post', details: error.message });
    }
} else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
}
}