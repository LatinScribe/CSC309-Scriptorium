// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

import { verifyToken } from "@/utils/auth";

export default function handler(req, res) {

  // api middleware
  var payload = null
  try{
  payload = verifyToken(req.headers.authorization);
  } catch (err) {
    console.log(err)
    return res.status(401).json({
      error: "Unauthorized",
    });
  }
  if (!payload) {
    return res.status(401).json({
      error: "Unauthorized",
    });
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