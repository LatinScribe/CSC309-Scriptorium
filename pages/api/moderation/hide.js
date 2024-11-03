/* Hides blog post or comment 
*/
import prisma from "@/utils/db";

export default async function handler(req, res) {
    if (req.method === 'PATCH') {

        const { id, type } = req.body; // 'type' should be 'post' or 'comment' to specify what’s being hidden
        
        try {
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


            if (type === 'post') {
                await prisma.blogPost.update({
                    where: { id },
                    data: { hidden: true },
                });
                // should it also cascade ??
            } else if (type === 'comment') {
                await prisma.comment.update({
                    where: { id },
                    data: { hidden: true },
                });

                // cascade to replies?
            }
            res.status(200).json({ message: 'Content hidden successfully' });
        } catch (error) {
            console.error("Error hiding content:", error);
            res.status(500).json({ error: 'Could not hide content', details: error.message });
        }
    } else {
        res.setHeader('Allow', ['PATCH']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
