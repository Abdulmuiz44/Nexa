import { postSchedulerWorker, analyticsWorker } from '../src/workers/postScheduler';

console.log('Starting workers...');

// Workers are already instantiated and will start processing
console.log('Post scheduler worker started');
console.log('Analytics worker started');

process.on('SIGINT', async () => {
  console.log('Shutting down workers...');
  await postSchedulerWorker.close();
  await analyticsWorker.close();
  process.exit(0);
});
