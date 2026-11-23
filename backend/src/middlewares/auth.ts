import { createMiddleware } from 'hono/factory';
import { verify } from 'hono/jwt';
import type { AccessTokenPayload } from '@musicroom/shared';

export const authMiddleware = createMiddleware<{ Variables: { jwtPayload: AccessTokenPayload } }>(async (c, next) => {
	const authorization = c.req.header('Authorization');

	if (!authorization?.startsWith('Bearer ')) {
		return c.json({ error: 'Unauthorized' }, 401);
	}

	const token = authorization.slice(7);

	try {
		const payload = await verify(token, process.env.JWT_SECRET!, 'HS256');
		
		c.set('jwtPayload', {
			sub: payload.sub as string,
			sid: payload.sid as string,
			iat: payload.iat as number,
			exp: payload.exp as number
		});
		
		await next();
	} catch (e) {
		return c.json({ error: 'Invalid or expired token' }, 401);
	}
});
