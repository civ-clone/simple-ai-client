"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.personStep = exports.proposalFrom = exports.acceptsProposal = exports.hasProposalMenu = void 0;
const treatyLevel_1 = require("@civ-clone/base-diplomacy/lib/treatyLevel");
const rivals_1 = require("../Player/rivals");
const Accept_1 = require("@civ-clone/core-diplomacy/Proposal/Accept");
const AskAlly_1 = require("@civ-clone/library-diplomacy/Proposals/AskAlly");
const AttackConfidence_1 = require("@civ-clone/base-leader-personality/Rules/Player/AttackConfidence");
const Decline_1 = require("@civ-clone/core-diplomacy/Proposal/Decline");
const DemandTribute_1 = require("@civ-clone/library-diplomacy/Proposals/DemandTribute");
const DemandWithdrawal_1 = require("@civ-clone/library-diplomacy/Proposals/DemandWithdrawal");
const ExchangeKnowledge_1 = require("@civ-clone/library-diplomacy/Proposals/ExchangeKnowledge");
const JoinWar_1 = require("@civ-clone/library-diplomacy/Proposals/JoinWar");
const OfferCeasefire_1 = require("@civ-clone/library-diplomacy/Proposals/OfferCeasefire");
const OfferPeace_1 = require("@civ-clone/library-diplomacy/Proposals/OfferPeace");
const Proposal_1 = require("@civ-clone/core-diplomacy/Negotiation/Proposal");
const ProposalAvailable_1 = require("@civ-clone/base-diplomacy/Rules/ProposalAvailable");
const ProposeAlliance_1 = require("@civ-clone/library-diplomacy/Proposals/ProposeAlliance");
const SellAdvance_1 = require("@civ-clone/library-diplomacy/Proposals/SellAdvance");
const Terminate_1 = require("@civ-clone/core-diplomacy/Negotiation/Terminate");
const combine_1 = require("@civ-clone/base-leader-personality/lib/combine");
// Whether the rule set gives a person a menu of proposals in a meeting (Civ2's does; Civ1's doesn't).
const hasProposalMenu = (dependencies) => { var _a, _b; return ((_b = (_a = dependencies.ruleRegistry) === null || _a === void 0 ? void 0 : _a.get(ProposalAvailable_1.default).length) !== null && _b !== void 0 ? _b : 0) > 0; };
exports.hasProposalMenu = hasProposalMenu;
// Whether `player` feels the stronger of the two against `other`.
const feelsStronger = (dependencies, player, other) => (0, rivals_1.confidentPower)(dependencies, player, other) >=
    (0, rivals_1.powerOfPlayer)(dependencies, other);
// Whether `player` means to fight `other`: its rival.
const meansWar = (dependencies, player, other) => (0, rivals_1.rivalOf)(dependencies, player) === other;
const allied = (dependencies, player, other) => (0, treatyLevel_1.hasTreatyLevel)(dependencies, player, other, treatyLevel_1.TreatyLevel.Alliance);
// Whether `player` and `other` have an enemy in common: a third player with a city that both are at war with (a war in
//  force, so not a player either has yet to meet).
const commonEnemy = (dependencies, player, other) => [
    ...new Set(dependencies.cityRegistry
        .entries()
        .filter((city) => !city.destroyed())
        .map((city) => city.player())),
].some((third) => third !== player &&
    third !== other &&
    (0, treatyLevel_1.treatyLevel)(dependencies, player, third) === treatyLevel_1.TreatyLevel.War &&
    (0, treatyLevel_1.treatyLevel)(dependencies, other, third) === treatyLevel_1.TreatyLevel.War);
/** Whether `player` accepts `proposal`, made by `other`. */
const acceptsProposal = (dependencies, player, other, proposal) => {
    if (proposal instanceof OfferPeace_1.default ||
        proposal instanceof OfferCeasefire_1.default ||
        proposal instanceof ProposeAlliance_1.default) {
        return !meansWar(dependencies, player, other);
    }
    if (proposal instanceof DemandTribute_1.default ||
        proposal instanceof DemandWithdrawal_1.default) {
        return !feelsStronger(dependencies, player, other);
    }
    if (proposal instanceof JoinWar_1.default || proposal instanceof AskAlly_1.default) {
        const against = proposal instanceof JoinWar_1.default ? proposal.against() : null;
        return (allied(dependencies, player, other) &&
            (against === null || feelsStronger(dependencies, player, against)));
    }
    if (proposal instanceof SellAdvance_1.default) {
        return false;
    }
    return true;
};
exports.acceptsProposal = acceptsProposal;
/**
 * What `player` proposes to `other` from `menu`, or `null` to leave. Nothing it has proposed already in these talks
 *  (`made`, by class) is proposed again: what was refused once is left.
 */
const proposalFrom = (dependencies, player, other, menu, made = new Set()) => {
    var _a;
    const find = (Type) => {
        var _a;
        return made.has(Type)
            ? null
            : (_a = menu.find((step) => step instanceof Type)) !== null && _a !== void 0 ? _a : null;
    };
    // At war, peace or failing that a ceasefire; under a ceasefire, which lapses, peace.
    if (!(0, treatyLevel_1.hasTreatyLevel)(dependencies, player, other, treatyLevel_1.TreatyLevel.Peace)) {
        if (meansWar(dependencies, player, other)) {
            return null;
        }
        return (0, treatyLevel_1.hasTreatyLevel)(dependencies, player, other, treatyLevel_1.TreatyLevel.Ceasefire)
            ? find(OfferPeace_1.default)
            : (_a = find(OfferPeace_1.default)) !== null && _a !== void 0 ? _a : find(OfferCeasefire_1.default);
    }
    if (!allied(dependencies, player, other) &&
        !meansWar(dependencies, player, other) &&
        (commonEnemy(dependencies, player, other) ||
            (0, combine_1.product)(dependencies.ruleRegistry, AttackConfidence_1.default, player, other) < 1)) {
        const alliance = find(ProposeAlliance_1.default);
        if (alliance !== null) {
            return alliance;
        }
    }
    return find(ExchangeKnowledge_1.default);
};
exports.proposalFrom = proposalFrom;
/**
 * The AI's step in a meeting where it speaks for a person and the rule set leaves it a choice (see above), or `null`
 *  where it doesn't: no menu in this rule set, or only one thing to say besides leaving.
 */
const personStep = (dependencies, player, meta) => {
    var _a, _b, _c, _d, _e;
    const values = meta.choices().map((choice) => choice.value()), talking = values.filter((value) => !(value instanceof Terminate_1.default));
    if (talking.length < 2 || !(0, exports.hasProposalMenu)(dependencies)) {
        return null;
    }
    const negotiation = meta.data(), other = (_b = (_a = negotiation === null || negotiation === void 0 ? void 0 : negotiation.players) === null || _a === void 0 ? void 0 : _a.call(negotiation).find((each) => each !== player)) !== null && _b !== void 0 ? _b : null;
    if (other === null) {
        return null;
    }
    const accept = values.find((value) => value instanceof Accept_1.default), decline = values.find((value) => value instanceof Decline_1.default);
    if (accept !== undefined && decline !== undefined) {
        const proposal = accept.proposal();
        return ((0, exports.acceptsProposal)(dependencies, player, other, proposal)
            ? accept
            : decline);
    }
    const leave = values.find((value) => value instanceof Terminate_1.default), made = new Set(((_e = (_d = (_c = negotiation).interactions) === null || _d === void 0 ? void 0 : _d.call(_c)) !== null && _e !== void 0 ? _e : [])
        .filter((interaction) => interaction instanceof Proposal_1.default && interaction.by() === player)
        .map((interaction) => interaction.constructor)), proposed = (0, exports.proposalFrom)(dependencies, player, other, talking, made);
    if (proposed === null && leave === undefined) {
        return null;
    }
    return (proposed !== null && proposed !== void 0 ? proposed : leave);
};
exports.personStep = personStep;
exports.default = exports.personStep;
//# sourceMappingURL=personTalks.js.map