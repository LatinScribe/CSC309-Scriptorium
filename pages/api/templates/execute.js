import prisma from "@/utils/db";
import { v4 as uuidv4 } from 'uuid';
import os from 'os';
import path from "path";
import fs from "fs";
import { exec, spawn } from "child_process";

const fileExtension = {
    "python": "py",
    "javascript": "js",
    "java": "java",
    "c": "c",
    "c++": "cpp",
};

function getCommand(language, filePath) {
    switch (language) {
        case "python":
            return `python3 ${filePath}`;
        case "javascript":
            return `node ${filePath}`;
        case "java":
            return `javac ${filePath} && java ${filePath.replace(/\.java$/, "")}`;
        case "c":
            return `gcc ${filePath} -o ${filePath.replace(/\.c$/, "")} && ${filePath.replace(/\.c$/, "")}`;
        case "c++":
            return `g++ ${filePath} -o ${filePath.replace(/\.cpp$/, "")} && ${filePath.replace(/\.cpp$/, "")}`;
        default:
            return null;
    }
}

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    // input will be an array of strings (for stdin), or an empty array
    const { code, language, input } = req.body;

    if (!code || !language || !input) {
        return res.status(400).json({
            error: "Input, code, and language are required",
        });
    }
    if (typeof code !== "string" || typeof language !== "string") {
        return res.status(400).json({
            error: "Code and language should be strings",
        });
    }
    if (!input || !Array.isArray(input) || input.some((i) => typeof i !== "string")) {
        return res.status(400).json({
            error: "Input should be an array",
        });
    }
    if (!fileExtension[language]) {
        return res.status(400).json({
            error: "Invalid language, supported languages are: " + Object.keys(fileExtension).join(", "),
        });
    }

    // execute the code
    // i'm on a mac, so
    const directory = './';
    const fileName = path.join(directory, `${uuidv4()}.${fileExtension[language]}`);
    console.log(fileName);
    try {
        fs.writeFileSync(fileName, code);
        console.log('file created')

        const command = getCommand(language, fileName);
        const child = spawn(command, { shell: true });

        child.stdin.write(input.join("\n"));
        child.stdin.end();

        let stdout = "";
        let stderr = "";

        child.stdout.on("data", (data) => {
            stdout += data.toString();
        });

        child.stderr.on("data", (data) => {
            stderr += data.toString();
        });

        child.on("close", (code) => {
            try {
                fs.unlinkSync(fileName);
            } catch (error) {
                console.error("Error deleting the file:", error);
            }

            if (code !== 0) {
                return res.status(400).json({
                    message: "Error executing the code",
                    error: stderr,
                });
            }
            return res.status(200).json({
                output: stdout,
            });
        });

    } catch (error) {
        console.error("Error writing the file:", error);
        return res.status(500).json({
            error: "Internal server error",
        });
    }
}
