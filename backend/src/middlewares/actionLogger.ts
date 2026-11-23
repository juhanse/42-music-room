import { createMiddleware } from 'hono/factory';

export const actionLogger = createMiddleware(async (c, next) => {
	await next();

	const platform = c.req.header('X-Platform') || 'Unknown';
	const device = c.req.header('X-Device') || 'Unknown';
	const version = c.req.header('X-App-Version') || 'Unknown';
	const method = c.req.method;
	const path = c.req.path;
	const status = c.res.status;

	console.log(`[ACTION] ${method} ${path} | Status: ${status} | Platform: ${platform} | Device: ${device} | Version: ${version}`);
});
