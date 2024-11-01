import prisma from "@/utils/db";

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { title, description, tags, authorId } = req.body;
    let upvotedUserIds = "";
    let downvotedUserIds = ""; // initialize upvotes and downvotes??
    try {
      const newBlogPost = await prisma.BlogPost.create({
        data: {
          title,
          description,
          tags,
          authorId,
          upvotedUserIds,
          downvotedUserIds,
        },
      });
      res.status(200).json(newBlogPost);
    } catch (error) {
      console.error("Error creating blog post:", error); // what the 
      res.status(500).json({ error: 'Could not create blog post', details: error.message });
    }
  } else if (req.method === 'GET') { // retrieve blog posts
    try {
        const blogPosts = await prisma.blogPost.findMany({ // use find many to get list of posts from db
            where: { // conditions
              OR: [ // OR allows matching of any of these fields (search could match title, description, tags)
                    // searches are case insensitive
                { title: { contains: searchQuery, mode: 'insensitive' } },
                { description: { contains: searchQuery, mode: 'insensitive' } },
                { tags: {contains: searchQuery, mode: 'insensitive'}}
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
    res.setHeader('Allow', ['POST', 'GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
