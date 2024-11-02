/* Update or delete (existing) blog post with id [id]
*/
import prisma from "@/utils/db";

export default async function handler(req, res) {
    const { method } = req;
    const { id } = req.query; // get the id from the query parameters

    if (method === 'PUT') {
        // update blog post
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
            res.status(200).json(updatedPost);
        } catch (error) {
            res.status(500).json({ error: 'Could not update blog post' });
        }
    } else if (method === 'DELETE') {
        // mark blog post as deleted
        try {
            const blogPost = await prisma.blogPost.update({     // update blogPost 
              where: { id: Number(id) },
              data: { hidden: true },  // Set `hidden` to true 
            });
            // cascade to comments
            // update comments table: set comments associated with the blog post as hidden
            await prisma.comment.updateMany({       
                where: { blogPostId: parseInt(id) },
                data: { hidden: true }
            });

            res.status(200).json({ message: 'Blog post and comments hidden successfully', blogPost });
        } catch (error) {
            res.status(500).json({ error: 'Failed to hide the blog post', details: error.message });
        } 
    } else {
        res.setHeader('Allow', ['PUT', 'DELETE']);
        res.status(405).end(`Method ${method} Not Allowed`);
    }
}