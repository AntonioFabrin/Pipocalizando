import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload } from '../types';
import { normalizeRole } from '../utils/roles';

const JWT_SECRET = process.env.JWT_SECRET!;

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Token não fornecido.' });
    return;
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    (req as any).user = {
      ...decoded,
      role: normalizeRole(decoded.role),
    };
    next();
  } catch {
    res.status(401).json({ message: 'Token inválido ou expirado.' });
  }
};

export const roleMiddleware = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user;
    const normalizedRole = normalizeRole(user.role);
    if (!roles.includes(normalizedRole)) {
      res.status(403).json({
        message: `Acesso negado. Requer um dos perfis: ${roles.join(', ')}.`,
      });
      return;
    }
    next();
  };
};
