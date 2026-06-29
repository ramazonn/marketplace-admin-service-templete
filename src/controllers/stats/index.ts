import GetTopSellersController from './GetTopSellers.controller';
import GetTopProductsController from './GetTopProducts.controller';
import GetTopCustomersController from './GetTopCustomers.controller';
import GetMainStatsController from './GetMainStats.controller';
import GetManagersPerformanceController from './GetManagersPerformance.controller';
import GetProductsCountByStatusController from './GetProductsCountByStatus.controller';
import GetOrdersCountByStatusController from './GetOrdersCountByStatus.controller';
import GetDeliveredOrdersController from './GetDeliveredOrders.controller';
import GetRegisteredUsersController from './GetRegisteredUsers.controller';
import GetCreatedOrdersController from './GetCreatedOrders.controller';
import GetActiveUsersController from './GetActiveUsers.controller';
import GetTopCashbackEarnedCustomersController from './GetTopCashbackEarnedCustomers.controller';
import UpdateWrongCalculatedCashbackController from './UpdateWrongCalculatedCashback';
import ExportTopProductsExcelController from './ExportTopProductsExcel.controller';
import ExportTopCustomersExcelController from './ExportTopCustomersExcel.controller';
import ExportTopCashbackCustomersExcelController from './ExportTopCashbackCustomersExcel.controller';
import GetCashbackStatsController from './GetCashbackStats.controller';
import GetDeliveryTimeStatsController from './GetDeliveryTimeStats.controller';
import GetPaymentTypeStatsController from './GetPaymentTypeStats.controller';
import GetOrderStatusProcessingTimeStatsController from './GetOrderStatusAverageDurations.controller';
import GetOrderStatusAverageDurationsController from './GetOrderStatusAverageDurations.controller';
import GetMonthlySalesStatsController from './GetMonthlySalesStats.controller';
import GetOrderAbandonmentStatsController from './GetOrderAbandonmentStats.controller';
import GetCancelledOrdersController from './GetCancelledOrders.controller';
import ExportCancelledOrdersExcelController from './ExportCancelledOrdersExcel.controller';
import ExportOrderAbandonmentExcelController from './ExportOrderAbandonmentExcel.controller';
import GetOrdersByPaymentTypeController from './GetOrdersByPaymentType.controller';

export const StatsControllers = {
  GetMainStatsController: GetMainStatsController.controller,
  GetTopSellersController: GetTopSellersController.controller,
  GetTopProductsController: GetTopProductsController.controller,
  GetTopCustomersController: GetTopCustomersController.controller,
  GetProductsCountByStatusController: GetProductsCountByStatusController.controller,
  GetOrdersCountByStatusController: GetOrdersCountByStatusController.controller,
  GetDeliveredOrdersController: GetDeliveredOrdersController.controller,
  GetCreatedOrdersController: GetCreatedOrdersController.controller,
  GetManagersPerformanceController: GetManagersPerformanceController.controller,
  GetRegisteredUsersController: GetRegisteredUsersController.controller,
  GetActiveUsersController: GetActiveUsersController.controller,
  GetTopCashbackEarnedCustomersController: GetTopCashbackEarnedCustomersController.controller,
  UpdateWrongCalculatedCashbackController: UpdateWrongCalculatedCashbackController.controller,
  ExportTopProductsExcelController: ExportTopProductsExcelController.controller,
  ExportTopCustomersExcelController: ExportTopCustomersExcelController.controller,
  ExportTopCashbackCustomersExcelController: ExportTopCashbackCustomersExcelController.controller,
  GetCashbackStatsController: GetCashbackStatsController.controller,
  GetDeliveryTimeStatsController: GetDeliveryTimeStatsController.controller,
  GetPaymentTypeStatsController: GetPaymentTypeStatsController.controller,
  GetOrderStatusAverageDurationsController: GetOrderStatusAverageDurationsController.controller,
  GetMonthlySalesStatsController: GetMonthlySalesStatsController.controller,
  GetOrderAbandontedStatsController: GetOrderAbandonmentStatsController.controller,
  GetCancelledOrdersController: GetCancelledOrdersController.controller,
  ExportCancelledOrdersExcelController: ExportCancelledOrdersExcelController.controller,
  ExportOrderAbandonmentExcelController: ExportOrderAbandonmentExcelController.controller,
  GetOrdersByPaymentTypeController: GetOrdersByPaymentTypeController.controller,
};
