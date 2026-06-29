import { CloudFlareService, LanguageEnum } from '@ubaytools/core';

export class CarouselProductItemResponse {
  id: string;
  name: string;
  status: string
  currentPrice: number;  
  discount_percent: number;
  discount_price: number;
  images: Array<string>;
  avgStars: number;
  soldCount: number;
  countOfViews: number;
  store: any;
  count: number;
  createdAt: number;

  constructor(product: any, lang: LanguageEnum) {
    const baseLang = this.getBaseLanguage(lang);

    this.id = product._id.toString();
    this.name = product.name?.[baseLang] ?? null;
    this.status = product.status??null,
    this.currentPrice = product.infos?.current_price ?? null;    
    this.discount_percent = product.infos?.discount_percent ?? null;
    this.discount_price = product.infos?.discount_price ?? null;
    this.images = product.attachments?.length > 0 ? product.attachments.map((item) => CloudFlareService.getImageUrlByFileID(item)) : null;
    this.avgStars = product?.stats? product?.stats?.avgStars: null;
    this.soldCount = product?.stats? product?.stats?.sold: null;
    this.countOfViews = product?.stats? product?.stats?.countOfViews: null;
    this.store = product.store
      ? {
          id: product.store._id,
          name: product.store.name,
          sku: product.store.shortName,
          avatar: product.store.avatar ? CloudFlareService.getImageUrlByFileID(product.store.avatar) : null,
        }
      : null;
    this.count = product.count || 0;
    this.createdAt = product.createdAt ?? null;
  }
  private getBaseLanguage(lang: string): string {
    // Extract the base language code (e.g., 'en' from 'en-US')
    const baseLang = lang.split('-')[0].toLowerCase();

    // Map the base language to the supported languages in your system
    const supportedLanguages = ['en', 'ru', 'uz'];
    return supportedLanguages.includes(baseLang) ? baseLang : 'en'; // Default to 'en' if not supported
  }

  private processFlags(flags: any[], lang: string): Array<{ key: string; color: string }> {
    if (!Array.isArray(flags)) return [];

    return flags.map((flag) => ({
      key: flag.name?.[lang] || flag.name?.['en'] || '',
      color: flag.color || '#000000', // Default to black if no color is specified
    }));
  }
}
