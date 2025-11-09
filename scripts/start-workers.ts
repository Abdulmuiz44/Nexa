import '@/src/workers/scheduledPostsWorker'
import '@/src/workers/postScheduler'

console.log('[workers] Scheduled posts worker started')

import { postSchedulerWorker, analyticsWorker } from '../src/workers/postScheduler';
import { supabaseServer } from '../src/lib/supabaseServer';
import { AutonomousAgentManager } from '../src/services/autonomousAgent';

console.log('Starting workers...');

// Workers are already instantiated and will start processing
console.log('Post scheduler worker started');
console.log('Analytics worker started');

// Start autonomous agents for users who have them enabled
async function startAutonomousAgents() {
  try {
    console.log('Starting autonomous agents for enabled users...');
    
    const { data: users } = await supabaseServer
      .from('users')
      .select('id, onboarding_data')
      .eq('status', 'agent_active');
    
    if (users && users.length > 0) {
      for (const user of users) {
        if (user.onboarding_data?.auto_post_enabled || user.onboarding_data?.auto_engage_enabled) {
          try {
            await AutonomousAgentManager.startAgent(user.id);
            console.log(`Started autonomous agent for user ${user.id}`);
          } catch (error) {
            console.error(`Failed to start agent for user ${user.id}:`, error);
          }
        }
      }
      console.log(`Successfully started ${users.length} autonomous agents`);
    } else {
      console.log('No users with active agents found');
    }
  } catch (error) {
    console.error('Error starting autonomous agents:', error);
  }
}

// Start agents after a short delay to ensure all services are ready
setTimeout(startAutonomousAgents, 5000);

process.on('SIGINT', async () => {
  console.log('Shutting down workers...');
  
  // Stop all autonomous agents
  console.log('Stopping autonomous agents...');
  const { data: users } = await supabaseServer
    .from('users')
    .select('id')
    .eq('status', 'agent_active');
  
  if (users) {
    for (const user of users) {
      try {
        await AutonomousAgentManager.stopAgent(user.id);
      } catch (error) {
        console.error(`Error stopping agent for user ${user.id}:`, error);
      }
    }
  }
  
  await postSchedulerWorker.close();
  await analyticsWorker.close();
  process.exit(0);
});
