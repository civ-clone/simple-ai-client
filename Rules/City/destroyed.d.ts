import { ClientRegistry } from '@civ-clone/core-client/ClientRegistry';
import { UnitRegistry } from '@civ-clone/core-unit/UnitRegistry';
import Destroyed from '@civ-clone/core-city/Rules/Destroyed';
export declare const getRules: (
  unitRegistry?: UnitRegistry,
  clientRegistry?: ClientRegistry
) => Destroyed[];
export default getRules;
