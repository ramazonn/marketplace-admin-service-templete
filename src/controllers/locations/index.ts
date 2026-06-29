import UbayPointControllerCopy from './UbayPoint.controller';
import UzbLocationsControllerCopy from './UzbLocations.controller';
import EmuDeliveryPointController from './EmuDeliveryPoint.controller';
import UzpostDeliveryPointController from './UzpostDeliveryPoint.controller';
import DeliveryPointController from './DeliveryPoint.controller';

export const AddressControllers = {
  DeliveryPointController: DeliveryPointController.controller,
  
  UbayPointController: UbayPointControllerCopy.controller,
  UzbLocationsController: UzbLocationsControllerCopy.controller,
  EmuDeliveryPointController: EmuDeliveryPointController.controller,
  UzpostDeliveryPointController: UzpostDeliveryPointController.controller,
};
