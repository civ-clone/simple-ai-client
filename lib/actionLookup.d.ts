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
export declare const lookupActions: (actions: Action[]) => ActionLookup;
export default lookupActions;
