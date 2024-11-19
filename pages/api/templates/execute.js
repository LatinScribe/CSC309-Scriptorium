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
};

const dockerImages = {
    python: "custom-python:3.11",
    javascript: "custom-node:16",
    java: "custom-java:11",
    c: "custom-c:11",
    cpp: "custom-cpp:11",
};

function getDockerCommand(language, directory, fileName) {
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
        default:
            throw new Error("Unsupported language");
    }

    return `docker run --rm -i -v ${directory}:/code ${image} sh -c "${command}"`;
}

// function getCommand(language, filePath) {
//     switch (language) {
//         case "python":
//             return `python3 ${filePath}`;
//         case "javascript":
//             return `node ${filePath}`;
//         case "java":
//             return `javac ${filePath} && java ${filePath.replace(/\.java$/, "")}`;
//         case "c":
//             return `gcc ${filePath} -o ${filePath.replace(/\.c$/, "")} && ${filePath.replace(/\.c$/, "")}`;
//         case "cpp":
//             return `g++ ${filePath} -o ${filePath.replace(/\.cpp$/, "")} && ${filePath.replace(/\.cpp$/, "")}`;
//         default:
//             return null;
//     }
// }

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
    const directory = path.resolve("./");
    const fileName = `${uuidv4()}.${fileExtension[language]}`;
    const filePath = path.join(directory, fileName);
    try {
        fs.writeFileSync(filePath, code);
        console.log('file created')

        const command = getDockerCommand(language, directory, fileName);
        const child = spawn(command, { shell: true });

        if (input.length > 0) {
            child.stdin.write(input.join("\n") + "\n");
        }
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
                console.log("Deleting file " + filePath);
                fs.unlinkSync(filePath);
                console.log("File deleted");
            } catch (error) {
                console.error("Error deleting the file:", error);
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
