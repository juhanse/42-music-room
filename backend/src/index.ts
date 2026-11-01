import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { authRoutes } from './routes/auth.routes.js';
import { authMiddleware } from './middlewares/auth.js';

type Variables = {
	jwtPayload: {
		id: string;
		exp: number;
	};
};

const app = new Hono<{ Variables: Variables }>();

app.use('*', logger());
app.use('*', cors());

app.route('/api/auth', authRoutes);

app.get('/api/protected', authMiddleware, (c) => {
	const payload = c.get('jwtPayload');
	return c.json({ message: 'Access granted', userId: payload.id });
});

const port = parseInt(process.env.PORT || '3000');
console.log(`Server is running on port ${port}`);

serve({
	fetch: app.fetch,
	port
});
