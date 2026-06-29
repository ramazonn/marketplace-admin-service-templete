import { NewsModel } from '@ubaytools/core';
import { Context } from 'koa';
import { prefix, request, summary, security, tags } from 'koa-swagger-decorator';

@prefix('/news')
export default class MigrateNewsAttachmentsController {

    @request('post', '/migrate-attachments')
    @summary('Migrate old attachments array to object format')
    @security([])
    @tags(['News'])
    static async controller(context: Context): Promise<void> {
        try {
            const result = await NewsModel.updateMany(
                {
                    attachments: { $type: "array" }
                },
                [
                    {
                        $set: {
                            attachment: {
                                $cond: [
                                    { $eq: [{ $type: { $arrayElemAt: ["$attachments", 0] } }, "string"] },
                                    {
                                        uz: { $arrayElemAt: ["$attachments", 0] },
                                        ru: { $arrayElemAt: ["$attachments", 0] },
                                        en: { $arrayElemAt: ["$attachments", 0] }
                                    },
                                    { $arrayElemAt: ["$attachments", 0] }
                                ]
                            }
                        }
                    }
                ]

            );

            return context.send.data({
                matched: result.matchedCount,
                modified: result.modifiedCount
            });
        } catch (error) {
            return context.send.error(error);
        }
    }

}

