import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const BCRYPT_SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS);
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN_ACCESS = process.env.JWT_EXPIRES_IN_ACCESS;
const JWT_EXPIRES_IN_REFRESH = process.env.JWT_EXPIRES_IN_REFRESH;

export async function hashPassword(password) {
  return await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
}

export async function comparePassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

export function generateAccessToken(obj) {
  return jwt.sign(obj, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN_ACCESS,
  });
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