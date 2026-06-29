import { AdminsEntity, OrderChangeLogsEntity, OrderSchema, Repository } from "@ubaytools/core";
import { Types } from "mongoose";

export class OrderChangeLogUseCase {
    static async execute(admin: AdminsEntity, orderId: Types.ObjectId, newData: OrderSchema) {
        const oldData = (await Repository.Orders().getById(orderId)).convertToSchema()
        console.log('aft convert schema order');
        
        
        const fieldsToTrack = [
            "manager",
            "status",
            "comment",
            "urgentDelivery",
            "items",
            "deliveryPrice",
            "totalAmount",
            "deliveryAddressType",
            "shippingAddress",
            "paymentType",
            "cancelledAt",
            "deliveredAt",
            "shippedAt",
            "readyToPickupAt",
            "readyToDeliverAt",
            "preparingAt",
            "confirmedAt",
            "processingAt",
            "pendingAt"
        ];
        let changes: Record<string, any> = {};

        for (const field of fieldsToTrack) {
            const oldValue = oldData[field];
            const newValue = newData[field];

            // basic deep check
            if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
                changes[field] = { oldValue:oldValue ?? null, newValue };
            };
            
        };

        if (Object.keys(changes).length > 0) {
            const orderChangeLog = new OrderChangeLogsEntity()
            orderChangeLog.buildOrder(orderId)
            orderChangeLog.buildAdmin(admin.getId())
            orderChangeLog.buildAdminData({ fullName: `${admin.getFirstName()}  ${admin.getLastName()}`, phoneNumber: admin.getPhoneNumber() })
            orderChangeLog.buildChanges(changes)
            
            await Repository.OrderChangeLogs().create(orderChangeLog)
        }
}
}