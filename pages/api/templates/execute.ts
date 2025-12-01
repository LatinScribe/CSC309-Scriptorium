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
    "cpp": "cpp",
    "rust": "rs",
    "go": "go",
    "ruby": "rb",
    "php": "php",
    "perl": "pl",
    "swift": "swift",
    "brainfuck": "bf",
};

const dockerImages = {
    python: "python:3.13-alpine",
    javascript: "node:23-alpine",
    java: "openjdk:24",
    c: "gcc:14",
    cpp: "gcc:14",
    rust: "rust:1.82-alpine",
    go: "golang:1.23-alpine",
    ruby: "ruby:3.3-alpine",
    php: "php:8.2-alpine",
    perl: "perl:5.40-slim",
    swift: "swift:6.0",
    brainfuck: "sergiomtzlosa/brainfuck"
};

const TIME_LIMIT = 60000; // we're almost as generous as Azure Functions! (i'm throwing shade at them)
const MEMORY_LIMIT = '128m';
const CPU_LIMIT = 0.5

function getDockerCommand(language: keyof typeof dockerImages, directory: string, fileName: string) {
    const image = dockerImages[language];
    let command;

    switch (language) {
        case "python":
            command = `python3 /code/${fileName}`;
            break;
        case "javascript":
            command = `node /code/${fileName}`;
            break;
        case "java":
            const filePath = path.join(directory, fileName);
            const fileContent = fs.readFileSync(filePath, 'utf8');
            const classNameMatch = fileContent.match(/public\s+class\s+(\w+)/);
            if (classNameMatch) {
                const className = classNameMatch[1];
                const newFileName = `${className}.java`;
                const newFilePath = path.join(directory, newFileName);
                fs.renameSync(filePath, newFilePath);
                command = `javac /code/${newFileName} && java -cp /code ${className}`;
            } else {
                command = `javac /code/${fileName} && java -cp /code ${fileName.replace(/\.java$/, "")}`;
            }
            break;
        case "c":
            command = `gcc /code/${fileName} -o /code/${fileName.replace(/\.c$/, "")} && /code/${fileName.replace(/\.c$/, "")} && rm /code/${fileName.replace(/\.c$/, "")}`;
            break;
        case "cpp":
            command = `g++ /code/${fileName} -o /code/${fileName.replace(/\.cpp$/, "")} && /code/${fileName.replace(/\.cpp$/, "")} && rm /code/${fileName.replace(/\.cpp$/, "")}`;
            break;
        case "rust":
            command = `rustc /code/${fileName} -o /code/${fileName.replace(/\.rs$/, "")} && /code/${fileName.replace(/\.rs$/, "")}`;
            break;
        case "go":
            command = `go run /code/${fileName}`;
            break;
        case "ruby":
            command = `ruby /code/${fileName}`;
            break;
        case "php":
            command = `php /code/${fileName}`;
            break;
        case "perl":
            command = `perl /code/${fileName}`;
            break;
        case "swift":
            command = `swift /code/${fileName}`;
            break;
        case "brainfuck":
            command = `brainfuck /code/${fileName}`;
            break;
        default:
            throw new Error("Unsupported language");
    }

    return `docker run --rm -it -v ${directory}:/code:ro --user 1000 --memory=${MEMORY_LIMIT} --cpus=${CPU_LIMIT} --security-opt no-new-privileges ${image} sh -c "${command}"`;
}

interface ExecuteRequest {
    code: string;
    language: string;
    input: string[];
}

import { NextApiRequest, NextApiResponse } from 'next';
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    // input will be an array of strings (for stdin), or an empty array

    const body: ExecuteRequest = req.body;
    const { code, language, input } = body;

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
    if (!(language in fileExtension)) {
        return res.status(400).json({
            error: "Invalid language, supported languages are: " + Object.keys(fileExtension).join(", "),
        });
    }

    // execute the code
    const identifier = uuidv4();
    const directory = path.join("/tmp", identifier);
    const fileName = `main.${fileExtension[language as keyof typeof fileExtension]}`;
    const filePath = path.join(directory, fileName);
    if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
    }
    try {
        fs.writeFileSync(filePath, code);
        console.log('file created')

        const command = getDockerCommand(language as keyof typeof dockerImages, directory, fileName);
        const child = spawn(command, { shell: true });

        if (input.length > 0) {
            child.stdin.write(input.join("\n") + "\n");
        }
        child.stdin.end();

        let stdout = "";
        let stderr = "";

        const timeout = setTimeout(() => {
            child.kill();
            stderr += "\nExecution timed out. Templates may only run for 60 seconds, including compilation time. To access more resources, please purchase a Scriptorium Plus subscription, now only for $999,999,999.99!";
        }, TIME_LIMIT);

        child.stdout.on("data", (data) => {
            stdout += data.toString();
        });

        child.stderr.on("data", (data) => {
            stderr += data.toString();
        });

        child.on("close", (code) => {
            clearTimeout(timeout);
            try {
                console.log("Deleting directory " + directory);
                fs.rmdirSync(directory, { recursive: true });
                console.log("Directory deleted");
            } catch (error) {
                console.error("Error deleting the directory:", error);
            }
            return res.status(200).json({
                output: stdout,
                error: stderr
            });
        });

    } catch (error) {
        console.error("Error writing the file:", error);
        return res.status(500).json({
            error: "Internal server error",
        });
    }
}
