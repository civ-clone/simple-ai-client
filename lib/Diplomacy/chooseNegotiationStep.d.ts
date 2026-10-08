import {
  ChoiceMeta,
  DataForChoiceMeta,
} from '@civ-clone/core-client/ChoiceMeta';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import Player from '@civ-clone/core-player/Player';
export declare const chooseNegotiationStep: <
  Name extends keyof ChoiceMetaDataMap
>(
  dependencies: Dependencies,
  player: Player,
  meta: ChoiceMeta<Name, unknown>
) => DataForChoiceMeta<ChoiceMeta<Name, unknown>>;
export default chooseNegotiationStep;
