import prisma from "@/utils/db";

export default async function handler(req, res) {
    if (req.method === 'GET') {
        try {
            const blogPosts = await prisma.blogPost.findMany({
                orderBy: {
                    reportsCount: 'desc', // sort by total reports
                },
                include: {
                    comments: true,
                },
            });
            res.status(200).json(blogPosts);
        } catch (error) {
            console.error("Error fetching reports:", error);
            res.status(500).json({ error: 'Could not fetch reports', details: error.message });
        }
    } else {
        res.setHeader('Allow', ['GET']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
