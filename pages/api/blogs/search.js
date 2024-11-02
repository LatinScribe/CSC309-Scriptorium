/* Retrieve blog posts
*/
import prisma from "@/utils/db";

export default async function handler(req, res) {
    if (req.method === 'GET') { // retrieve blog posts
        try {
            const pageNum = parseInt(req.query.page) || 1; // default to 1 
            const pageSize = parseInt(req.query.pageSize) || 10; // default to 10
            const searchQuery = req.query.query || '';
            // if sortByRating is not set, posts are sorted by createAt ()
            // const sortByRating = req.query.sortByRating === 'true'; //
            const sortOption = req.query.sort;

            let orderBy; 
            if (sortOption === 'mostValuable') {
                orderBy = { upvoteCount: 'desc', downvoteCount: 'asc', createdAt: 'desc' }; 
            } else if (sortOption === 'mostControversial') {
                orderBy = { downvoteCount: 'desc', createdAt: 'desc' };
            } else {
                orderBy = { createdAt: 'desc' }; // Default sort by creation date
            }


            const blogPosts = await prisma.blogPost.findMany({ // use find many to get list of posts from db
                where: { // conditions
                    OR: [ // OR allows matching of any of these fields (search could match title, description, tags)
                         // searches are case sensitive :o
                        { title: { contains: searchQuery} },
                        { description: { contains: searchQuery}},
                        { tags: {contains: searchQuery}}, 
                        {
                            codeTemplates: {
                                some: {
                                title: { contains: searchQuery }
                                }
                            }
                        }
                    ],
                },
                include: { // relations
                    codeTemplates: true         // fetch each blog post and all the related code templates stored in codeTemplatse field
                },
                skip: (page - 1) * limit,           // pagination offset
                take: Number(limit),                // pagination limit
                orderBy: orderBy, 
            }); 
            res.status(200).json(blogPosts);
        } catch (error) {
            console.error("Error fetching blog posts:", error); // what happening
            res.status(500).json({ error: 'Could not fetch blog posts', details: error.message });
        }
    } else {
        res.setHeader('Allow', ['GET']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
