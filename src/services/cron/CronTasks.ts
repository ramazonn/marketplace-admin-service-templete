import { CronService, CronTask } from './CronService';
import { SAPSyncCronTask } from '../sap/SAPSyncCronTask';

/**
 * Configure and register all cron tasks
 */
export class CronTasks {
  /**
   * Initialize all cron tasks
   */
  static initialize(): void {
    const cronService = CronService.getInstance();

    // Register Daily SAP Sync Task
    const dailySapSyncTask: CronTask = {
      name: 'sap-daily-sync',
      schedule: process.env.SAP_DAILY_SYNC_SCHEDULE || '0 5-23 * * *', // Daily at midnight by default
      // schedule: process.env.SAP_DAILY_SYNC_SCHEDULE || '0 0 * * *', // Daily at midnight by default
      task: SAPSyncCronTask.execute,
      enabled: process.env.SAP_DAILY_SYNC_ENABLED === 'true',
      description: 'Daily product synchronization from SAP Business One'
    };

    // Register all tasks
    cronService.registerTask(dailySapSyncTask);

    console.log('[CRON] All tasks registered successfully');
  }

  /**
   * Start all cron tasks
   */
  static start(): void {
    const cronService = CronService.getInstance();
    cronService.startAll();
  }

  /**
   * Stop all cron tasks
   */
  static stop(): void {
    const cronService = CronService.getInstance();
    cronService.stopAll();
  }

  /**
   * Get status of all tasks
   */
  static getStatus() {
    const cronService = CronService.getInstance();
    return cronService.getStatus();
  }

  /**
   * Manually trigger a specific task
   */
  static async triggerTask(taskName: string): Promise<void> {
    const cronService = CronService.getInstance();
    await cronService.triggerTask(taskName);
  }
}
