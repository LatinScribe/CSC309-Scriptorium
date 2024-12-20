import prisma from "@/utils/db";
import { attemptRefreshAccess, verifyToken, verifyTokenLocal } from "@/utils/auth";

const SUPPORTED_LANGUAGES = ["python", "javascript", "java", "cpp", "c", "rust", "go", "ruby", "php", "perl", "swift", "brainfuck"];

interface QueryParams {
    title?: string;
    tags?: string;
    content?: string;
    author?: string;
    page?: string;
    pageSize?: string;
}

interface BodyParams {
    title: string;
    explanation: string;
    tags: string[];
    forkedSourceId: string;
    language: string;
}

interface UpdateParams {
    id: string;
    title: string;
    explanation: string;
    tags: string[];
    content: string;
}

interface whereType {
    title?: {
        contains: string;
    };
    content?: {
        contains: string;
    };
    author?: {
        is: {
            username: {
                equals: string;
            };
        };
    };
}

import { NextApiRequest, NextApiResponse } from 'next';
import { CodeTemplate, User } from "@/utils/backendTypes";
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    // GET: return template metadata list based on filters (title, tags, content, author)
    if (req.method === "GET") {
        const { title, tags, content, author, page, pageSize } = req.query as QueryParams;
        if (tags && typeof tags !== "string") {
            return res.status(400).json({
                error: "Tags should be a string",
            });
        }
        if (page && isNaN(parseInt(page))) {
            return res.status(400).json({
                error: "Page should be a number",
            });
        }
        if (pageSize && isNaN(parseInt(pageSize))) {
            return res.status(400).json({
                error: "Page size should be a number",
            });
        }
        if (content && typeof content !== "string") {
            return res.status(400).json({
                error: "Content should be a string",
            });
        }
        if (author && typeof author !== "string") {
            return res.status(400).json({
                error: "Author should be a string",
            });
        }
        let where: whereType = {};
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
                is: {
                    username: {
                        equals: author,
                    },
                },
            };
        }
        if (!page || !pageSize) {
            return res.status(400).json({
                error: "Please provide page and page size",
            });
        }
        let templates = await prisma.codeTemplate.findMany({
            where: where,
            select: {
                id: true,
                title: true,
                tags: true,
                explanation: true,
                author: {
                    select: {
                        username: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        avatar: true,
                        role: true,
                        createdAt: true,
                    },
                },
                deleted: true,
                modifiedAt: true,
                language: true,
            },
        }) as CodeTemplate[];
        // filter out all deleted templates
        templates = templates.filter((template) => !template.deleted);
        // filter all templates that have all the tags
        if (tags) {
            templates = templates.filter((template) => {
                return template.tags !== null && tags.split(',').every(tag => template.tags!.split(',').includes(tag));
            });
        }
        const start = (parseInt(page) - 1) * parseInt(pageSize);
        const end = start + parseInt(pageSize);
        const paginatedTemplates = templates.slice(start, end);
        return res.status(200).json({
            templates: paginatedTemplates,
            pagination: {
                totalSize: templates.length,
                totalPages: Math.ceil(templates.length / parseInt(pageSize)),
                page: parseInt(page),
                pageSize: parseInt(pageSize),
            }
        })
    }

    // We now check if the user is authenticated
    // var payload = null
    // try {
    //     payload = verifyToken(req.headers.authorization);
    // } catch (err) {
    //     console.log(err);
    //     return res.status(401).json({
    //         error: "Unauthorized",
    //     });
    // }
    // if (!payload) {
    //     return res.status(401).json({
    //         error: "Unauthorized",
    //     });
    // }

    // api middleware (USE THIS TO REFRESH/GET THE TOKEN DATA)
    // ======== TOKEN HANDLING STARTS HERE ==========
    var payload = null
    const x_refreshToken = req.headers['x-refresh-token'];
    try {
        // attempt to verify the provided access token!!
        payload = verifyToken(req.headers.authorization);
    } catch (err) {
        // this happens if we can't succesfully verify the access token!!
        try {
            // attempt to refresh access token using refresh token
            console.log(err)
            let new_accessToken
            if (x_refreshToken) {
                new_accessToken = attemptRefreshAccess(x_refreshToken);
            } else {
                // no Refresh token, so we have Token Error
                return res.status(401).json({
                    error: "Token Error",
                });
            }
            if (!new_accessToken) {
                // new access token not generated!
                return res.status(401).json({
                    error: "Token Error",
                });
            }
            // set the payload to be correct using new access token
            payload = verifyTokenLocal(new_accessToken)

            if (!payload) {
                // new access token not generated!
                return res.status(401).json({
                    error: "Token Error",
                });
            }
        } catch (err) {
            // refresh token went wrong somewhere, push token error
            console.log(err)
            return res.status(401).json({
                error: "Token Error",
            });
        }
    }
    if (!payload) {
        // access token verification failed
        try {
            // attempt to refresh access token with refresh token
            let new_accessToken
            if (x_refreshToken) {
                new_accessToken = attemptRefreshAccess(x_refreshToken);
            } else {
                // no Refresh token, so we have Token Error
                return res.status(401).json({
                    error: "Token Error",
                });
            }
            if (!new_accessToken) {
                // new access token not generated!
                return res.status(401).json({
                    error: "Token Error",
                });
            }
            // set the payload to be correct using new access token
            payload = verifyTokenLocal(new_accessToken)

            if (!payload) {
                // new access token not generated!
                return res.status(401).json({
                    error: "Token Error",
                });
            }
        } catch (err) {
            console.log(err)
            return res.status(401).json({
                error: "Token Error",
            });
        }
    }

    // if we get here, assume that payload is correct!
    // ========== TOKEN HANDLING ENDS HERE ==========

    const user = await prisma.user.findUnique({
        where: {
            username: payload.username,
        },
    }) as User;

    let tagsString;

    // POST: save a new template
    // I'm intending this to be run before the user types any code
    // (e.g. a popup where the user will first define tht title, explanation, tags, etc)
    if (req.method === "POST") {
        const { title, explanation, tags, forkedSourceId, language }: BodyParams = req.body;
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
        if (forkedSourceId && typeof forkedSourceId !== "number") {
            return res.status(400).json({
                error: "Forked source id should be a number",
            });
        }
        if (!forkedSourceId && !language) {
            return res.status(400).json({
                error: "Please provide a language",
            });
        }
        if (language && typeof language !== "string") {
            return res.status(400).json({
                error: "Language should be a string",
            });
        }
        if (language && !SUPPORTED_LANGUAGES.includes(language)) {
            return res.status(400).json({
                error: "Invalid language",
            });
        }

        if (tags) {
            tagsString = tags.join(",");
        }

        let content = "";
        let templateLanguage = language;

        if (forkedSourceId) {
            const source = await prisma.codeTemplate.findUnique({
                where: {
                    id: parseInt(forkedSourceId),
                },
            }) as CodeTemplate;
            if (!source) {
                return res.status(404).json({
                    error: "Source template not found",
                });
            }
            if (!source.content) {
                content = ''
            } else {
                content = source.content;
            }
            templateLanguage = source.language;
        }
        // the token only contains the username, so we need to query the user to get the id
        if (!user) {
            return res.status(401).json({
                error: "Unauthorized",
            });
        }
        const template = await prisma.codeTemplate.create({
            data: {
                title,
                explanation,
                tags: tagsString,
                content,
                author: {
                    connect: {
                        id: user.id,
                    },
                },
                forkedSourceId: forkedSourceId ? parseInt(forkedSourceId) : undefined,
                language: templateLanguage,
                deleted: false,
            },
        }) as CodeTemplate;
        return res.status(201).json(template);
    }

    // PUT: update an existing template
    if (req.method === "PUT") {
        const { id, title, explanation, tags, content }: UpdateParams = req.body;
        if (!id) {
            return res.status(400).json({
                error: "Please provide a template id",
            });
        }
        if (isNaN(parseInt(id))) {
            return res.status(400).json({
                error: "Template id should be a number",
            });
        }
        if (title && typeof title !== "string") {
            return res.status(400).json({
                error: "Title should be a string",
            });
        }
        if (explanation && typeof explanation !== "string") {
            return res.status(400).json({
                error: "Explanation should be a string",
            });
        }
        if (content && typeof content !== "string") {
            return res.status(400).json({
                error: "Content should be a string",
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
                id: parseInt(id),
            },
        });
        if (!template || template.deleted) {
            return res.status(404).json({
                error: "Template not found",
            });
        }
        if (!user || (template.authorId !== user.id && user.role !== "ADMIN")) {
            return res.status(403).json({
                error: "You are not the author of this template",
            });
        }
        const updatedTemplate = await prisma.codeTemplate.update({
            where: {
                id: parseInt(id),
            },
            data: {
                title,
                explanation,
                tags: tagsString,
                content,
                modifiedAt: new Date(),
            },
        }) as CodeTemplate;
        return res.status(200).json(updatedTemplate);
    }

    // DELETE: delete an existing template
    if (req.method === "DELETE") {
        const { id } = req.body;
        if (!id && id !== 0) {
            console.log(req.body.id);
            return res.status(400).json({
                error: "Please provide a template id",
            });
        }
        if (isNaN(parseInt(id))) {
            return res.status(400).json({
                error: "Template id should be a number",
            });
        }
        // check if the template exists
        const template = await prisma.codeTemplate.findUnique({
            where: {
                id: id,
            },
        }) as CodeTemplate;
        if (!template || template.deleted) {
            return res.status(404).json({
                error: "Template not found",
            });
        }
        console.log(template.authorId);
        // check if the user is the author, or is an admin
        if (!user || (template.authorId !== user.id && user.role !== "ADMIN")) {
            return res.status(403).json({
                error: "You are not the author of this template",
            });
        }
        // set the deleted flag to true
        await prisma.codeTemplate.update({
            where: {
                id: id,
            },
            data: {
                deleted: true,
            },
        });
        return res.status(200).json({ message: "Template deleted" });
    }
    return res.status(405).json({ error: "Method not allowed" });
}