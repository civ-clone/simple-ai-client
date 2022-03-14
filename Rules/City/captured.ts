import {
  ClientRegistry,
  instance as clientRegistryInstance,
} from '@civ-clone/core-client/ClientRegistry';
import {
  UnitRegistry,
  instance as unitRegistryInstance,
} from '@civ-clone/core-unit/UnitRegistry';
import Captured from '@civ-clone/core-city/Rules/Captured';
import City from '@civ-clone/core-city/City';
import Criterion from '@civ-clone/core-rule/Criterion';
import Effect from '@civ-clone/core-rule/Effect';
import Player from '@civ-clone/core-player/Player';
import SimpleAIClient from '../../SimpleAIClient';

export const getRules: (
  unitRegistry?: UnitRegistry,
  clientRegistry?: ClientRegistry
) => Captured[] = (
  unitRegistry: UnitRegistry = unitRegistryInstance,
  clientRegistry: ClientRegistry = clientRegistryInstance
): Captured[] => [
  new Captured(
    new Criterion(
      (city: City, player: Player) =>
        clientRegistry.getByPlayer(player) instanceof SimpleAIClient
    ),
    new Effect((city: City, player: Player, capturingPlayer: Player): void =>
      (clientRegistry.getByPlayer(player) as SimpleAIClient).cityLost(
        city,
        capturingPlayer,
        false
      )
    )
  ),
];

export default getRules;
