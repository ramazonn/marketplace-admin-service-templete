import AddProductController from './AddProduct.controller';
import UpdateProductController from './UpdateProduct.controller';
import DeleteProductController from './DeleteProduct.controller';
import GetProductDetailController from './GetProductDetail.controller';
import GetProductSellingDetailController from './GetProductSellingDetail.controller';
import ProductListController from './ProductList.controller';
import SyncProductsCountController from './SyncProductsCount.controller';
import SyncProductsPriceController from './SyncProductsPrice.controller';
import SetMinimumCountController from './SetMinimumCount.controller';
import DownloadProductsInExcel from './DownloadProductsInExcel';
import CheckProductSkuController from './CheckProductSku.controller';
import SetGetCountFromEshopController from './SetGetCountFromEshop.controller';
import UpdateMultipleProductStatusController from './UpdateMultipleProductStatus.controller';
import StoreProductsCountMigrationController  from './StoreProductsCountMigration.controller';
import StoreOrdersCountMigrationController  from './StoreOrdersCountMigration.controller';
import StoreReviewsStatsMigrationController from './StoreReviewsStatsMigration.controller';

export const ProductControllers = {
  ProductListController: ProductListController.controller,
  AddProductController: AddProductController.controller,
  UpdateProductController: UpdateProductController.controller,
  DeleteProductController: DeleteProductController.controller,
  GetProductDetailController: GetProductDetailController.controller,
  GetProductSellingDetailController: GetProductSellingDetailController.controller,
  SyncProductsCountController: SyncProductsCountController.controller,
  SyncProductsPriceController: SyncProductsPriceController.controller,
  SetMinimumCountController: SetMinimumCountController.controller,
  SetGetCountFromEshopController: SetGetCountFromEshopController.controller,
  DownloadProductsInExcel: DownloadProductsInExcel.controller,
  CheckProductSku: CheckProductSkuController.controller,
  UpdateMultipleProductStatusController: UpdateMultipleProductStatusController.controller,
  StoreProductsCountMigrationController: StoreProductsCountMigrationController.controller,
  StoreOrdersCountMigrationController: StoreOrdersCountMigrationController.controller,
  StoreReviewsStatsMigrationController: StoreReviewsStatsMigrationController.controller
};
