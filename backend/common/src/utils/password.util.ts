import bcrypt from 'bcrypt';
import { UnauthorizedError } from '../error';
import { passwordRateLimiter } from './rate-limiter.util';

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    return bcrypt.hash(password, salt);
}

export async function comparePassword(
    plainTextPassword: string,
    hashedPassword: string
): Promise<boolean> {
    return bcrypt.compare(plainTextPassword, hashedPassword);
}

export async function verifyPassword(
    plain: string,
    hashed: string,
    identifier: string
): Promise<void> {
    if (await passwordRateLimiter.isRateLimited(identifier)) {
        throw new UnauthorizedError('Too many attempts, please retry again in 1 minute');
    }

    const isMatch = await comparePassword(plain, hashed);

    if (!isMatch) {
        await passwordRateLimiter.recordAttempt(identifier);

        if (await passwordRateLimiter.isRateLimited(identifier)) {
            throw new UnauthorizedError('Too many attempts, please retry again in 1 minute');
        }

        throw new UnauthorizedError('Invalid password');
    }

    await passwordRateLimiter.reset(identifier);
}