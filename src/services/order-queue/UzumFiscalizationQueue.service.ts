import { BullQueueFactory } from '@ubaytools/core';
import { Queue } from 'bullmq';

interface UzumSubmitFiscalJobData {
  orderCode: string;
}

export class UzumSubmitFiscalQueueService {
  private static instance: UzumSubmitFiscalQueueService;

  private queueFactory: BullQueueFactory<UzumSubmitFiscalJobData, void>;

  private queue: Queue<UzumSubmitFiscalJobData, void> | null = null;

  private readonly queueName: string;

  private constructor() {
    const envPrefix = process.env.NODE_ENV || 'development';

    this.queueName = `${envPrefix}-uzum-submit-fiscal-queue`;

    this.queueFactory = new BullQueueFactory<UzumSubmitFiscalJobData, void>(this.queueName);
  }

  static getInstance() {
    if (!this.instance) {
      this.instance = new UzumSubmitFiscalQueueService();
    }

    return this.instance;
  }

  private async getQueue() {
    if (!this.queue) {
      this.queue = await this.queueFactory.createQueue();
    }

    return this.queue;
  }

  async addSubmitOfdDataJob(orderCode: string) {
    const queue = await this.getQueue();
console.log(`Adding job to ${this.queueName} for orderCode: ${orderCode}`);
    await queue.add(
      'submit-ofd-data-uzum',
      {
        orderCode,
      },
      {
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 3000,
        },
      },
    );
  }
}
