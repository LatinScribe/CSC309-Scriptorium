import prisma from "@/utils/db";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }
    
    // blogPostId and commentId are optional ?
    const { explanation, blogPostId, commentId } = req.body; 
    
    try {
        // a report should include either a blogpostid or commentid?
        const reportData = {
            explanation,
        };

        if ((!blogPostId && !commentId) || (blogPostId && commentId)) {
            return res.status(400).json({ error: 'Either blogPostId or commentId must be provided' });
        }


        if (blogPostId) { // if request provides a blogpost id, include it
            reportData.blogPostId = blogPostId; 
        }
        if (commentId) {
            reportData.commentId = commentId; // comment id provided
        }

        const report = await prisma.report.create({
            data: reportData,
        });
        res.status(200).json(report);
    } catch (error) {
        res.status(500).json({ error: 'Could not create report' });
    }
}
