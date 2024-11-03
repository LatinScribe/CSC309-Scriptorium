/* fetching comments and 
 * creating new comments on blog post 
*/

import prisma from "@/utils/db";

export default async function handler(req, res) {
    const { blogPostId } = req.query; 
    
    if (req.method === 'GET') {
        try {
            const { sortOption, pageNum = 1, pageSize = 10 } = req.query;

            let orderBy = []; 
            if (sortOption === 'mostValuable') {
                orderBy = [
                  { upvoteCount: 'desc' },
                  { downvoteCount: 'asc' },
                  { createdAt: 'desc' }
                ]; 
            } else if (sortOption === 'mostControversial') {
                orderBy = [
                  { downvoteCount: 'desc' },
                  { createdAt: 'desc' }
                ];
            } else {
                orderBy = [
                  { createdAt: 'desc' } // default sort by creation time
                ];
            }

            // fetch comments (with pagination)
            const comments = await prisma.comment.findMany({
                where: {
                    blogPostId: parseInt(blogPostId), // get the comments associated with the blog post
                    hidden: false, // dont get hidden or deleted comments
                    deleted: false 
                },
                orderBy: orderBy, // apply sorting order
                skip: (pageNum - 1) * parseInt(pageSize),
                take: parseInt(pageSize),
            });

            res.status(200).json(comments); 
        } catch (error) {
          // res.status(500).json({ error: "Could not fetch comment", details: error.message });
          res.status(500).json({ error: "Could not fetch comment" });
        }
    } else if (req.method === 'POST') { // handle comment creation
        const { authorId, content, parentCommentId } = req.body; // extract from req body

        try {
          if (parentCommentId) {
            // fetch parent comment and check check that it exists and is associated with this blog post
            const parentComment = await prisma.comment.findUnique({
                where: { id: parseInt(parentCommentId) },
            });

            if (!parentComment || parentComment.deleted || parentComment.hidden ||
              parentComment.blogPostId !== parseInt(blogPostId)) {
                return res.status(400).json({ error: "Parent comment does not belong to the specified blog post." });
            }
          }
          // Create a new comment (or a reply if parentCommentId is provided)
          const newComment = await prisma.comment.create({
            data: {
              blogPostId: parseInt(blogPostId),
              authorId: parseInt(authorId), 
              content,
              parentCommentId: parentCommentId ? parseInt(parentCommentId) : null, // If provided, marks this as a reply
            },
          });
    
          res.status(200).json(newComment);
        } catch (error) {
            res.status(500).json({ error: "Could not create comment" });
        }
    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${method} Not Allowed`);
    }
  }