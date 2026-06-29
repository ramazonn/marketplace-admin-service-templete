import { Redis } from "@ubaytools/core";

export class InvalidateRedisCache {
  static async execute(key:string) {
    const redisClient = await Redis.getInstance();
    await redisClient.deleteKeysByPattern(key);
    }
}