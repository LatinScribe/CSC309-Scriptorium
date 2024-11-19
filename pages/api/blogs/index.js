/* GET all blog posts or create new blog post
*/
import prisma from "@/utils/db";
import { verifyToken } from "@/utils/auth";
import { verifyTokenLocal } from "@/utils/auth";
import { attemptRefreshAccess } from "@/utils/auth";

export default async function handler(req, res) {
    if (req.method === 'GET') { // retrieve blog posts
        try {
            // get userId if user is logged in 
            const { authorization, x_refreshToken } = req.headers;
            let payload = null;
            let username = null;

            if (authorization) {
                try {
                    payload = verifyToken(authorization);
                    username = payload?.username; // Extract username
                } catch (err) {
                    console.log("Initial token verification failed:", err);

                    // attempt to refresh the token
                    if (x_refreshToken) {
                        console.log("Attempting to refresh access token...");
                        try {
                            const newAccessToken = attemptRefreshAccess(x_refreshToken);  
                            if (newAccessToken) {   // verify new access token 
                                payload = verifyTokenLocal(newAccessToken);
                                username = payload?.username;  // Extract username from the refreshed token
                            } else {
                                console.log("Refresh token failed");
                            }
                        } catch (refreshError) {
                            console.log("Refresh token verification failed:", refreshError);
                        }
                    } 
                }
            }
            // try {
            //     payload = verifyToken(req.headers.authorization);
            // } catch (err) {
            //     console.log(err);
            //     return res.status(401).json({
            //         error: "Unauthorized",
            //     });
            // }
            // if (!payload) {
            //     return res.status(401).json({
            //         error: "Unauthorized",
            //     });
            // }
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

            
            // const userId = payload?.id || null; // if authenticated, extract userid
            const pageNum = parseInt(req.query.page) || 1; // default to 1 
            const pageSize = parseInt(req.query.pageSize) || 10; // default to 10
            const searchQuery = req.query.query || '';

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
                       { title: { contains: searchQuery} },
                       { description: { contains: searchQuery}},
                       { tags: {contains: searchQuery}}, 
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
                        { OR: [
                                { hidden: false },
                                { authorId: userId }, // let authors see their hidden content
                            ], },
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


            const blogPosts = await prisma.blogPost.findMany({ // use find many to get list of posts from db
                where: whereCondition,
                include: { // relations
                    codeTemplates: true         // fetch each blog post and all the related code templates stored in codeTemplatse field
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
                isReported: post.hidden && post.authorId === userId,
            }));

            // calculating the total number of pages for pagination:
            // count the total number of blog posts 
            const totalPosts = await prisma.blogPost.count({
                where: whereCondition, 
            });
            const totalPages = Math.ceil(totalPosts / pageSize);

            if (mappedBlogPosts.length === 0) {
                return res.status(404).json({ message: "No blog posts found matching your criteria." });
            }

            const response = {
                blogPosts: mappedBlogPosts,
                totalPages,
                totalPosts,
            };
            
            res.status(200).json(response);
        } catch (error) {
            res.status(500).json({ error: 'Could not fetch blog posts'});
        }
    } else if (req.method === 'POST') {     // create new blog post 

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


        const { title, description, tags, authorId, codeTemplates } = req.body;


        try {
            const newBlogPost = await prisma.blogPost.create({
                data: {
                    title,
                    description,
                    tags,
                    authorId,
                    codeTemplates: {
                        connect: codeTemplates ? codeTemplates.map(template => ({ id: template.id })) : [],
                    } 
                },
            });
            res.status(200).json(newBlogPost);
        } catch (error) {
            // res.status(500).json({ error: 'Could not create blog post', details: error.message });
            res.status(500).json({ error: 'Could not create blog post' });
        }
    } else {
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}