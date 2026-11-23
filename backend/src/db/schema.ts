import { pgTable, uuid, varchar, boolean, timestamp, jsonb } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
	id: uuid('id').defaultRandom().primaryKey(),
	email: varchar('email', { length: 255 }).unique().notNull(),
	isEmailValidated: boolean('is_email_validated').default(false),
	subscriptionPlan: varchar('subscription_plan', { length: 50 }).default('FREE').notNull(),
	publicInfo: jsonb('public_info').default({}),
	friendsInfo: jsonb('friends_info').default({}),
	privateInfo: jsonb('private_info').default({}),
	musicPreferences: jsonb('music_preferences').default({}),
	createdAt: timestamp('created_at').defaultNow(),
});

export const userAuthAccounts = pgTable('user_auth_accounts', {
	id: uuid('id').defaultRandom().primaryKey(),
	userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
	provider: varchar('provider', { length: 50 }).notNull(),
	providerAccountId: varchar('provider_account_id', { length: 255 }),
	passwordHash: varchar('password_hash', { length: 255 }),
	createdAt: timestamp('created_at').defaultNow(),
});

export const sessions = pgTable('sessions', {
	id: uuid('id').defaultRandom().primaryKey(),
	userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
	refreshTokenHash: varchar('refresh_token_hash', { length: 255 }).notNull(),
	expiresAt: timestamp('expires_at').notNull(),
	createdAt: timestamp('created_at').defaultNow(),
});

export const verificationTokens = pgTable('verification_tokens', {
	id: uuid('id').defaultRandom().primaryKey(),
	userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
	tokenHash: varchar('token_hash', { length: 255 }).notNull(),
	expiresAt: timestamp('expires_at').notNull(),
});

export const passwordResetTokens = pgTable('password_reset_tokens', {
	id: uuid('id').defaultRandom().primaryKey(),
	userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
	tokenHash: varchar('token_hash', { length: 255 }).notNull(),
	expiresAt: timestamp('expires_at').notNull(),
});
