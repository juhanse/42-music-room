import { pgTable, uuid, varchar, boolean, jsonb } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
    id: uuid('id').defaultRandom().primaryKey(),
    email: varchar('email', { length: 255 }).unique(),
    passwordHash: varchar('password_hash', { length: 255 }),
    provider: varchar('provider', { length: 50 }).notNull().default('local'),
    providerId: varchar('provider_id', { length: 255 }),
    isEmailValidated: boolean('is_email_validated').default(false),
    publicInfo: jsonb('public_info').default({}),
    friendsInfo: jsonb('friends_info').default({}),
    privateInfo: jsonb('private_info').default({}),
    musicPreferences: jsonb('music_preferences').default({}),
});
