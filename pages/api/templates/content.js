import prisma from "@/utils/db";

export default async function handler(req, res) {
    // GET: get content of a specific template from id
    if (req.method == 'GET') {
        const { id } = req.query;
        if (!id) {
            return res.status(400).json({
                error: "Please provide the template id",
            });
        }
        const template = await prisma.codeTemplate.findUnique({
            where: {
                id: parseInt(id),
            }
        });
        if (!template || template.deleted) {
            return res.status(404).json({
                error: "Template not found",
            });
        }
        return res.status(200).json(template);
    }

    return res.status(405).json({ error: "Method not allowed" });
}