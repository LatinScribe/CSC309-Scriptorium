import prisma from "@/utils/db";
// rating blog post

export default async function handler(req, res) {
    if (req.method !== 'PATCH') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        // Expecting the body to contain action and userId 
        // action should be either 'upvote' or 'downvote'
        const { action, userId } = req.body;
        const { id } = req.query;
        

        // Find the blog post
        const blogPost = await prisma.blogPost.findUnique({
            where: { id: parseInt(id) },
            // include: {
            //     // Include current upvotedUserIds and downvotedUserIds to check if the user voted already
            //     upvotedUserIds: true,
            //     downvotedUserIds: true,
            // },
        });

        if (!blogPost || blogPost.deleted || blogPost.hidden) {
            return res.status(404).json({ error: "Blog post not found" });
        }


        // let updatedPost;
        if (action === 'upvote') {
            // check if user previously upvoted
            let prevUpvote = await prisma.blogPostUpvote.findFirst({
                where: { blogPostId: parseInt(id), userId },
            });

            if (prevUpvote) { // remove upvote
                await prisma.blogPostUpvote.delete({ where: { id: prevUpvote.id } });
                await prisma.blogPost.update({
                    where: { id: parseInt(id) },
                    data: { upvoteCount: { decrement: 1 } },
                });
            } else {
                // Remove any existing downvote, if present
                let prevDownvote = await prisma.blogPostDownvote.findFirst({
                    where: { blogPostId: parseInt(id), userId },
                });
                if (prevDownvote) {
                    await prisma.blogPostDownvote.delete({ where: { id: prevDownvote.id } });
                    await prisma.blogPost.update({
                        where: { id: parseInt(id) },
                        data: { downvoteCount: { decrement: 1 } },
                    });
                }

                // Add new upvote
                await prisma.blogPostUpvote.create({
                    data: { blogPostId: parseInt(id), userId },
                });
                await prisma.blogPost.update({
                    where: { id: parseInt(id) },
                    data: { upvoteCount: { increment: 1 } },
                });
            }
 
        } else if (action === 'downvote') {
            let prevDownvote = await prisma.blogPostDownvote.findFirst({
                where: { blogPostId: parseInt(id), userId },
            });

            if (prevDownvote) {
                // Remove downvote
                await prisma.blogPostDownvote.delete({ where: { id: prevDownvote.id } });
                await prisma.blogPost.update({
                    where: { id: parseInt(id) },
                    data: { downvoteCount: { decrement: 1 } },
                });
            } else {
                let prevUpvote = await prisma.blogPostUpvote.findFirst({
                    where: { blogPostId: parseInt(id), userId },
                });
                if (prevUpvote) { // remove previous upvote if necessary
                    await prisma.blogPostUpvote.delete({ where: { id: existingUpvote.id } });
                    await prisma.blogPost.update({
                        where: { id: parseInt(id) },
                        data: { upvoteCount: { decrement: 1 } },
                    });
                }

                // add new downvote
                await prisma.blogPostDownvote.create({
                    data: { blogPostId: parseInt(id), userId },
                });
                await prisma.blogPost.update({
                    where: { id: parseInt(id) },
                    data: { downvoteCount: { increment: 1 } },
                });
            }
        } else {    // not downvote or upvote
            return res.status(401).json({ error: "Invalid action" });
        }

        // Fetch the updated blog post to return
        const updatedPost = await prisma.blogPost.findUnique({
            where: { id: parseInt(id) },
        });

        return res.status(200).json(updatedPost);
    } catch (error) {
        console.error("Error creating blog post:", error); 
        res.status(500).json({ error: 'Could not create blog post' });
    }
}
