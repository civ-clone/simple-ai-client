import {
  ClientRegistry,
  instance as clientRegistryInstance,
} from '@civ-clone/core-client/ClientRegistry';
import {
  UnitRegistry,
  instance as unitRegistryInstance,
} from '@civ-clone/core-unit/UnitRegistry';
import City from '@civ-clone/core-city/City';
import Criterion from '@civ-clone/core-rule/Criterion';
import Destroyed from '@civ-clone/core-city/Rules/Destroyed';
import Effect from '@civ-clone/core-rule/Effect';
import Player from '@civ-clone/core-player/Player';
import SimpleAIClient from '../../SimpleAIClient';

export const getRules: (
  unitRegistry?: UnitRegistry,
  clientRegistry?: ClientRegistry
) => Destroyed[] = (
  unitRegistry: UnitRegistry = unitRegistryInstance,
  clientRegistry: ClientRegistry = clientRegistryInstance
): Destroyed[] => [
  new Destroyed(
    new Criterion(
      (city: City) =>
        clientRegistry.getByPlayer(city.player()) instanceof SimpleAIClient
    ),
    new Effect((city: City, player: Player | null): void =>
      (clientRegistry.getByPlayer(city.player()) as SimpleAIClient).cityLost(
        city,
        player,
        true
      )
    )
  ),
];

export default getRules;
