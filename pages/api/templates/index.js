import prisma from "@/utils/db";
import { verifyToken } from "@/utils/auth";

export default async function handler(req, res) {
    // GET: return template metadata list based on filters (title, tags, content, author)
    if (req.method === "GET") {
        const { title, tag, content, author, page, pageSize } = req.query;
        let where = {};
        if (title) {
            where.title = {
                contains: title,
                // mode: "insensitive",
            };
        }
        if (content) {
            where.content = {
                contains: content,
                // mode: "insensitive",
            };
        }
        if (author) {
            where.author = {
                equals: author,
            };
        }
        if (!page || !pageSize) {
            return res.status(400).json({
                message: "Please provide page and page size",
            });
        }
        let templates = await prisma.codeTemplate.findMany({
            where: where,
            select: {
            id: true,
            title: true,
            tags: true,
            explanation: true,
            author: true,
            },
        });
        // filter all templates that have the tag
        if (tag) {
            templates = templates.filter((template) => {
                return template.tags.includes(tag);
            });
        }
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        const paginatedTemplates = templates.slice(start, end);
        // note: currently it returns the entire author object (including hashed password), yikes!
        return res.status(200).json(paginatedTemplates);
    }

    // We now check if the user is authenticated
    var payload = null
    try {
        payload = verifyToken(req.headers.authorization);
    } catch (err) {
        console.log(err);
        return res.status(401).json({
            message: "Unauthorized",
        });
    }
    if (!payload) {
        return res.status(401).json({
            message: "Unauthorized",
        });
    }
    const user = await prisma.user.findUnique({
        where: {
            username: payload.username,
        },
    });

    let tagsString;

    // POST: save a new template
    // I'm intending this to be run before the user types any code
    // (e.g. a popup where the user will first define tht title, explanation, tags, etc)
    if (req.method === "POST") {
        const { title, explanation, tags, forkedSourceId } = req.body;
        if (!title) {
            return res.status(400).json({
            error: "Please provide a title",
            });
        }
        if (tags && !Array.isArray(tags)) {
            return res.status(400).json({
            error: "Tags should be an array of strings",
            });
        }
    
        if (tags) {
            tagsString = tags.join(",");
        }
        // the token only contains the username, so we need to query the user to get the id
        const template = await prisma.codeTemplate.create({
            data: {
            title,
            explanation,
            tags: tagsString,
            content: "",
            author: {
                connect: {
                id: user.id,
                },
            },
            forkedSourceId,
            },
        });
        return res.status(201).json(template);
    }

    // PUT: update an existing template
    if (req.method === "PUT") {
        const { id, title, explanation, tags, content } = req.body;
        if (!id) {
            return res.status(400).json({
                error: "Please provide a template id",
            });
        }
        if (tags && !Array.isArray(tags)) {
            console.log(tags);
            return res.status(400).json({
            error: "Tags should be an array of strings",
            });
        }
        if (tags) {
            tagsString = tags.join(",");
        }
        // check if the template exists, and if the author is the user
        const template = await prisma.codeTemplate.findUnique({
            where: {
                id: id,
            },
        });
        if (!template) {
            return res.status(404).json({
                message: "Template not found",
            });
        }
        if (template.authorId !== user.id && user.role !== "ADMIN") {
            return res.status(403).json({
                message: "You are not the author of this template",
            });
        }
        const updatedTemplate = await prisma.codeTemplate.update({
            where: {
                id: id,
            },
            data: {
                title,
                explanation,
                tags: tagsString,
                content,
            },
        });
        return res.status(200).json(updatedTemplate);
    }

    // DELETE: delete an existing template
    if (req.method === "DELETE") {
        const { id } = req.body;
        console.log(id);
        if (!id && id !== 0) {
            console.log(req.body.id);
            return res.status(400).json({
            error: "Please provide a template id",
            });
        }
        // check if the template exists
        const template = await prisma.codeTemplate.findUnique({
            where: {
                id: id,
            },
        });
        if (!template) {
            return res.status(404).json({
                message: "Template not found",
            });
        }
        // check if the user is the author, or is an admin
        if (template.authorId !== payload.id && user.role !== "ADMIN") {
            return res.status(403).json({
                message: "You are not the author of this template",
            });
        }
        await prisma.codeTemplate.delete({
            where: {
                id: id,
            },
        });
        return res.status(200).json({ message: "Template deleted" });
    }
    return res.status(405).json({ message: "Method not allowed" });
}