import { instance as ruleRegistryInstance } from '@civ-clone/core-rule/RuleRegistry';
import captured from './Rules/City/captured';
import destroyed from './Rules/City/destroyed';
import defeated from './Rules/Unit/defeated';

ruleRegistryInstance.register(...captured(), ...defeated(), ...destroyed());
