import prisma from "@/utils/db";
// rating blog post

export default async function handler(req, res) {
    if (req.method !== 'PATCH') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }
    const { method } = req;
    const { id } = req.query; 

    try {
        // Expecting the body to contain action and userId 
        const { action, userId } = req.body;

        // action should be either 'upvote' or 'downvote'

        // Find the blog post
        const blogPost = await prisma.blogPost.findUnique({
            where: { id: parseInt(id) },
            include: {
                // Include current upvotedUserIds and downvotedUserIds to check if the user voted already
                upvotedUserIds: true,
                downvotedUserIds: true,
            },
        });

        if (!blogPost) {
            return res.status(404).json({ error: "Blog post not found" });
        }

        // let upvotedUserIds = blogPost.upvotedUserIds.split(',').filter(Boolean);
        // let downvotedUserIds = blogPost.downvotedUserIds.split(',').filter(Boolean);
        let updatedPost;
        if (action === 'upvote') {
            if (blogPost.upvotedUserIds.includes(userId)) { // user already upvoted; remove upvote
                updatedPost = await prisma.blogPost.update({
                    where: { id: parseInt(id) },
                    data: {
                        // remove from downvotedUserIds
                        upvotedUserIds: { set: blogPost.upvotedUserIds.filter(uid => uid !== userId) },
                        upvoteCount: { decrement: 1 },
                    }, 
                });
            } else {
                updatedPost = await prisma.blogPost.update({
                    where: { id: parseInt(id) },
                    data: {
                        upvotedUserIds: { push: userId },
                        upvoteCount: { increment: 1 },
                        // filter out userId if user previously downvoted
                        downvotedUserIds: { set: blogPost.downvotedUserIds.filter(uid => uid !== userId) },
                        downvoteCount: blogPost.downvotedUserIds.includes(userId) ? { decrement: 1 } : undefined,
                    }, 
                });
            } 
        } else if (action === 'downvote') {
            if (blogPost.downvotedUserIds.includes(userId)) {
                // user previously downvoted; remove downvote
                updatedPost = await prisma.blogPost.update({
                    where: { id: parseInt(id) },
                    data: {
                      downvotedUserId: { set: blogPost.downvotedUserId.filter(uid => uid !== userId) },
                      downvoteCount: { decrement: 1 },
                    },
                  });
            } else {
                // add downvote
                updatedPost = await prisma.blogPost.update({
                    where: { id: parseInt(id) },
                    data: {
                    downvotedUserId: { push: userId },
                    downvoteCount: { increment: 1 },
                    // filter out userId in upvotedUserId if user previously upvoted
                    upvotedUserId: { set: blogPost.upvotedUserId.filter(uid => uid !== userId) },
                    upvoteCount: blogPost.upvotedUserId.includes(userId) ? { decrement: 1 } : undefined,
                    },
                });
            }
        } else {
            return res.status(400).json({ error: "Invalid action" });
        }

        return res.status(200).json(updatedBlogPost);
    } catch (error) {
        res.status(500).json({ error: 'Error processing request' });
    }
}
