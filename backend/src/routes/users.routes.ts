import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { authMiddleware } from '../middlewares/auth.js';
import { subMiddleware } from '../middlewares/subscription.js';
import type { AccessTokenPayload, SubscriptionPlan } from '@musicroom/shared';

export const usersRoutes = new Hono<{ Variables: { jwtPayload: AccessTokenPayload } }>();

const updateProfileSchema = z.object({
	publicInfo: z.record(z.string(), z.any()).optional(),
	friendsInfo: z.record(z.string(), z.any()).optional(),
	privateInfo: z.record(z.string(), z.any()).optional(),
	musicPreferences: z.record(z.string(), z.any()).optional(),
});

const subscriptionSchema = z.object({
	plan: z.enum(['FREE', 'PREMIUM'] as [SubscriptionPlan, ...SubscriptionPlan[]]),
});

usersRoutes.use('*', authMiddleware);

usersRoutes.get('/me', async (c) => {
	const payload = c.get('jwtPayload');

	const user = await db.query.users.findFirst({
		where: eq(users.id, payload.sub),
	});

	if (!user) {
		return c.json({ error: 'User not found' }, 404);
	}

	return c.json({
		id: user.id,
		email: user.email,
		isEmailValidated: user.isEmailValidated,
		subscriptionPlan: user.subscriptionPlan,
		publicInfo: user.publicInfo,
		friendsInfo: user.friendsInfo,
		privateInfo: user.privateInfo,
		musicPreferences: user.musicPreferences,
	});
});

usersRoutes.patch('/me/profile', zValidator('json', updateProfileSchema), async (c) => {
	const payload = c.get('jwtPayload');
	const updates = c.req.valid('json');

	const [updatedUser] = await db.update(users)
		.set(updates)
		.where(eq(users.id, payload.sub))
		.returning();

	return c.json({ message: 'Profile updated', user: updatedUser });
});

usersRoutes.post('/me/subscription', zValidator('json', subscriptionSchema), async (c) => {
	const payload = c.get('jwtPayload');
	const { plan } = c.req.valid('json');

	const [updatedUser] = await db.update(users)
		.set({ subscriptionPlan: plan })
		.where(eq(users.id, payload.sub))
		.returning();

	return c.json({ message: 'Subscription updated', plan: updatedUser.subscriptionPlan });
});

usersRoutes.get('/premium', subMiddleware, async (c) => {
	return c.json({ message: 'Welcome to the Playlist Editor, Premium User!' });
});
