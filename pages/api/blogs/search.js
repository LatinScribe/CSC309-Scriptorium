import prisma from "@/utils/db";

export default async function handler(req, res) {
    if (req.method === 'GET') { // retrieve blog posts
        try {
            const { page = 1, limit = 10} = req.query;
            const searchQuery = req.query.query;
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
                    codeTemplates: true
                },
                skip: (page - 1) * limit,           // pagination offset
                take: Number(limit),                // pagination limit
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
