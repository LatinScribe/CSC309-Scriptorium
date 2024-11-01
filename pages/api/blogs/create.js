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
      console.error("Error creating blog post:", error); 
      res.status(500).json({ error: 'Could not create blog post', details: error.message });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
