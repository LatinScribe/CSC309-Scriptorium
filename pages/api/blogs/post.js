/* Update or delete (existing) blog post with id [id]
*/
import prisma from "@/utils/db";
import { verifyToken } from "@/utils/auth";
import { verifyTokenLocal } from "@/utils/auth";
import { attemptRefreshAccess } from "@/utils/auth";

export default async function handler(req, res) {
    
    const { method } = req;
    const id = req.query.id; 

    if (req.method === "GET") {
        try {
          // Fetch the blog post by ID from the database
          const blogPost = await prisma.blogPost.findUnique({
            where: {
              id: Number(id), 
            },
            include: {
              author: true, // Include the author's details (if needed)
              codeTemplates: true, // Include related code templates (if needed)
            },
          });
    
          if (!blogPost) {
            return res.status(404).json({ error: "Blog post not found" });
          }

          if (blogPost?.tags) {
            blogPost.tags = blogPost.tags.split(","); // Convert to array
          }
    
          res.status(200).json(blogPost);
        } catch (error) {
          console.error(error);
          res.status(500).json({ error: "Internal server error" });
        }
    } else {
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


        if (method === 'PUT') {
            // update blog post

            // check if post exists
            let blogPost = await prisma.blogPost.findUnique({
                where: { id: parseInt(id) },
            });

            if (!blogPost || blogPost.deleted || blogPost.hidden) {
                return res.status(404).json({ error: "Blog post not found" });
            }

            const { title, description, tags } = req.body;

            try {
                const updatedPost = await prisma.blogPost.update({
                    where: { id: Number(id) }, // find post by post id
                    data: {  // these can be updated (edited); 
                            // can update some or all fields based on what is sent in req
                        title,
                        description,
                        tags,
                    },
                });

                const tagsArray = updatedPost.tags ? updatedPost.tags.split(',').map(tag => tag.trim()) : [];
                res.status(200).json({
                    ...updatedPost,
                    tags: tagsArray, // Override the tags field to return as an array
                });
            } catch (error) {
                res.status(500).json({ error: 'Could not update blog post' });
            }
        } else if (method === 'DELETE') {
            // mark blog post as deleted
            try {
                let blogPost = await prisma.blogPost.findUnique({
                    where: { id: parseInt(id) },
                });

                if (!blogPost) {
                    return res.status(404).json({ error: "Invalid blog post ID" });
                }
                if (blogPost.deleted) {
                    return res.status(404).json({ error: "Blog post already deleted" });
                }

                blogPost = await prisma.blogPost.update({     // update blogPost 
                where: { id: Number(id) },
                data: { deleted: true },  // Set `hidden` to true 
                });
                // cascade to comments
                // update comments table: set comments associated with the blog post as hidden
                await prisma.comment.updateMany({       
                    where: { blogPostId: parseInt(id) },
                    data: { deleted: true }
                });

                res.status(200).json({ message: 'Blog post and comments set as deleted', blogPost });
            } catch (error) {
                res.status(500).json({ error: 'Failed to delete the blog post', details: error.message });
            } 
        } else {
            res.setHeader('Allow', ['PUT', 'DELETE']);
            res.status(405).end(`Method ${method} Not Allowed`);
        }
    }

}