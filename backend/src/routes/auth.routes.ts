import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import * as bcrypt from 'bcryptjs';
import { sign } from 'hono/jwt';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';

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

    return c.json({ message: 'User created. Please validate email.', user: newUser }, 201);
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

const socialAuthSchema = z.object({
    provider: z.enum(['google', 'facebook']),
    providerId: z.string(),
    email: z.string().email().optional(),
});

authRoutes.post('/social', zValidator('json', socialAuthSchema), async (c) => {
    const { provider, providerId, email } = c.req.valid('json');

    let user = await db.query.users.findFirst({
        where: eq(users.providerId, providerId),
    });

    if (!user) {
        const [newUser] = await db.insert(users).values({
            email,
            provider,
            providerId,
            isEmailValidated: true,
        }).returning();
        user = newUser;
    }

    const token = await sign({ id: user.id, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 }, process.env.JWT_SECRET!);
    return c.json({ token, user: { id: user.id, email: user.email } });
});
