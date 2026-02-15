import jwt from 'jsonwebtoken';
import cookie from 'cookie';
import { IncomingMessage, ServerResponse } from 'http';

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret-in-production';
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'admin123';

export interface AdminPayload {
  username: string;
  role: 'admin';
  iat?: number;
  exp?: number;
}

export function verifyAdmin(username: string, password: string): boolean {
  return username === ADMIN_USER && password === ADMIN_PASS;
}

export function generateAdminToken(username: string): string {
  const payload: AdminPayload = {
    username,
    role: 'admin',
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

export function verifyToken(token: string): AdminPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AdminPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

export function setAuthCookie(res: ServerResponse, token: string): void {
  const cookieValue = cookie.serialize('admin_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 86400, // 24 hours
    path: '/',
  });
  
  res.setHeader('Set-Cookie', cookieValue);
}

export function clearAuthCookie(res: ServerResponse): void {
  const cookieValue = cookie.serialize('admin_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
  });
  
  res.setHeader('Set-Cookie', cookieValue);
}

export function getTokenFromRequest(req: IncomingMessage): string | null {
  const cookies = cookie.parse(req.headers.cookie || '');
  return cookies.admin_token || null;
}

export function requireAdmin(req: IncomingMessage): AdminPayload {
  const token = getTokenFromRequest(req);
  
  if (!token) {
    throw new Error('No authentication token');
  }
  
  const payload = verifyToken(token);
  
  if (!payload || payload.role !== 'admin') {
    throw new Error('Invalid or expired token');
  }
  
  return payload;
}
