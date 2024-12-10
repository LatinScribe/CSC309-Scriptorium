import { CodeTemplate } from "@/utils/backendTypes";
import prisma from "@/utils/db";

interface QueryParams {
    id?: string;
}

import { NextApiRequest, NextApiResponse } from 'next';
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    // GET: get content of a specific template from id
    if (req.method == 'GET') {
        const { id } = req.query as QueryParams;
        if (!id) {
            return res.status(400).json({
                error: "Please provide the template id",
            });
        }
        const template = await prisma.codeTemplate.findUnique({
            where: {
                id: parseInt(id),
            },
            select: {
                id: true,
                title: true,
                explanation: true,
                tags: true,
                content: true,
                forkedSourceId: true,
                author: {
                    select: {
                        username: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        avatar: true,
                        role: true,
                        createdAt: true,
                    }
                },
                modifiedAt: true,
                language: true,
                deleted: true,
            }
        }) as CodeTemplate | null;
        if (!template || template.deleted) {
            return res.status(404).json({
                error: "Template not found",
            });
        }
        return res.status(200).json(template);
    }

    return res.status(405).json({ error: "Method not allowed" });
}