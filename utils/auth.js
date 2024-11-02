// auth functions for JWT

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const BCRYPT_SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS);
const SALT_LENGTH = parseInt(process.env.SALT_LENGTH);
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN_ACCESS = process.env.JWT_EXPIRES_IN_ACCESS;
const JWT_EXPIRES_IN_REFRESH = process.env.JWT_EXPIRES_IN_REFRESH;

export async function hashPassword(password, salt) {
  // double hashing with a salt as suggested by TA Amir during Mentor session
  const hashed = await bcrypt.hash(password, salt);
  return await bcrypt.hash(hashed, BCRYPT_SALT_ROUNDS);
}

export async function hashPasswordSaltOnly(password, salt) {
  // double hashing with a salt as suggested by TA
  return await bcrypt.hash(password, salt);
}

export async function comparePassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

export function generateAccessToken(obj) {
  return jwt.sign(obj, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN_ACCESS,
  });
}

export async function generateSalt() {
  return await bcrypt.genSalt(SALT_LENGTH)
}

export function generateRefreshToken(obj) {
  return jwt.sign(obj, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN_REFRESH,
  });
}

export function verifyToken(token) {
  if (!token?.startsWith("Bearer ")) {
    throw new Error('Token did not start with bearer')
    //return null;
  }

  token = token.split(" ")[1];

  if (token)
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (err) {
      // maybe it's expired
      throw new Error('Token verification error')
      // return null;
    }

}

export function verifyTokenLocal(token) {
  // if (!token?.startsWith("Bearer ")) {
  //   //throw new Error('Token did not start with bearer')
  //   return null;
  // }

  // token = token.split(" ")[1];

  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    //throw new Error('Token verification error')
    return null;
  }
}

export function attemptRefreshAccess(refreshToken) {
  // check the refresh token
  var payload = null
  try {
    // handle the refresh token (eventually, we should push the login page again if we get an expired token!!!!)
    payload = verifyTokenLocal(refreshToken);

    // false if we can't verify the refresh token
  } catch (err) {
    console.log(err)
    return false;
  }
  if (!payload) {
    return false;
  }

  // set to be a day from now
  var milliseconds_hour = new Date().getTime() + (1 * 60 * 60 * 1000);
  // one_hour_later.setHours(one_hour_later.getHours() + 1)
  const one_hour_later = new Date(milliseconds_hour)

  const Accesstoken = generateAccessToken({ role: payload.role, username: payload.username, expiresAt: one_hour_later });

  // log the tokens
  const now = new Date();
  const access_payload = verifyTokenLocal(Accesstoken)
  if (access_payload === null) {
    throw new Error('Could not verify access token')
  }
  console.log(`Access token created at: ${now} with expiration time: ${new Date(access_payload.expiresAt)}`)

  return Accesstoken
}


