import { createMiddleware } from 'hono/factory';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import type { AccessTokenPayload } from '@musicroom/shared';

export const subMiddleware = createMiddleware<{ Variables: { jwtPayload: AccessTokenPayload } }>(async (c, next) => {
	const payload = c.get('jwtPayload');

	if (!payload || !payload.sub) {
		return c.json({ error: 'Unauthorized' }, 401);
	}

	const user = await db.query.users.findFirst({
		where: eq(users.id, payload.sub),
		columns: { subscriptionPlan: true }
	});

	if (!user || user.subscriptionPlan !== 'PREMIUM') {
		return c.json({ error: 'Premium subscription required' }, 403);
	}

	await next();
});
