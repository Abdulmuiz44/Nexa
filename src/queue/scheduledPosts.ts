import { Queue } from 'bullmq'

const connection = process.env.REDIS_URL
  ? { url: process.env.REDIS_URL }
  : { host: '127.0.0.1', port: 6379 }

export const scheduledPostsQueue = new Queue('scheduledPosts', {
  connection,
  defaultJobOptions: {
    removeOnComplete: 50,
    removeOnFail: 50,
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
  },
})