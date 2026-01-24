import { Queue } from 'bullmq'

const connection = process.env.REDIS_URL
  ? { url: process.env.REDIS_URL }
  : {
    host: '127.0.0.1',
    port: 6379,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy: (times: number) => {
      // Only try every 60 seconds if it keeps failing to keep logs clean
      return 60000;
    }
  }

export const scheduledPostsQueue = new Queue('scheduledPosts', {
  connection: connection as any,
  defaultJobOptions: {
    removeOnComplete: 50,
    removeOnFail: 50,
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
  },
})

scheduledPostsQueue.on('error', (error) => {
  if (error.message.includes('ECONNREFUSED')) {
    // Completely silent on connection refused - it's expected in local dev without Redis
    return;
  }
  console.error('Queue error:', error);
})