import { Types } from 'mongoose';
import { Repository, NotFoundError, OrderEntity } from '@ubaytools/core';
import * as XLSX from 'xlsx';

export class GenerateProductsExcelUseCase {
  static async execute(): Promise<Buffer> {
    const products = await Repository.Products().list({page:1,size:1000});
    
    const workbook = XLSX.utils.book_new();
    const worksheetData: any[][] = [
      ["Product ID", "Name", "Erp Code", "Price", "Count", "Created At"], // header row
    ];
  
    products.forEach(product => {
      worksheetData.push([
        product.getId().toString(),
        product.getName().getUz(),
        product.getItemCode(), // adjust depending on your schema
        product.getProductInfo().getCurrentPrice(),
        product.getCount?.(),        // adjust if you track inventory
        product.getCreatedAt()?.toLocaleString(),
      ]);
    });
  
    // Convert to sheet
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    worksheet["!cols"] = [
      { wch: 20 }, // Product ID
      { wch: 30 }, // Name
      { wch: 20 }, // Category
      { wch: 15 }, // Price
      { wch: 10 }, // Stock
      { wch: 25 }, // Created At
    ];
  
    // Add sheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Products");
  
    // Generate Excel buffer
    const excelBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    return excelBuffer;
  }
}
