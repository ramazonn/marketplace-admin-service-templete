import { BullQueueFactory } from '@ubaytools/core';
import { Queue } from 'bullmq';

interface OrderOperationJobData {
  id: string;
}

export class OrderOperationQueueService {
  private static instance: OrderOperationQueueService;

  private queueFactory: BullQueueFactory<OrderOperationJobData, void>;

  private queue: Queue<OrderOperationJobData, void> | null = null;

  private readonly queueName: string;

  private constructor() {
    const envPrefix = process.env.NODE_ENV || 'development';

    this.queueName = `${envPrefix}-order-notification-queue`;

    this.queueFactory = new BullQueueFactory<OrderOperationJobData, void>(this.queueName);
  }

  static getInstance() {
    if (!this.instance) {
      this.instance = new OrderOperationQueueService();
    }

    return this.instance;
  }

  private async getQueue() {
    if (!this.queue) {
      this.queue = await this.queueFactory.createQueue();
    }
    return this.queue;
  }

  async publishOrderReadyToPickupNotification(orderId: string) {
    const queue = await this.getQueue();
    await queue.add('order-ready-to-pickup-telegram-notification', {
      id: orderId,
    });
  }
}
