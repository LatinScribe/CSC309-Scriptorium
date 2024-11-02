import prisma from "@/utils/db";

export default async function handler(req, res) {
    const { method } = req;
    const { blogPostId } = req.query; // Blog post ID from the URL
    const { authorId, content, parentCommentId } = req.body; // Extracting info from the request body
  
    if (method === 'POST') {
      try {
        // Create a new comment (or a reply if parentCommentId is provided)
        const newComment = await prisma.comment.create({
          data: {
            blogPostId: parseInt(blogPostId),
            authorId,
            content,
            parentCommentId: parentCommentId ? parseInt(parentCommentId) : null, // If provided, marks this as a reply
          },
        });
  
        res.status(201).json(newComment);
      } catch (error) {
        console.error("Error creating comment:", error);
        res.status(500).json({ error: "Could not create comment", details: error.message });
      }
    } else {
      res.setHeader('Allow', ['POST']);
      res.status(405).end(`Method ${method} Not Allowed`);
    }
  }