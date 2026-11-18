import {
  ChoiceMeta,
  DataForChoiceMeta,
} from '@civ-clone/core-client/ChoiceMeta';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import Player from '@civ-clone/core-player/Player';
export declare const hasProposalMenu: (dependencies: Dependencies) => boolean;
/** Whether `player` accepts `proposal`, made by `other`. */
export declare const acceptsProposal: (
  dependencies: Dependencies,
  player: Player,
  other: Player,
  proposal: unknown
) => boolean;
/**
 * What `player` proposes to `other` from `menu`, or `null` to leave. Nothing it has proposed already in these talks
 *  (`made`, by class) is proposed again: what was refused once is left.
 */
export declare const proposalFrom: (
  dependencies: Dependencies,
  player: Player,
  other: Player,
  menu: unknown[],
  made?: Set<Function>
) => unknown | null;
/**
 * The AI's step in a meeting where it speaks for a person and the rule set leaves it a choice (see above), or `null`
 *  where it doesn't: no menu in this rule set, or only one thing to say besides leaving.
 */
export declare const personStep: <Name extends keyof ChoiceMetaDataMap>(
  dependencies: Dependencies,
  player: Player,
  meta: ChoiceMeta<Name, unknown>
) => DataForChoiceMeta<ChoiceMeta<Name, unknown>> | null;
export default personStep;
