/* Hides blog post or comment 
*/
import prisma from "@/utils/db";

export default async function handler(req, res) {
    // admin access only
    let payload;
    try {
        payload = verifyToken(req.headers.authorization);
    } catch (err) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    if (payload.role !== "ADMIN") {
        return res.status(403).json({ error: "Forbidden" });
    }

    if (req.method === 'PATCH') {

        const { id, type } = req.body; // 'type' should be 'post' or 'comment' to specify what’s being hidden
        
        try {
             
            if (type === 'post') {
                await prisma.blogPost.update({
                    where: { id },
                    data: { hidden: true },
                });

                // hide all comments associated with the blog post
                await prisma.comment.updateMany({
                    where: { blogPostId: id },
                    data: { hidden: true },
                });
            } else if (type === 'comment') {
                await prisma.comment.update({
                    where: { id },
                    data: { hidden: true },
                });

                // hide all replies associated with the comment
                await prisma.comment.updateMany({
                    where: { parentCommentId: id },
                    data: { hidden: true },
                });

            }
            res.status(200).json({ message: 'Content hidden successfully' });
        } catch (error) {
            res.status(500).json({ error: 'Could not hide content'});
        }
    } else if (req.method === 'GET') {
        try {
            
            // fetch sorted blog posts
            const blogPosts = await prisma.blogPost.findMany({
                orderBy: {
                    reportsCount: 'desc', // sort by total reports
                },
                include: {
                    comments: true,
                },
            });

            // fetch sorted comments 
            const comments = await prisma.comment.findMany({
                orderBy: {
                    reportsCount: 'desc',
                },
            });

            res.status(200).json(blogPosts, comments);
        } catch (error) {
            res.status(500).json({ error: 'Could not fetch reports' });
        }
    } else {
        res.setHeader('Allow', ['PATCH', 'GET']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
