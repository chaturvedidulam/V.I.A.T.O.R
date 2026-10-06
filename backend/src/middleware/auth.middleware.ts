import { NextFunction, Request, Response } from "express";
import { auth } from "../config/firebase";
import { errorResponse } from "../utils/apiResponse";

export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    name?: string;
    picture?: string;
  };
}

export async function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authorization = req.headers.authorization;

    if (!authorization) {
      return errorResponse(
        res,
        "Authentication token is required.",
        "AUTH_001",
        401
      );
    }

    if (!authorization.startsWith("Bearer ")) {
      return errorResponse(
        res,
        "Invalid authentication format.",
        "AUTH_001",
        401
      );
    }

    const token = authorization.substring(7);

    if (!token) {
      return errorResponse(
        res,
        "Authentication token is required.",
        "AUTH_001",
        401
      );
    }

    const decodedToken = await auth.verifyIdToken(token);

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name,
      picture: decodedToken.picture,
    };

    next();
  } catch (error) {
    console.error("Authentication error:", error);

    return errorResponse(
      res,
      "Invalid or expired authentication token.",
      "AUTH_001",
      401
    );
  }
}