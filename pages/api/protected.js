// EXAMPLE OF A LOGGED IN PROTECTED PATH

import { verifyToken, attemptRefreshAccess, verifyTokenLocal } from "@/utils/auth";

export default function handler(req, res) {

  // api middleware
  // const { x_refreshToken } = req.headers;
  // var payload = null
  // try {
  //   payload = verifyToken(req.headers.authorization);
  // } catch (err) {
  //   try {
  //     // attempt to refresh access token using refresh token
  //     console.log(err)
  //     let new_accessToken
  //     if (x_refreshToken) {
  //       new_accessToken = attemptRefreshAccess(x_refreshToken);
  //     } else {
  //       return res.status(401).json({
  //         message: "Unauthorized",
  //       });
  //     }
  //     if (!new_accessToken) {
  //       return res.status(401).json({
  //         message: "Unauthorized",
  //       });
  //     }
  //     payload = verifyTokenLocal(new_accessToken)
  //   } catch (err) {
  //     console.log(err)
  //     return res.status(401).json({
  //       message: "Unauthorized",
  //     });
  //   }
  // }
  // if (!payload) {
  //   try {
  //     // attempt to refresh access token with refresh token
  //     let new_accessToken
  //     if (x_refreshToken) {
  //       new_accessToken = attemptRefreshAccess(x_refreshToken);
  //     } else {
  //       return res.status(401).json({
  //         message: "Unauthorized",
  //       });
  //     }
  //     if (!new_accessToken) {
  //       return res.status(401).json({
  //         message: "Unauthorized",
  //       });
  //     }
  //     payload = verifyTokenLocal(new_accessToken)
  //   } catch (err) {
  //     console.log(err)
  //     return res.status(401).json({
  //       message: "Unauthorized",
  //     });
  //   }
  // }

  // api middleware (USE THIS TO REFRESH/GET THE TOKEN DATA)
  // ======== TOKEN HANDLING STARTS HERE ==========
  var payload = null
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

  // actual api starts
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  res.status(200).json({ username: payload.username, role: payload.role });

}
