import CarouselListController from './CarouselList.controller';
import AddCarouselController from './AddCarousel.controller';
import InsertProductToCarouselController from './InsertProductToCarousel.controller';
import RemoveProductFromCarouselController from './RemoveProductFromCarousel.controller';
import UpdateCarouselController from './UpdateCarousel.controller';
import DeleteCarouselController from './DeleteCarousel.controller';
import ReOrderProductsInCarousel from './ReOrderProductsInCarousel.controller';

export const CarouselControllers = {
  CarouselListController: CarouselListController.controller,
  AddCarouselController: AddCarouselController.controller,
  InsertProductToCarouselController: InsertProductToCarouselController.controller,
  RemoveProductFromCarouselController: RemoveProductFromCarouselController.controller,
  UpdateCarouselController: UpdateCarouselController.controller,
  DeleteCarouselController: DeleteCarouselController.controller,
  ReOrderProductsInCarousel: ReOrderProductsInCarousel.controller,
};
