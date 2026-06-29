export class LogisticPriceCalculatorService {

  private static readonly BASE_LOGISTICS = 45000;

  private static getWeightCoef(weight: number): number {
    if (weight <= 2) return 0.55;
    if (weight <= 5) return 0.75;
    if (weight <= 10) return 1.0;
    if (weight <= 25) return 1.45;

    return 2.1;
  }

  private static getPriceCoef(price: number): number {
    if (price <= 50000) return 0.45;
    if (price <= 100000) return 0.60;
    if (price <= 200000) return 0.75;
    if (price <= 400000) return 1.0;
    if (price <= 1000000) return 1.25;
    if (price <= 3000000) return 1.55;

    return 1.85;
  }

  static calculate(price: number, weight: number): number {
    let logisticPrice =
      LogisticPriceCalculatorService.BASE_LOGISTICS *
      LogisticPriceCalculatorService.getWeightCoef(weight) *
      LogisticPriceCalculatorService.getPriceCoef(price);

    if (price < 50000) {
      logisticPrice = Math.min(logisticPrice, 12000);
    } else if (price < 100000) {
      logisticPrice = Math.min(logisticPrice, 22000);
    }

    logisticPrice = Math.round(logisticPrice / 1000) * 1000;

    return logisticPrice
  }
}