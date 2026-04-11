import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { sql } from '@/lib/db';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
}

interface JwtPayload {
  userId: { id: number; role: string } | number;
  id?: number;
  role?: string;
  iat: number;
  exp: number;
}

/**
 * Reads the `token` cookie, verifies it, and fetches name + email from the DB.
 * Returns { user } or null if unauthenticated / token invalid.
 */
export async function auth(): Promise<{ user: AuthUser } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;

  let decoded: JwtPayload;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
  } catch {
    return null;
  }

  // Backend signs as { userId: { id, role } } via generateToken({ id, role })
  const userId =
    typeof decoded.userId === 'object' && decoded.userId !== null
      ? decoded.userId.id
      : typeof decoded.userId === 'number'
        ? decoded.userId
        : decoded.id;

  if (!userId) return null;

  const rows = await sql<{ id: number; name: string; email: string }[]>`
    SELECT id, name, email FROM users WHERE id = ${userId} LIMIT 1
  `;
  if (rows.length === 0) return null;

  return { user: rows[0] };
}
