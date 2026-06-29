import { BullQueueFactory } from '@ubaytools/core';
import { Queue } from 'bullmq';
import { SAPSyncResult } from '../sap/SAPSyncCronTask';

export interface CronReportJobData {
  taskName: string;
  refId: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  success: boolean;
  error?: string;
  sapSyncResult?: SAPSyncResult;
}

export class CronReportQueueService {
  private static instance: CronReportQueueService;

  private queueFactory: BullQueueFactory<CronReportJobData, void>;

  private queue: Queue<CronReportJobData, void> | null = null;

  private readonly queueName: string;

  private constructor() {
    const envPrefix = process.env.NODE_ENV || 'development';

    this.queueName = `${envPrefix}-cron-report-queue`;

    this.queueFactory = new BullQueueFactory<CronReportJobData, void>(this.queueName);
  }

  static getInstance() {
    if (!this.instance) {
      this.instance = new CronReportQueueService();
    }

    return this.instance;
  }

  private async getQueue() {
    if (!this.queue) {
      this.queue = await this.queueFactory.createQueue();
    }

    return this.queue;
  }

  async publishSapCronReport(reportParams: CronReportJobData) {
    const queue = await this.getQueue();

    await queue.add('send-cron-report', reportParams);
  }
}
