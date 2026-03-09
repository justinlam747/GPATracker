import { Context, Next } from 'hono';
import { jwtVerify } from 'jose';
import type { Env, AuthUser } from '../types';

// Verify Supabase JWT and attach user to context
export async function authMiddleware(c: Context<{ Bindings: Env; Variables: { user: AuthUser } }>, next: Next) {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ message: 'Access token required', code: 'ACCESS_TOKEN_MISSING' }, 401);
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const secret = new TextEncoder().encode(c.env.SUPABASE_JWT_SECRET);
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ['HS256'],
    });

    if (!payload.sub || !payload.email) {
      return c.json({ message: 'Invalid token payload', code: 'INVALID_TOKEN' }, 401);
    }

    c.set('user', {
      id: payload.sub,
      email: payload.email as string,
    });

    await next();
  } catch (err) {
    return c.json({ message: 'Invalid or expired token', code: 'INVALID_ACCESS_TOKEN' }, 401);
  }
}

// Auto-create profile row on first authenticated request
export async function ensureProfile(c: Context<{ Bindings: Env; Variables: { user: AuthUser } }>, next: Next) {
  const user = c.get('user');
  const db = c.env.DB;

  const existing = await db.prepare('SELECT id FROM profiles WHERE id = ?').bind(user.id).first();
  if (!existing) {
    await db
      .prepare(
        `INSERT INTO profiles (id, email, first_name) VALUES (?, ?, ?)`
      )
      .bind(user.id, user.email, '')
      .run();
  }

  await next();
}
