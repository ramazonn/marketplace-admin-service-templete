import { Context } from 'koa';
import { ReviewFilterStatus, ReviewListParams } from '../../infrastructure';
import { BrandsEntity, CloudFlareService, LanguageEnum, ProductEntity, Repository, ReviewsEntity, ReviewsModel, StoresEntity, UserEntity } from '@ubaytools/core';
import { prefix, query, request, security, summary, tags } from 'koa-swagger-decorator';
import * as moment from 'moment/moment';

export class ReviewResponse {
  id: string;
  advantages: string;
  disadvantages: string;
  description: string;
  attachments: Array<string>;
  customer: { id: string; name: string; avatar: string; phoneNumber: string };
  date: Date;
  stars: number;
  product: { id: string; title: string; attachment: Array<string>; brand: string; count: number; price: number };
  answer: string;
  store: { id: string; name: string; sku: string; avatar: string };
  constructor(review: ReviewsEntity, lang: LanguageEnum) {
    this.id = review.getId().toString();
    this.advantages = review.getAdvantages() ?? null;
    this.disadvantages = review.getDisadvantages() ?? null;
    this.description = review.getDescription() ?? null;
    this.attachments = review.getAttachments() ?? null;
    const user = review.getUser() as UserEntity;
    this.customer = user
      ? {
          id: user.getId()?.toString(),
          name: user.getUserInfo() ? user.getUserInfo()?.getLastname() + ' ' + user.getUserInfo()?.getFirstname() : null,
          avatar: user.getUserInfo()?.getAvatar() ? CloudFlareService.getImageUrlByFileID(user.getUserInfo()?.getAvatar()) : null,
          phoneNumber: user.getPhoneNumber() ?? null,
        }
      : null;
    this.date = review.getCreatedAt() ?? null;
    this.stars = review.getStars() ?? null;
    const product = review.getProduct() as ProductEntity;
    this.product = product
      ? {
          id: product.getId().toString(),
          title: product.getName().getByLang(lang),
          attachment: product.getAttachments(),
          brand: (product.getProductInfo()?.getBrand() as BrandsEntity)?.getTitle()?.getByLang(lang),
          count: product.getCount(),
          price: product.getProductInfo()?.getCurrentPrice(),
        }
      : null;
    const store = product.getStore() as StoresEntity;
    this.store = store
      ? {
          id: store.getId().toString(),
          name: store.getName(),
          sku: store.getShortname(),
          avatar: store.getAvatar() ? CloudFlareService.getImageUrlByFileID(store.getAvatar()) : null,
        }
      : null;
    this.answer = review.getAnswer() ?? null;
  }
}

@prefix('/review')
export default class ReviewListController {
  @request('get', '/list')
  @summary('Review list')
  @security([])
  @tags(['Review'])
  @query((ReviewListParams as any).swaggerDocument)
  static async controller(context: Context): Promise<void> {
    let params: ReviewListParams;
    let result;
    try {
      params = await new ReviewListParams(context.request.query).validate();
    } catch (error) {
      const joiError = await context.joi.handle(error);
      return context.send.error(joiError);
    }
    try {
      const now = moment().toDate()
      const oneDayAgo = moment().subtract(1, 'd').toDate()
      const filter = {};
      if (params.search) {
        filter['$or'] = [
          { 'product.name.uz': { $regex: params.search, $options: 'i' } },
          { 'product.name.ru': { $regex: params.search, $options: 'i' } },
          { 'product.name.en': { $regex: params.search, $options: 'i' } },
          { 'product.store.name.uz': { $regex: params.search, $options: 'i' } },
          { 'product.store.name.ru': { $regex: params.search, $options: 'i' } },
          { 'product.store.name.en': { $regex: params.search, $options: 'i' } },
        ];
      }
      if (params?.store) {
        filter['store'] = params.store;
      }
      if (params?.date) {
        filter['createdAt'] = { $gte: moment(params.date).toDate(), $lte: moment(params.date).add(1, 'd').toDate() };
      }
      if (params?.status) {
        if (params.status == ReviewFilterStatus.NEW) {
          filter['createdAt'] = { $gte: oneDayAgo, $lte: now };
        } else if (params.status == ReviewFilterStatus.ANSWERED) {
          filter['answer'] = { $exists: true };
        } else if (params.status == ReviewFilterStatus.NOT_ANSWERED) {
          filter['answer'] = { $exists: false };
        }
      }
      if (params?.customer) {
        filter['user'] = params.customer;
      }

      if (params?.product) {
        filter['product'] = params.product;
      }
      const counts = await ReviewsModel.aggregate([
        {
          $facet: {
            NEW: [
              { $match: { createdAt: { $gte: oneDayAgo, $lte: now } } },
              { $count: "count" }
            ],
            ANSWERED: [
              { $match: { answer: { $exists: true } } },
              { $count: "count" }
            ],
            NOT_ANSWERED: [
              { $match: { answer: { $exists: false } } },
              { $count: "count" }
            ],
            total: [
              { $count: "count" }
            ]
          }
        },
        {
          $project: {
            NEW: { $ifNull: [{ $arrayElemAt: ["$NEW.count", 0] }, 0] },
            ANSWERED: { $ifNull: [{ $arrayElemAt: ["$ANSWERED.count", 0] }, 0] },
            NOT_ANSWERED: { $ifNull: [{ $arrayElemAt: ["$NOT_ANSWERED.count", 0] }, 0] },
            total: { $ifNull: [{ $arrayElemAt: ["$total.count", 0] }, 0] }
          }
        }
      ]);
  
      const reviews = await Repository.Reviews().list({ page: params.page, size: params.size }, filter, { createdAt: -1 });
      const response = reviews.map((review) => new ReviewResponse(review, context.lang));
      return context.send.data({ counts: counts[0], items: response });
    } catch (error) {
      return context.send.error(error);
    }
  }
}
