// Civ1: the AI's government, a revolution to Monarchy once it's known.
import {
  Anarchy as AnarchyGovernment,
  Monarchy as MonarchyGovernment,
} from '@civ-clone/civ1-government/Governments';
import {
  pendingRevolution,
  revolution,
} from '@civ-clone/civ1-government/lib/revolution';
import Dependencies from '../Dependencies';
import { Monarchy as MonarchyAdvance } from '@civ-clone/civ1-science/Advances';
import Player from '@civ-clone/core-player/Player';

// Through a revolution, like a human player: Anarchy first, then `ChooseGovernment` once it's over.
export const startRevolution = (
  dependencies: Dependencies,
  player: Player
): void => {
  const [playerGovernment] = dependencies.playerGovernmentRegistry.filter(
      (playerGovernment) => playerGovernment.player() === player
    ),
    [playerResearch] = dependencies.playerResearchRegistry.filter(
      (playerScience) => playerScience.player() === player
    );

  if (
    playerResearch.completed(MonarchyAdvance) &&
    !playerGovernment.is(MonarchyGovernment, AnarchyGovernment) &&
    pendingRevolution(playerGovernment, dependencies.pendingEffectRegistry) ===
      null
  ) {
    revolution(
      playerGovernment,
      dependencies.pendingEffectRegistry,
      dependencies.ruleRegistry,
      dependencies.turn
    );
  }
};
