/* fetching comments and 
 * creating new comments on blog post 
*/

import prisma from "@/utils/db";

export default async function handler(req, res) {
    const { blogPostId } = req.query; // Blog post ID from the query parameters
    
    if (req.method === 'GET') {
        try {

            let orderBy;
            if (sortOption === 'mostValuable') {
                orderBy = { upvoteCount: 'desc', downvoteCount: 'asc', createdAt: 'desc' }; 
            } else if (sortOption === 'mostControversial') {
                orderBy = { downvoteCount: 'desc', createdAt: 'desc' };
            } else {
                orderBy = { createdAt: 'desc' }; // Default sort by creation time
            }

            // fetch comments
            const comments = await prisma.comment.findMany({
                where: {
                    blogPostId: parseInt(blogPostId), // get the comments associated with the blog post
                },
                orderBy: orderBy, // apply sorting order
            });

            res.status(200).json(comments); 
        } catch (error) {
            console.error("Error fetching comments:", error);
            res.status(500).json({ error: 'Could not fetch comments', details: error.message });
        }
    } else if (req.method === 'POST') { // handle comment creation
        const { authorId, content, parentCommentId } = req.body; // extract from req body
      try {
        // Create a new comment (or a reply if parentCommentId is provided)
        const newComment = await prisma.comment.create({
          data: {
            blogPostId: parseInt(blogPostId),
            authorId: parseInt(authorId), 
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
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${method} Not Allowed`);
    }
  }