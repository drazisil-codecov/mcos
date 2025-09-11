export {
	type DatabaseManager,
	databaseManager,
	getDatabase,
} from "./src/DatabaseManager.js";
export { databaseService, findCustomerByContext } from "./src/databaseService.js";
export { getTunables as getTuneables } from "./src/services/tunables.js";
export { purchaseCar,  } from "./src/functions/purchaseCar.js";
export { getOwnedVehiclesForPerson, getVehicleAndParts } from "./src/functions/createNewCar.js";
export { getVehiclePartTree, setVehiclePartTree, buildVehiclePartTreeFromDB, vehiclePartTreeToJSON } from "./src/cache.js";
export { DamageInfo } from "./src/models/DamageInfo.js";
export type { TPart } from "./src/models/Part.js";

