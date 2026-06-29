import { CloudFlareService, LanguageEnum } from '@ubaytools/core';

export class ProductItemResponse {
  id: string;
  name: string;
  description: string;
  oldPrice: number;
  currentPrice: number;  
  discount_percent: number;
  discount_price: number;
  flags: Array<{ key: string; color: string }>;
  images: Array<string>;
  isFavorite: boolean;
  avgStars: number;
  countOfReview: number;
  characteristics: Array<{ key: string; value: string }>;
  store: any;
  brand: { id: string; name: string };
  model: { id: string; name: string };
  guaranty: string;
  count: number;
  categoryId: string;

  constructor(product: any, lang: LanguageEnum) {
    const baseLang = this.getBaseLanguage(lang);

    this.id = product._id.toString();
    this.name = product.name?.[baseLang] ?? null;
    this.description = product.infos?.description?.[baseLang] ?? null;
    this.oldPrice = product.infos?.old_price ?? null;
    this.currentPrice = product.infos?.current_price ?? null;    
    this.discount_percent = product.infos?.discount_percent ?? null;
    this.discount_price = product.infos?.discount_price ?? null;
    this.guaranty = product.infos?.guaranty ?? null;
    this.flags = this.processFlags(product.flagsInfo, baseLang);
    this.images = product.attachments?.length > 0 ? product.attachments.map((item) => CloudFlareService.getImageUrlByFileID(item)) : null;
    this.isFavorite = product.isFavorite ?? null;
    this.avgStars = product?.avgStars ? +product?.avgStars.toFixed(1) : null;
    this.countOfReview = product?.countOfReview ?? null;
    this.characteristics = product.infos?.characteristics;
    this.brand = product.brand ? { id: product.brand._id.toString(), name: product.brand.title[baseLang] } : null;
    this.model = product.model ? { id: product.model._id.toString(), name: product.model.title[baseLang] } : null;
    this.store = product.store
      ? {
          id: product.store._id.toString(),
          name: product.store.name,
          sku: product.store.shortName,
          avatar: product.store.avatar ? CloudFlareService.getImageUrlByFileID(product.store.avatar) : null,
          avgStars: product.storeAvgStars ? Math.floor(product.storeAvgStars*10)/10 : null,
          productCount: product.storeProductCount,
          createdAt: product.createdAt,
        }
      : null;
    this.count = product.count || 0;
    this.categoryId = product.category?.toHexString() ?? null;
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
