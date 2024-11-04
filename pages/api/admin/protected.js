// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
// EXAMPLE OF A LOGGED IN + ADMIN PROTECTED PATH

import { verifyToken, attemptRefreshAccess, verifyTokenLocal } from "@/utils/auth";

export default function handler(req, res) {

  // api middleware
  const { x_refreshToken } = req.headers;
  var payload = null
  try {
    payload = verifyToken(req.headers.authorization);
  } catch (err) {
    try {
      // attempt to refresh access token using refresh token
      console.log(err)
      let new_accessToken
      if (x_refreshToken) {
        new_accessToken = attemptRefreshAccess(x_refreshToken);
      } else {
        return res.status(401).json({
          message: "Unauthorized",
        });
      }
      if (!new_accessToken) {
        return res.status(401).json({
          message: "Unauthorized",
        });
      }
      payload = verifyTokenLocal(new_accessToken)
    } catch (err) {
      console.log(err)
      return res.status(401).json({
        message: "Unauthorized",
      });
    }
  }
  if (!payload) {
    try {
      // attempt to refresh access token with refresh token
      let new_accessToken
      if (x_refreshToken) {
        new_accessToken = attemptRefreshAccess(x_refreshToken);
      } else {
        return res.status(401).json({
          message: "Unauthorized",
        });
      }
      if (!new_accessToken) {
        return res.status(401).json({
          message: "Unauthorized",
        });
      }
      payload = verifyTokenLocal(new_accessToken)
    } catch (err) {
      console.log(err)
      return res.status(401).json({
        message: "Unauthorized",
      });
    }
  }

  if (payload.role !== "ADMIN") {
    return res.status(403).json({
      error: "Forbidden",
    });
  }

  // actual api starts
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  res.status(200).json({ username: payload.username, role: payload.role });

}