import prisma from "@/utils/db";

export default async function handler(req, res) {
    if (req.method === 'GET') {
        const { templateId } = req.query; // Get the templateId from the query parameters
        
        try {
            // Fetch blog posts that mention the specified code template
            const blogPosts = await prisma.blogPost.findMany({
                where: {
                    codeTemplates: {
                        some: {
                            id: Number(templateId), // Match blog posts that reference the code template by ID
                        },
                    },
                },
                include: {
                    codeTemplates: true, // Include related code templates in the response
                },
            });

            if (blogPosts.length === 0) {
                return res.status(404).json({ message: "No blog posts found for this code template." });
            }

            res.status(200).json(blogPosts); // Return the list of blog posts
        } catch (error) {
            console.error("Error fetching blog posts by template:", error);
            res.status(500).json({ error: 'Could not fetch blog posts', details: error.message });
        }
    } else {
        res.setHeader('Allow', ['GET']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
