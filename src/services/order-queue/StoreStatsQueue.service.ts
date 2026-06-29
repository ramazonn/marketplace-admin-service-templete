import { BullQueueFactory } from '@ubaytools/core';
import { Queue } from 'bullmq';

export class StoreStatsQueueService {
  private static instance: StoreStatsQueueService;
  private queueFactory: BullQueueFactory<any, void>;
  private queue: Queue<any, void> | null = null;
  private readonly queueName: string;

  private constructor() {
    const envPrefix = process.env.NODE_ENV || 'dev';
    this.queueName = `${envPrefix}-store-stats-queue`;
    this.queueFactory = new BullQueueFactory(this.queueName);
  }

  static getInstance(): StoreStatsQueueService {
    if (!this.instance) {
      this.instance = new StoreStatsQueueService();
    }
    return this.instance;
  }

  private async getQueue() {
    if (!this.queue) {
      this.queue = await this.queueFactory.createQueue();
    }
    return this.queue;
  }

  // ORDER DELIVERED  AGARDA STORE BOYICHA HAMMASI BITTA QUEUE DA BOLADIGAN BOLSA SHUNGA OTKAZAMAN
  async onOrderDelivered(orderId: string) {
    const queue = await this.getQueue();
    await queue.add('order-delivered', { orderId });
  }

  async onProductCreated(storeId: string) {
    const queue = await this.getQueue();
    await queue.add('product-created', { storeId });
  }

  async onProductDeleted(storeId: string) {
    const queue = await this.getQueue();
    await queue.add('product-deleted', { storeId });
  }
}