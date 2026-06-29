import { BullQueueFactory, LogService, OrderEntity } from '@ubaytools/core';
import { Queue } from 'bullmq';
import { TelegramBotMessageSender } from '../telegram-bot/TelegramBotMessageSender';

/**
 * OrderQueue service for publishing order created events to BullMQ.
 * Uses BullQueueFactory from @ubaytools/core to create and manage the queue.
 *
 * The queue name follows the pattern: {NODE_ENV}-order-created-queue
 * Jobs are consumed by the integrations-api service workers.
 */
export class OrderQueueService {
  private static instance: OrderQueueService;
  private queueFactory: BullQueueFactory<{ orderId: string }, void>;
  private queue: Queue<{ orderId: string }, void> | null = null;
  private readonly queueName: string;
  private telegramBotMessageSender: TelegramBotMessageSender;

  private constructor() {
    const envPrefix = process.env.NODE_ENV || 'dev';
    this.queueName = `${envPrefix}-order-operations-queue`;
    this.queueFactory = new BullQueueFactory<{ orderId: string }, void>(this.queueName);
    this.telegramBotMessageSender = new TelegramBotMessageSender();
  }

  /**
   * Get singleton instance of OrderQueueService
   */
  static getInstance(): OrderQueueService {
    if (!OrderQueueService.instance) {
      OrderQueueService.instance = new OrderQueueService();
    }
    return OrderQueueService.instance;
  }

  /**
   * Get or create the BullMQ queue instance
   */
  private async getQueue(): Promise<Queue<{ orderId: string }, void>> {
    if (!this.queue) {
      this.queue = await this.queueFactory.createQueue();
    }
    return this.queue;
  }

  async publishUpdatedOrderToQueue(orderId: string): Promise<void> {
    try {
      const queue = await this.getQueue();

      const jobName = 'updated-order';
      await queue.add(jobName, { orderId });
      console.log('job added to queue');
    } catch (error) {
      console.error('Error in publishUpdatedOrderToQueue', error);
    }
  }

  async publishInvoiceOrderToQueue(orderId: string): Promise<void> {
    try {
      const queue = await this.getQueue();

      const jobName = 'invoiced-order';
      await queue.add(jobName, { orderId });
      console.log('job added to queue');
    } catch (error) {
      console.error('Error in publishInvoiceOrderToQueue', error);
    }
  }

  async publishCancelledOrderToQueue(orderId: string): Promise<void> {
    try {
      const queue = await this.getQueue();

      const jobName = 'cancelled-order';
      await queue.add(jobName, { orderId });
      console.log('job added to queue');
    } catch (error) {
      console.error('Error in publishUpdatedOrderToQueue', error);
    }
  }

  async publishStoreStatsOrderToQueue(orderId: string): Promise<void> {
    try {
      const queue = await this.getQueue();

      const jobName = 'store-stats-order';

      await queue.add(jobName, { orderId });

      console.log(`[Queue] store stats job added for order ${orderId}`);
    } catch (error) {
      console.error('Error in publishStoreStatsOrderToQueue', error);
    }
  }

  // Manual retry method (can be called from API or other services)
  async retryJobManual(jobId: number): Promise<boolean> {
    let tgReportMessage = '';
    try {
      const queue = await this.getQueue();
      const job = await queue.getJob(jobId.toString());
      const jobState = await job?.getState();
      console.log('job -=>', job);

      if (!job) {
        console.error(`[RetryFailedJobService] Job ${jobId} not found`);
        tgReportMessage = `Job ${jobId} not found ❌`;
        return false;
      }

      if (jobState !== 'failed') {
        console.log(`[RetryFailedJobService] Job ${jobId} is already completed`);
        tgReportMessage = `Job ${jobId} is already completed ❌`;
        return false;
      }

      await job.retry();
      console.log(`[RetryFailedJobService] Manually retried job ${jobId}`);
      tgReportMessage = `Manually retried job successfully ${jobId}`;
      return true;
    } catch (error) {
      console.error(`[RetryFailedJobService] Error manually retrying job ${jobId}:`, error);
      tgReportMessage = `Error manually retrying job ${jobId}: ${error} ❌`;
      return false;
    } finally {
      await this.telegramBotMessageSender.sendMessageToTopic(tgReportMessage, Number(process.env.TG_MQ_JOB_REPORTS_TOPIC));
    }
  }
}
