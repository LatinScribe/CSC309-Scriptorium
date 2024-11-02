import prisma from "@/utils/db";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }
    
    const { explanation, blogPostId, commentId } = req.body;

    try {
        const report = await prisma.report.create({
            data: {
                explanation,
                blogPostId,
                commentId,
            },
        });
        res.status(200).json(report);
    } catch (error) {
        console.error("Error creating report:", error);
        res.status(500).json({ error: 'Could not create report', details: error.message });
    }
    
}
