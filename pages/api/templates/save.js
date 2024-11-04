import prisma from "@/utils/db";
import { verifyToken } from "@/utils/auth";

export default async function handler(req, res) {

    // this endpoint is only for authenticated users
    var payload = null
    try {
        payload = verifyToken(req.headers.authorization);
    } catch (err) {
        console.log(err);
        return res.status(401).json({
            error: "Unauthorized",
        });
    }
    if (!payload) {
        return res.status(401).json({
            error: "Unauthorized",
        });
    }
    const user = await prisma.user.findUnique({
        where: {
            username: payload.username,
        }
    });

    if (req.method === "GET") {
        const { page, pageSize } = req.query;
        if (!page || !pageSize) {
            return res.status(400).json({
                error: "Please provide page and page size",
            });
        }
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        // find saved templates
        const savedTemplates = await prisma.savedCodeTemplate.findMany({
            where: {
                userId: user.id,
                codeTemplate: {
                    deleted: false,
                }
            },
            select: {
                codeTemplateId: true,
                codeTemplate: {
                    select: {
                        id: true,
                        title: true,
                        author: {
                            select: {
                                username: true,
                            }
                        },
                        tags: true,
                        explanation: true,
                    },
                },
            }
        });
        const paginatedTemplates = savedTemplates.slice(start, end);
        const output = paginatedTemplates.map((template) => {
            return template.codeTemplate;
        });
        return res.status(200).json(output);
    }
    
    if (req.method === "POST") {
        const { templateId, action } = req.body;
        if (!templateId) {
            return res.status(400).json({
                error: "Please provide the template id",
            });
        }
        if (isNaN(parseInt(templateId))) {
            return res.status(400).json({
                error: "Invalid template id",
            });
        }
        if (!action) {
            return res.status(400).json({
                error: "Please provide the action",
            });
        }
        if (action === "save") {

            const template = await prisma.codeTemplate.findUnique({
                where: {
                    id: parseInt(templateId),
                }
            });
            if (!template || template.deleted) {
                return res.status(404).json({
                    error: "Template not found",
                });
            }
            const savedTemplate = await prisma.savedCodeTemplate.findMany({
                where: {
                    userId: user.id,
                    codeTemplateId: parseInt(templateId),
                }
            });
            // check if template is already saved
            if (savedTemplate.length > 0) {
                return res.status(400).json({
                    error: "Template already saved",
                });
            }
            await prisma.savedCodeTemplate.create({
                data: {
                    codeTemplateId: parseInt(templateId),
                    userId: user.id,
                }
            });
            return res.status(200).json({ message: "Template saved" });
        } else if (action === "unsave") {
            const savedTemplate = await prisma.savedCodeTemplate.findFirst({
                where: {
                    userId: user.id,
                    codeTemplateId: parseInt(templateId),
                }
            });
            if (!savedTemplate) {
                return res.status(400).json({
                    error: "Template wasn't saved",
                });
            }
            await prisma.savedCodeTemplate.delete({
                where: {
                    id: savedTemplate.id,
                }
            });
            return res.status(200).json({ message: "Template unsaved" });
        }
    }

    return res.status(405).json({ error: "Method not allowed "})
}