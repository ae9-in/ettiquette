import jwt, { JwtPayload } from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

type AuthUser = {
  userId: string;
  role: string;
};

type JWTUserPayload = JwtPayload & {
  userId?: string;
  id?: string;
  role?: string;
};

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

function sendAuthError(
  res: Response,
  status: number,
  message: string,
  details?: string
) {
  // FIX: Keep auth errors in one consistent JSON shape.
  return res.status(status).json({
    success: false,
    message,
    ...(details ? { details } : {}),
  });
}

export function authMiddlewareFactory(jwtSecret: string) {
  return function authMiddleware(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    const rawHeader = req.headers.authorization;

    if (!rawHeader) {
      return sendAuthError(res, 401, 'Authorization header is missing');
    }

    if (!rawHeader.startsWith('Bearer ')) {
      return sendAuthError(
        res,
        401,
        'Authorization header format must be: Bearer <token>'
      );
    }

    const token = rawHeader.slice('Bearer '.length).trim();
    if (!token) {
      return sendAuthError(res, 401, 'Token is missing');
    }

    try {
      const decoded = jwt.verify(token, jwtSecret) as JWTUserPayload;
      const userId = decoded.userId || decoded.id;
      const role = decoded.role;

      if (!userId || !role) {
        return sendAuthError(res, 401, 'Token payload is invalid');
      }

      req.user = { userId, role };
      next();
    } catch (error: any) {
      if (error?.name === 'TokenExpiredError') {
        return sendAuthError(res, 401, 'Token expired');
      }
      return sendAuthError(res, 401, 'Invalid token');
    }
  };
}

