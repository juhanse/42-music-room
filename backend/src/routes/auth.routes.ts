import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import * as bcrypt from 'bcryptjs';
import { sign, verify } from 'hono/jwt';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { sendValidationEmail } from '../utils/mailer.js';

export const authRoutes = new Hono();

const registerSchema = z.object({
	email: z.string().email(),
	password: z.string().min(6),
});

authRoutes.post('/register', zValidator('json', registerSchema), async (c) => {
	const { email, password } = c.req.valid('json');
	
	const existingUser = await db.query.users.findFirst({
		where: eq(users.email, email),
	});

	if (existingUser) {
		return c.json({ error: 'Email already exists' }, 409);
	}

	const passwordHash = await bcrypt.hash(password, 10);
	
	const [newUser] = await db.insert(users).values({
		email,
		passwordHash,
		provider: 'local',
		isEmailValidated: false,
	}).returning({ id: users.id, email: users.email });

	const validationToken = await sign({ id: newUser.id, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 }, process.env.JWT_SECRET!);
	
	await sendValidationEmail(newUser.email!, validationToken);

	return c.json({ message: 'User created. Please validate email.', user: newUser }, 201);
});

authRoutes.get('/validate', async (c) => {
	const token = c.req.query('token');
	
	if (!token) {
		return c.json({ error: 'Missing token' }, 400);
	}

	try {
		const payload = await verify(token, process.env.JWT_SECRET!, 'HS256');

		await db.update(users)
			.set({ isEmailValidated: true })
			.where(eq(users.id, payload.id as string));

		return c.json({ message: 'Email successfully validated' }, 200);
	} catch (e) {
		return c.json({ error: 'Invalid or expired token' }, 401);
	}
});

authRoutes.post('/login', zValidator('json', registerSchema), async (c) => {
	const { email, password } = c.req.valid('json');

	const user = await db.query.users.findFirst({
		where: eq(users.email, email),
	});

	if (!user || !user.passwordHash) {
		return c.json({ error: 'Invalid credentials' }, 401);
	}

	const isValid = await bcrypt.compare(password, user.passwordHash);
	if (!isValid) {
		return c.json({ error: 'Invalid credentials' }, 401);
	}

	const token = await sign({ id: user.id, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 }, process.env.JWT_SECRET!);
	
	return c.json({ token, user: { id: user.id, email: user.email, isEmailValidated: user.isEmailValidated } });
});
