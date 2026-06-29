import { Context } from 'koa';
import { ListParams } from '../../infrastructure';
import { CarouselEntity, CarouselProductEntity, CarouselStatusEnum, LanguageEnum, ProductEntity, ProductsModel, ProductsSchema, Repository, StoresEntity, TranslatesSchema } from '@ubaytools/core';
import { prefix, query, request, security, summary, tags } from 'koa-swagger-decorator';
import { Types } from 'mongoose';
import { GetCarouselProductDetailUseCase, GetProductDetailUseCase, ProductItemResponse } from '../../usecases';

class CarouselListItemResponse {
  id: string;
  title: string;
  titleFull: TranslatesSchema;
  status: CarouselStatusEnum;
  products: Array<any>;
  constructor(carousel: CarouselEntity, products: Array<any>, lang: LanguageEnum) {
    this.id = carousel.getId().toString();
    this.title = carousel.getTitle().getByLang(lang);
    this.titleFull = carousel.getTitle().convertToSchema();
    this.status = carousel.getStatus();
    this.products = products ?? [];
  }
}

@prefix('/carousel')
export default class CarouselListController {
  @request('get', '/list')
  @summary('Carousel list')
  @security([])
  @tags(['Carousel'])
  @query((ListParams as any).swaggerDocument)
  static async controller(context: Context): Promise<void> {
    let params: ListParams;
    try {
      params = await new ListParams(context.request.query).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    // try {
    //   const count = await Repository.Carousels().countDocumentsByFilter({});
    //   const carousels = await Repository.Carousels().list({ page: params.page, size: params.size });
    //   const response = await Promise.all(
    //     carousels.map(async (item) => {
    //       const products = await Promise.all(
    //         item.getProducts().map(async (carouselProduct: CarouselProductEntity) => {
    //           console.log("++", carouselProduct.getProduct(), "++", item.getId(), carouselProduct.getProduct() as ProductEntity);
             
    //           return await GetProductDetailUseCase.execute(carouselProduct.getProduct().toString(), context.lang, context?.client?.getId() ?? null);
    //         }),
    //       );
    //       return new CarouselListItemResponse(item, products, context.lang);
    //     }),
    //   );
    //   return context.send.data({ total: count, items: response });
    // } catch (error) {
    //   return context.send.error(error);
    // }
    try {
      const count = await Repository.Carousels().countDocumentsByFilter({});
      const carousels = await Repository.Carousels().list({
        page: params.page,
        size: params.size,
      });

      // 1️⃣ Collect all productIds
      const allProductIds = carousels.flatMap((c) =>
        c.getProducts().map((p: CarouselProductEntity) => p.getProduct().toString())
      );

      // 2️⃣ Remove duplicates
      const uniqueProductIds = [...new Set(allProductIds)];

      // 3️⃣ Fetch all products in one go
      const productDetails = await GetCarouselProductDetailUseCase.execute(
        uniqueProductIds,
        context.lang,
      );
console.log("+-+",productDetails);

      // 4️⃣ Build map for O(1) lookup
      const productMap = new Map(productDetails.map((p) => [p.id, p]));

      // 5️⃣ Attach products to carousels
      const response = carousels.map((item) => {
        const products = item
          .getProducts()
          // .map((cp: CarouselProductEntity) => productMap.get(cp.getProduct()))
          .map((cp: CarouselProductEntity) => productMap.get(cp.getProduct().toString()))
          .filter(Boolean);

        return new CarouselListItemResponse(item, products, context.lang);
      });

      return context.send.data({ total: count, items: response });
    } catch (error) {
      return context.send.error(error);
    }
  }
}
