import { Types } from 'mongoose';
import { Repository, NotFoundError, OrderEntity } from '@ubaytools/core';
import * as XLSX from 'xlsx';

export class GenerateOrderExcelUseCase {
  static async execute(orderId: string): Promise<Buffer> {
    const order = await Repository.Orders().getById(new Types.ObjectId(orderId));
    if (!order) {
      throw new NotFoundError('Order');
    }

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet([
      ['Order ID', order.getId().toString()],
      ['Order Code', order.getOrderCode()],
      ['Status', order.getStatus()],
      ['Created At', order.getCreatedAt().toLocaleString()],
      ['Total Amount', order.getTotalAmount()],
      [],
      ['Product', 'Quantity', 'Price', 'Total'],
    ]);

    // Add order items
    order.getItems().forEach((item, index) => {
      XLSX.utils.sheet_add_aoa(worksheet, [[item.getProductName(), item.getQuantity(), item.getPrice(), item.getQuantity() * item.getPrice()]], {
        origin: -1,
      });
    });

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Order Details');

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return excelBuffer;
  }
}
