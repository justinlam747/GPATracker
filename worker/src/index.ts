import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env, AuthUser } from './types';
import { authMiddleware, ensureProfile } from './middleware/auth';
import gpaRoutes from './routes/gpa';
import userRoutes from './routes/user';
import healthRoutes from './routes/health';

const app = new Hono<{ Bindings: Env; Variables: { user: AuthUser } }>();

// CORS
app.use(
  '*',
  cors({
    origin: [
      'http://localhost:3000',
      'https://gpaconnect.me',
      'https://www.gpaconnect.me',
    ],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// Health check (public)
app.route('/api/health', healthRoutes);

// Auth check endpoint (replaces /api/auth/me)
app.get('/api/auth/me', authMiddleware, ensureProfile, async (c) => {
  const user = c.get('user');
  const profile = await c.env.DB.prepare('SELECT * FROM profiles WHERE id = ?')
    .bind(user.id)
    .first();

  if (!profile) {
    return c.json({ message: 'Profile not found' }, 404);
  }

  return c.json({
    id: profile.id,
    _id: profile.id,
    email: profile.email,
    firstName: profile.first_name,
    lastName: profile.last_name,
    institution: profile.institution,
    graduationYear: profile.graduation_year,
    gpaScale: profile.gpa_scale,
  });
});

// Protected routes
app.use('/api/gpa/*', authMiddleware, ensureProfile);
app.use('/api/user/*', authMiddleware, ensureProfile);

app.route('/api/gpa', gpaRoutes);
app.route('/api/user', userRoutes);

// 404 catch-all
app.all('*', (c) => {
  return c.json({ message: 'Not found' }, 404);
});

export default app;
