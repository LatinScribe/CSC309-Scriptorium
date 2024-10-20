import prisma from "@/utils/db";
import { comparePassword, generateAccessToken, generateRefreshToken, verifyTokenLocal } from "@/utils/auth";

export default async function handler(req, res) {
    // only allows for POST
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { username, password } = req.body;

    // must provide username + password
    if (!username || !password) {
        return res.status(400).json({
            error: "Please provide all the required fields",
        });
    }

    // check if username + password valid
    const user = await prisma.user.findUnique({
        where: {
            username,
        },
    });

    if (!user || !(await comparePassword(password, user.password))) {
        return res.status(401).json({
            error: "Invalid credentials",
        });
    }

    // credentials valid, generating access and refresh tokens....
    // set to be an hour from now
    var milliseconds_hour = new Date().getTime() + (1 * 60 * 60 * 1000);
    // one_hour_later.setHours(one_hour_later.getHours() + 1)
    const one_hour_later = new Date(milliseconds_hour)

    // set to be a day from now
    var milliseconds_day = new Date().getTime() + (24 * 60 * 60 * 1000);
    // one_day_later.setDate(one_day_later.getDate() + 1)
    const one_day_later = new Date(milliseconds_day)

    const Accesstoken = generateAccessToken({ role: user.role, username: user.username, expiresAt: one_hour_later });
    const Refreshtoken = generateRefreshToken({ role: user.role, username: user.username, expiresAt: one_day_later });

    // log the tokens
    const now = new Date();
    const access_payload = verifyTokenLocal(Accesstoken)
    if (access_payload === null) {
        throw new Error('Could not verify access token')
    }
    console.log(`Access token created at: ${now} with expiration time: ${new Date(access_payload.expiresAt)}`)

    const refresh_payload = verifyTokenLocal(Refreshtoken)
    if (refresh_payload === null) {
        throw new Error('Could not verify refresh token')
    }
    console.log(`Access token created at: ${now} with expiration time: ${new Date(refresh_payload.expiresAt)}`)

    return res.status(200).json({
        "accessToken": Accesstoken,
        "refreshToken": Refreshtoken
    });
}