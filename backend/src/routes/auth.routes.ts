import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import * as bcrypt from 'bcryptjs';
import { sign } from 'hono/jwt';
import { eq, and } from 'drizzle-orm';
import crypto from 'crypto';
import { db } from '../db/index.js';
import { users, userAuthAccounts, sessions, verificationTokens, passwordResetTokens } from '../db/schema.js';
import { sendValidationEmail, sendPasswordResetEmail } from '../utils/mailer.js';

export const authRoutes = new Hono();

const emailSchema = z.object({
	email: z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/),
});

const registerSchema = emailSchema.extend({
	password: z.string().min(8),
});

const resetPasswordSchema = z.object({
	token: z.string(),
	password: z.string().min(8),
});

const googleAuthSchema = z.object({
	idToken: z.string(),
});

const refreshSchema = z.object({
	refreshToken: z.string(),
});

const verifyEmailSchema = z.object({
	token: z.string(),
});

function generateRandomToken() {
	return crypto.randomBytes(32).toString('hex');
}

function hashToken(token: string) {
	return crypto.createHash('sha256').update(token).digest('hex');
}

async function createSession(userId: string) {
	const refreshToken = generateRandomToken();
	const refreshTokenHash = hashToken(refreshToken);
	
	const expiresAt = new Date();
	expiresAt.setDate(expiresAt.getDate() + 30);

	const [session] = await db.insert(sessions).values({
		userId,
		refreshTokenHash,
		expiresAt,
	}).returning();

	const accessToken = await sign({
		sub: userId,
		sid: session.id,
		exp: Math.floor(Date.now() / 1000) + 15 * 60,
		iat: Math.floor(Date.now() / 1000)
	}, process.env.JWT_SECRET!);

	return { accessToken, refreshToken };
}

authRoutes.post('/register', zValidator('json', registerSchema), async (c) => {
	const { email, password } = c.req.valid('json');
	const normalizedEmail = email.trim().toLowerCase();

	const existingUser = await db.query.users.findFirst({
		where: eq(users.email, normalizedEmail),
	});

	if (existingUser) {
		return c.json({ error: 'Email already exists' }, 409);
	}

	const passwordHash = await bcrypt.hash(password, 10);

	const [newUser] = await db.insert(users).values({
		email: normalizedEmail,
		isEmailValidated: false,
	}).returning();

	await db.insert(userAuthAccounts).values({
		userId: newUser.id,
		provider: 'local',
		passwordHash,
	});

	const rawToken = generateRandomToken();
	const expiresAt = new Date();
	expiresAt.setHours(expiresAt.getHours() + 24);

	await db.insert(verificationTokens).values({
		userId: newUser.id,
		tokenHash: hashToken(rawToken),
		expiresAt,
	});

	await sendValidationEmail(newUser.email, rawToken);

	return c.json({ message: 'User created. Please validate email.', user: { id: newUser.id, email: newUser.email } }, 201);
});

authRoutes.get('/verify-email', async (c) => {
	const token = c.req.query('token');
	
	if (!token) {
		return c.json({ error: 'Missing token' }, 400);
	}

	const tokenHash = hashToken(token);

	const record = await db.query.verificationTokens.findFirst({
		where: eq(verificationTokens.tokenHash, tokenHash),
	});

	if (!record || new Date() > record.expiresAt) {
		return c.json({ error: 'Invalid or expired token' }, 401);
	}

	await db.update(users)
		.set({ isEmailValidated: true })
		.where(eq(users.id, record.userId));

	await db.delete(verificationTokens).where(eq(verificationTokens.id, record.id));

	return c.json({ message: 'Email successfully validated' }, 200);
});

authRoutes.post('/resend-verification', zValidator('json', emailSchema), async (c) => {
	const { email } = c.req.valid('json');
	const normalizedEmail = email.trim().toLowerCase();

	const user = await db.query.users.findFirst({
		where: eq(users.email, normalizedEmail),
	});

	if (!user || user.isEmailValidated) {
		return c.json({ message: 'If this email exists and is not verified, a new link has been sent.' }, 200);
	}

	await db.delete(verificationTokens).where(eq(verificationTokens.userId, user.id));

	const rawToken = generateRandomToken();
	const expiresAt = new Date();
	expiresAt.setHours(expiresAt.getHours() + 24);

	await db.insert(verificationTokens).values({
		userId: user.id,
		tokenHash: hashToken(rawToken),
		expiresAt,
	});

	await sendValidationEmail(user.email, rawToken);

	return c.json({ message: 'If this email exists and is not verified, a new link has been sent.' }, 200);
});

authRoutes.post('/login', zValidator('json', registerSchema), async (c) => {
	const { email, password } = c.req.valid('json');
	const normalizedEmail = email.trim().toLowerCase();

	const user = await db.query.users.findFirst({
		where: eq(users.email, normalizedEmail),
	});

	if (!user) {
		return c.json({ error: 'Invalid credentials' }, 401);
	}

	if (!user.isEmailValidated) {
		return c.json({ error: 'Please verify your email before logging in' }, 403);
	}

	const account = await db.query.userAuthAccounts.findFirst({
		where: and(eq(userAuthAccounts.userId, user.id), eq(userAuthAccounts.provider, 'local')),
	});

	if (!account || !account.passwordHash) {
		return c.json({ error: 'Invalid credentials' }, 401);
	}

	const isValid = await bcrypt.compare(password, account.passwordHash);
	if (!isValid) {
		return c.json({ error: 'Invalid credentials' }, 401);
	}

	const tokens = await createSession(user.id);

	return c.json({ tokens, user: { id: user.id, email: user.email, isEmailValidated: user.isEmailValidated } });
});

authRoutes.post('/refresh', zValidator('json', refreshSchema), async (c) => {
	const { refreshToken } = c.req.valid('json');
	const tokenHash = hashToken(refreshToken);

	const session = await db.query.sessions.findFirst({
		where: eq(sessions.refreshTokenHash, tokenHash),
	});

	if (!session || new Date() > session.expiresAt) {
		if (session) await db.delete(sessions).where(eq(sessions.id, session.id));
		return c.json({ error: 'Invalid or expired refresh token' }, 401);
	}

	await db.delete(sessions).where(eq(sessions.id, session.id));

	const tokens = await createSession(session.userId);

	return c.json({ tokens });
});

authRoutes.post('/logout', zValidator('json', refreshSchema), async (c) => {
	const { refreshToken } = c.req.valid('json');
	const tokenHash = hashToken(refreshToken);

	await db.delete(sessions).where(eq(sessions.refreshTokenHash, tokenHash));

	return c.json({ message: 'Logged out successfully' }, 200);
});

authRoutes.post('/forgot-password', zValidator('json', emailSchema), async (c) => {
	const { email } = c.req.valid('json');
	const normalizedEmail = email.trim().toLowerCase();

	const user = await db.query.users.findFirst({
		where: eq(users.email, normalizedEmail),
	});

	if (user) {
		const account = await db.query.userAuthAccounts.findFirst({
			where: and(eq(userAuthAccounts.userId, user.id), eq(userAuthAccounts.provider, 'local')),
		});

		if (account) {
			await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, user.id));

			const rawToken = generateRandomToken();
			const expiresAt = new Date();
			expiresAt.setMinutes(expiresAt.getMinutes() + 15);

			await db.insert(passwordResetTokens).values({
				userId: user.id,
				tokenHash: hashToken(rawToken),
				expiresAt,
			});

			await sendPasswordResetEmail(user.email, rawToken);
		}
	}

	return c.json({ message: 'If this email exists, a reset link has been sent.' }, 200);
});

authRoutes.post('/reset-password', zValidator('json', resetPasswordSchema), async (c) => {
	const { token, password } = c.req.valid('json');
	const tokenHash = hashToken(token);

	const record = await db.query.passwordResetTokens.findFirst({
		where: eq(passwordResetTokens.tokenHash, tokenHash),
	});

	if (!record || new Date() > record.expiresAt) {
		return c.json({ error: 'Invalid or expired token' }, 401);
	}

	const passwordHash = await bcrypt.hash(password, 10);

	await db.update(userAuthAccounts)
		.set({ passwordHash })
		.where(and(eq(userAuthAccounts.userId, record.userId), eq(userAuthAccounts.provider, 'local')));

	await db.delete(passwordResetTokens).where(eq(passwordResetTokens.id, record.id));
	await db.delete(sessions).where(eq(sessions.userId, record.userId));

	return c.json({ message: 'Password successfully updated' }, 200);
});

authRoutes.post('/google', zValidator('json', googleAuthSchema), async (c) => {
	const { idToken } = c.req.valid('json');

	try {
		const googleResponse = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);

		if (!googleResponse.ok) {
			return c.json({ error: 'Invalid Google token' }, 401);
		}

		const googleData = await googleResponse.json();

		if (googleData.aud !== process.env.GOOGLE_CLIENT_ID) {
			return c.json({ error: 'Token audience mismatch' }, 401);
		}

		const { email, sub: providerAccountId } = googleData;
		const normalizedEmail = email.trim().toLowerCase();

		let user = await db.query.users.findFirst({
			where: eq(users.email, normalizedEmail),
		});

		if (!user) {
			const [newUser] = await db.insert(users).values({
				email: normalizedEmail,
				isEmailValidated: true,
			}).returning();
			user = newUser;

			await db.insert(userAuthAccounts).values({
				userId: user.id,
				provider: 'google',
				providerAccountId,
			});
		} else {
			const account = await db.query.userAuthAccounts.findFirst({
				where: and(eq(userAuthAccounts.userId, user.id), eq(userAuthAccounts.provider, 'google')),
			});

			if (!account) {
				await db.insert(userAuthAccounts).values({
					userId: user.id,
					provider: 'google',
					providerAccountId,
				});
			} else if (account.providerAccountId !== providerAccountId) {
				return c.json({ error: 'Email registered with a different Google account' }, 409);
			}
		}

		const tokens = await createSession(user.id);

		return c.json({ tokens, user: { id: user.id, email: user.email, isEmailValidated: user.isEmailValidated } }, 200);

	} catch (error) {
		return c.json({ error: 'Authentication failed' }, 500);
	}
});
