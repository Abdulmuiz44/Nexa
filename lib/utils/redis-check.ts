import IORedis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL;
const REDIS_CONFIG = REDIS_URL
    ? REDIS_URL
    : { host: '127.0.0.1', port: 6379 };

/**
 * Checks if Redis is available within a short timeout
 */
export async function isRedisAvailable(timeoutMs: number = 2000): Promise<boolean> {
    return new Promise((resolve) => {
        const client = new IORedis(REDIS_CONFIG as any, {
            connectTimeout: timeoutMs,
            maxRetriesPerRequest: 0,
            retryStrategy: () => null // Don't retry
        });

        client.on('ready', () => {
            client.disconnect();
            resolve(true);
        });

        client.on('error', (err) => {
            client.disconnect();
            resolve(false);
        });

        setTimeout(() => {
            client.disconnect();
            resolve(false);
        }, timeoutMs);
    });
}
