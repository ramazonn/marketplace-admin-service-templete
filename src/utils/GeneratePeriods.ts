import { eachDayOfInterval, eachMonthOfInterval, format } from "date-fns";

export class GeneratePeriods {
  static execute(startDate: Date, endDate: Date, diffInDays: number) {
    if (diffInDays <= 30) {
      return eachDayOfInterval({ start: startDate, end: endDate }).map(d =>
        format(d, "yyyy-MM-dd")
      );
    }
    return eachMonthOfInterval({ start: startDate, end: endDate }).map(d =>
      format(d, "yyyy-MM")
    );
  }
  
  static month(startDate: Date, endDate: Date) {
    return eachMonthOfInterval({ start: startDate, end: endDate }).map(d =>
      format(d, "yyyy-MM")
    );
  }
}
 