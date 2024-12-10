/* GET all blog posts or create new blog post
*/
import prisma from "@/utils/db";
import { verifyToken } from "@/utils/auth";
import { verifyTokenLocal } from "@/utils/auth";
import { attemptRefreshAccess } from "@/utils/auth";

export default async function handler(req, res) {
    if (req.method === 'GET') { // retrieve blog posts
        try {
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
                    OR: [ // OR allows matching of any of these fields (search could match title, description, tags)
                        // searches are case sensitive :o
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

            const blogPosts = await prisma.blogPost.findMany({ // use find many to get list of posts from db
                where: whereCondition,
                include: { // relations
                    codeTemplates: true         // fetch each blog post and all the related code templates stored in codeTemplatse field
                },
                skip: (pageNum - 1) * pageSize,           // pagination offset
                take: pageSize,                
                orderBy: orderBy, 
            }); 

            if (blogPosts.length === 0) {
                return res.status(404).json({ message: "No blog posts found matching your criteria." });
            }
            
            res.status(200).json(blogPosts);
        } catch (error) {
            res.status(500).json({ error: 'Could not fetch blog posts'});
        }
    } else if (req.method === 'POST') {

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