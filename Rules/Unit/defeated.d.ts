import { ClientRegistry } from '@civ-clone/core-client/ClientRegistry';
import { UnitRegistry } from '@civ-clone/core-unit/UnitRegistry';
import Defeated from '@civ-clone/core-unit/Rules/Defeated';
export declare const getRules: (unitRegistry?: UnitRegistry, clientRegistry?: ClientRegistry) => Defeated[];
export default getRules;
