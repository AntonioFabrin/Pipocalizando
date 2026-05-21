import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload } from '../types';
import { normalizeRole } from '../utils/roles';

const JWT_SECRET = process.env.JWT_SECRET!;

const getCookieValue = (cookieHeader: string | undefined, name: string): string | null => {
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(';').map((cookie) => cookie.trim());
  const match = cookies.find((cookie) => cookie.startsWith(`${name}=`));
  if (!match) return null;

  return decodeURIComponent(match.slice(name.length + 1));
};

const setAuthCookie = (res: Response, token: string) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie('access_token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
};

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  const cookieToken = getCookieValue(req.headers.cookie, 'access_token');
  const token = bearerToken || cookieToken;

  if (!token) {
    res.status(401).json({ message: 'Token nao fornecido.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    if (bearerToken && !cookieToken) {
      setAuthCookie(res, bearerToken);
    }
    (req as any).user = {
      ...decoded,
      role: normalizeRole(decoded.role),
    };
    next();
  } catch {
    res.status(401).json({ message: 'Token invalido ou expirado.' });
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
