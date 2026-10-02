import {
  Attack,
  BuildIrrigation,
  BuildMine,
  BuildRoad,
  CaptureCity,
  Disband,
  Disembark,
  Embark,
  Fortify,
  FoundCity,
  NoOrders,
  SetHomeCity,
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
  disband?: Disband;
  disembark?: Disembark;
  embark?: Embark;
  fortify?: Fortify;
  foundCity?: FoundCity;
  noOrders?: NoOrders;
  setHomeCity?: SetHomeCity;
  sneakAttack?: SneakAttack;
  unload?: Unload;
};
export declare const lookupActions: (actions: Action[]) => ActionLookup;
export default lookupActions;
