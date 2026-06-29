import { BullQueueFactory } from '@ubaytools/core';
import { Queue } from 'bullmq';

interface OctoFiscalJobData {
  orderCode: string;
}

export class OctoFiscalQueueService {
  private static instance: OctoFiscalQueueService;

  private queueFactory: BullQueueFactory<OctoFiscalJobData, void>;

  private queue: Queue<OctoFiscalJobData, void> | null = null;

  private readonly queueName: string;

  private constructor() {
    const envPrefix = process.env.NODE_ENV || 'development';

    this.queueName = `${envPrefix}-octo-fiscal-queue`;

    this.queueFactory = new BullQueueFactory<OctoFiscalJobData, void>(this.queueName);
  }

  static getInstance() {
    if (!this.instance) {
      this.instance = new OctoFiscalQueueService();
    }

    return this.instance;
  }

  private async getQueue() {
    if (!this.queue) {
      this.queue = await this.queueFactory.createQueue();
    }

    return this.queue;
  }

  async submitReceiptJob(orderCode: string) {
    const queue = await this.getQueue();

    await queue.add(
      'submit-octo-receipt',
      {
        orderCode,
      },
      {
        attempts: 10,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      },
    );
  }
}
