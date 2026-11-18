// Generic: the AI's part in a meeting where it speaks for a person (civ.one's Automate plays a person's turns with this
//  client), in a rule set whose person chooses from a menu of proposals (base-diplomacy's `ProposalAvailable`, Civ2's
//  `diplo_proposal_menu`). There the rule set leaves the person the choices a computer player never has: which
//  proposal to make, and whether to accept what the computer player asks. Civ1 has no such menu, and Civ2's computer
//  players are each given one step at a time, so neither is changed: `chooseNegotiationStep` keeps its own answer for
//  them.
//
// The choices go by standing and personality: the player's power, as its leader sees it against the other's
//  (`confidentPower`, its `AttackConfidence`), and the treaties each has.
//  - What the computer player asks: a treaty or an alliance is taken unless the other is the player's rival, whom it
//    means to fight; tribute or a withdrawal is given only to a player it feels the weaker of; a war on a third player
//    only by an ally, and only on one it feels the stronger of; advances are exchanged; a sale is refused.
//  - What the player proposes: peace, at war, unless the other is its rival; an alliance, at peace, when the two have an
//    enemy in common (as the original's computer players ally against a third, `diplo_civs_meet_alliance`), or its
//    leader is friendly; an exchange of advances. Otherwise it leaves, rather than spend the other's patience.
// Attitude and reputation aren't read: core-diplomacy leaves what their numbers mean (which way is warmer) to the rule
//  set, so there is no reading a client could make of them without one.
import {
  ChoiceMeta,
  DataForChoiceMeta,
} from '@civ-clone/core-client/ChoiceMeta';
import {
  TreatyLevel,
  hasTreatyLevel,
  treatyLevel,
} from '@civ-clone/base-diplomacy/lib/treatyLevel';
import { confidentPower, powerOfPlayer, rivalOf } from '../Player/rivals';
import Accept from '@civ-clone/core-diplomacy/Proposal/Accept';
import AskAlly from '@civ-clone/library-diplomacy/Proposals/AskAlly';
import AttackConfidence from '@civ-clone/base-leader-personality/Rules/Player/AttackConfidence';
import Decline from '@civ-clone/core-diplomacy/Proposal/Decline';
import DemandTribute from '@civ-clone/library-diplomacy/Proposals/DemandTribute';
import DemandWithdrawal from '@civ-clone/library-diplomacy/Proposals/DemandWithdrawal';
import Dependencies from '@civ-clone/base-strategy-ai/lib/Dependencies';
import ExchangeKnowledge from '@civ-clone/library-diplomacy/Proposals/ExchangeKnowledge';
import JoinWar from '@civ-clone/library-diplomacy/Proposals/JoinWar';
import OfferCeasefire from '@civ-clone/library-diplomacy/Proposals/OfferCeasefire';
import OfferPeace from '@civ-clone/library-diplomacy/Proposals/OfferPeace';
import Player from '@civ-clone/core-player/Player';
import Proposal from '@civ-clone/core-diplomacy/Negotiation/Proposal';
import ProposalAvailable from '@civ-clone/base-diplomacy/Rules/ProposalAvailable';
import ProposeAlliance from '@civ-clone/library-diplomacy/Proposals/ProposeAlliance';
import Resolution from '@civ-clone/core-diplomacy/Proposal/Resolution';
import SellAdvance from '@civ-clone/library-diplomacy/Proposals/SellAdvance';
import Terminate from '@civ-clone/core-diplomacy/Negotiation/Terminate';
import { product } from '@civ-clone/base-leader-personality/lib/combine';

// Whether the rule set gives a person a menu of proposals in a meeting (Civ2's does; Civ1's doesn't).
export const hasProposalMenu = (dependencies: Dependencies): boolean =>
  (dependencies.ruleRegistry?.get(ProposalAvailable).length ?? 0) > 0;

// Whether `player` feels the stronger of the two against `other`.
const feelsStronger = (
  dependencies: Dependencies,
  player: Player,
  other: Player
): boolean =>
  confidentPower(dependencies, player, other) >=
  powerOfPlayer(dependencies, other);

// Whether `player` means to fight `other`: its rival.
const meansWar = (
  dependencies: Dependencies,
  player: Player,
  other: Player
): boolean => rivalOf(dependencies, player) === other;

const allied = (
  dependencies: Dependencies,
  player: Player,
  other: Player
): boolean => hasTreatyLevel(dependencies, player, other, TreatyLevel.Alliance);

// Whether `player` and `other` have an enemy in common: a third player with a city that both are at war with (a war in
//  force, so not a player either has yet to meet).
const commonEnemy = (
  dependencies: Dependencies,
  player: Player,
  other: Player
): boolean =>
  [
    ...new Set(
      dependencies.cityRegistry
        .entries()
        .filter((city) => !city.destroyed())
        .map((city) => city.player())
    ),
  ].some(
    (third: Player): boolean =>
      third !== player &&
      third !== other &&
      treatyLevel(dependencies, player, third) === TreatyLevel.War &&
      treatyLevel(dependencies, other, third) === TreatyLevel.War
  );

/** Whether `player` accepts `proposal`, made by `other`. */
export const acceptsProposal = (
  dependencies: Dependencies,
  player: Player,
  other: Player,
  proposal: unknown
): boolean => {
  if (
    proposal instanceof OfferPeace ||
    proposal instanceof OfferCeasefire ||
    proposal instanceof ProposeAlliance
  ) {
    return !meansWar(dependencies, player, other);
  }

  if (
    proposal instanceof DemandTribute ||
    proposal instanceof DemandWithdrawal
  ) {
    return !feelsStronger(dependencies, player, other);
  }

  if (proposal instanceof JoinWar || proposal instanceof AskAlly) {
    const against = proposal instanceof JoinWar ? proposal.against() : null;

    return (
      allied(dependencies, player, other) &&
      (against === null || feelsStronger(dependencies, player, against))
    );
  }

  if (proposal instanceof SellAdvance) {
    return false;
  }

  return true;
};

/**
 * What `player` proposes to `other` from `menu`, or `null` to leave. Nothing it has proposed already in these talks
 *  (`made`, by class) is proposed again: what was refused once is left.
 */
export const proposalFrom = (
  dependencies: Dependencies,
  player: Player,
  other: Player,
  menu: unknown[],
  made: Set<Function> = new Set()
): unknown | null => {
  const find = (Type: Function): unknown | null =>
    made.has(Type)
      ? null
      : menu.find((step: unknown): boolean => step instanceof Type) ?? null;

  // At war, peace or failing that a ceasefire; under a ceasefire, which lapses, peace.
  if (!hasTreatyLevel(dependencies, player, other, TreatyLevel.Peace)) {
    if (meansWar(dependencies, player, other)) {
      return null;
    }

    return hasTreatyLevel(dependencies, player, other, TreatyLevel.Ceasefire)
      ? find(OfferPeace)
      : find(OfferPeace) ?? find(OfferCeasefire);
  }

  if (
    !allied(dependencies, player, other) &&
    !meansWar(dependencies, player, other) &&
    (commonEnemy(dependencies, player, other) ||
      product(dependencies.ruleRegistry, AttackConfidence, player, other) < 1)
  ) {
    const alliance = find(ProposeAlliance);

    if (alliance !== null) {
      return alliance;
    }
  }

  return find(ExchangeKnowledge);
};

/**
 * The AI's step in a meeting where it speaks for a person and the rule set leaves it a choice (see above), or `null`
 *  where it doesn't: no menu in this rule set, or only one thing to say besides leaving.
 */
export const personStep = <Name extends keyof ChoiceMetaDataMap>(
  dependencies: Dependencies,
  player: Player,
  meta: ChoiceMeta<Name>
): DataForChoiceMeta<ChoiceMeta<Name>> | null => {
  const values = meta.choices().map((choice) => choice.value() as unknown),
    talking = values.filter((value) => !(value instanceof Terminate));

  if (talking.length < 2 || !hasProposalMenu(dependencies)) {
    return null;
  }

  const negotiation = meta.data() as unknown as {
      players?: () => Player[];
    },
    other =
      negotiation?.players?.().find((each: Player) => each !== player) ?? null;

  if (other === null) {
    return null;
  }

  const accept = values.find((value) => value instanceof Accept),
    decline = values.find((value) => value instanceof Decline);

  if (accept !== undefined && decline !== undefined) {
    const proposal = (accept as Resolution).proposal() as Proposal;

    return (acceptsProposal(dependencies, player, other, proposal)
      ? accept
      : decline) as unknown as DataForChoiceMeta<ChoiceMeta<Name>>;
  }

  const leave = values.find((value) => value instanceof Terminate),
    made = new Set<Function>(
      (
        (negotiation as { interactions?: () => unknown[] }).interactions?.() ??
        []
      )
        .filter(
          (interaction: unknown): boolean =>
            interaction instanceof Proposal && interaction.by() === player
        )
        .map(
          (interaction: unknown): Function =>
            (interaction as object).constructor
        )
    ),
    proposed = proposalFrom(dependencies, player, other, talking, made);

  if (proposed === null && leave === undefined) {
    return null;
  }

  return (proposed ?? leave) as DataForChoiceMeta<ChoiceMeta<Name>>;
};

export default personStep;
