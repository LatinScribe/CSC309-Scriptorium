/* GET all blog posts or create new blog post
*/
import prisma from "@/utils/db";

export default async function handler(req, res) {
    if (req.method === 'GET') { // retrieve blog posts
        try {
            const pageNum = parseInt(req.query.page) || 1; // default to 1 
            const pageSize = parseInt(req.query.pageSize) || 10; // default to 10
            const searchQuery = req.query.query || '';

            const sortOption = req.query.sort;
            const templateId = req.query.templateId; // for searching by code template

            const orderBy = [];
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
            res.status(200).json(blogPosts);
        } catch (error) {
            res.status(500).json({ error: 'Could not fetch blog posts'});
        }
    } else if (req.method === 'POST') {
        //// users - do token check role
        const { title, description, tags, authorId } = req.body;
        // let upvotedUserIds = [];
        // let downvotedUserIds = []; // initialize upvotes and downvotes
        // let upvoteCount = 0;
        // let downvoteCount = 0;
        try {
            const newBlogPost = await prisma.blogPost.create({
                data: {
                title,
                description,
                tags,
                authorId,
                },
            });
            res.status(200).json(newBlogPost);
        } catch (error) {
            res.status(500).json({ error: 'Could not create blog post' });
        }
    } else {
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}