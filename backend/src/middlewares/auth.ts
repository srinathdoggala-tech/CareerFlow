import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'careerflow_secret_key';

export interface AuthRequest extends Request {
  userId?: string;
  userEmail?: string;
}

export const authenticateJWT = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1];

    jwt.verify(token, JWT_SECRET, (err, decoded: any) => {
      if (err) {
        return res.status(403).json({ error: 'Invalid or expired token' });
      }

      req.userId = decoded.id;
      req.userEmail = decoded.email;
      next();
    });
  } else {
    res.status(401).json({ error: 'Authorization token required' });
  }
};
