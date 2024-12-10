import prisma from "@/utils/db";
import { verifyToken } from "@/utils/auth";
import { verifyTokenLocal } from "@/utils/auth";
import { attemptRefreshAccess } from "@/utils/auth";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

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

    

    const { explanation, blogPostId, commentId } = req.body; 
    
    try {
        // a report should include either a blogpostid or commentid
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

        // incrementt reportsCount in BlogPost or Comment 
        if (blogPostId) {
            await prisma.blogPost.update({
                where: { id: blogPostId },
                data: { reportsCount: { increment: 1 } },
            });
        }

        if (commentId) {
            await prisma.comment.update({
                where: { id: commentId },
                data: { reportsCount: { increment: 1 } },
            });
        }

        res.status(200).json(report);
    } catch (error) {
        res.status(500).json({ error: 'Could not create report' });
    }
}
