import { ClientRegistry } from '@civ-clone/core-client/ClientRegistry';
import { UnitRegistry } from '@civ-clone/core-unit/UnitRegistry';
import Captured from '@civ-clone/core-city/Rules/Captured';
export declare const getRules: (
  unitRegistry?: UnitRegistry,
  clientRegistry?: ClientRegistry
) => Captured[];
export default getRules;
