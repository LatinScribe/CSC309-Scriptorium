import prisma from "@/utils/db";

// creating blog posts
export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { title, description, tags, authorId } = req.body;
    try {
        const newPost = await prisma.blogPost.create({
            data: {
              title: postData.title,
              description: postData.description,
              tags: postData.tags,
              authorId: postData.authorId, // The ID of the user creating the post
            },
          });
          return newPost;
    } catch (error) {
      res.status(500).json({ error: 'Could not create blog post' });
    }
  }
}


  
