import { CloudFlareService, LanguageEnum, OrderItemEntity, ProductEntity, StoresEntity } from '@ubaytools/core';

export class OrderItemResponse {
  id: string;
  name: string;
  images: Array<string>;
  currentPrice: number;  
  discount_percent: number;
  discount_amount: number;
  discount_price: number;
  final_price: number;
  quantity: number;
  store: any;
  skuCode: string;
  barcode: string;
  brand: { id: string; name: string };

  constructor(product: ProductEntity, orderItem: OrderItemEntity, store: StoresEntity, lang: LanguageEnum) {
    const baseLang = this.getBaseLanguage(lang);

    this.id = product?.getId()?.toString()?? null;
    this.name = product?.getName()?.getByLang(baseLang) ?? null;
    this.images = product?.getAttachments()?.length > 0 ? product?.getAttachments().map((item) => CloudFlareService.getImageUrlByFileID(item)) : null;
    this.currentPrice = orderItem?.getPrice() ?? null;    
    this.discount_percent = orderItem?.getDiscountPercent() ?? null;
    this.discount_amount = orderItem?.getDiscountAmount() !== undefined ? orderItem?.getDiscountAmount() : (orderItem?.getDiscountPrice() ?? 0) > 0 ? orderItem?.getPrice() - (orderItem?.getDiscountPrice() ?? 0) : null;
    this.discount_price = orderItem?.getDiscountPrice() ?? null;
    this.final_price = orderItem?.getFinalPrice() ?? null;
    this.quantity = orderItem?.getQuantity();
    this.skuCode = orderItem?.getSkuCode()??null;
    this.barcode = orderItem?.getBarcode()??null;
    this.store = store
      ? {
          id: store.getId().toString(),
          name: store.getName(),
          sku: store.getShortname(),
        }
      : null;
    this.brand = product?.getProductInfo()?.getBrand() ? {
      id: '',
      name: orderItem?.getBrand()
    }:null
  }
  private getBaseLanguage(lang: string): string {
    // Extract the base language code (e.g., 'en' from 'en-US')
    const baseLang = lang.split('-')[0].toLowerCase();

    // Map the base language to the supported languages in your system
    const supportedLanguages = ['en', 'ru', 'uz'];
    return supportedLanguages.includes(baseLang) ? baseLang : 'en'; // Default to 'en' if not supported
  }

 
}