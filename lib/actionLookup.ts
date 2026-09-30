// Generic: a unit's available actions keyed by name, so a routine can ask whether it can, say, fortify here.
import {
  Attack,
  BuildIrrigation,
  BuildMine,
  BuildRoad,
  CaptureCity,
  Disembark,
  Embark,
  Fortify,
  FoundCity,
  NoOrders,
  SneakAttack,
  Unload,
} from '@civ-clone/library-unit/Actions';
import Action from '@civ-clone/core-unit/Action';

export type ActionLookup = {
  attack?: Attack;
  buildIrrigation?: BuildIrrigation;
  buildMine?: BuildMine;
  buildRoad?: BuildRoad;
  captureCity?: CaptureCity;
  disembark?: Disembark;
  embark?: Embark;
  fortify?: Fortify;
  foundCity?: FoundCity;
  noOrders?: NoOrders;
  sneakAttack?: SneakAttack;
  unload?: Unload;
};

// Keyed by class name with its first letter lowered. A later action of the same class replaces an earlier one.
export const lookupActions = (actions: Action[]): ActionLookup =>
  actions.reduce(
    (object: ActionLookup, entity: Action): ActionLookup => ({
      ...object,
      [entity.constructor.name.replace(/^./, (char: string): string =>
        char.toLowerCase()
      )]: entity,
    }),
    {}
  );

export default lookupActions;
