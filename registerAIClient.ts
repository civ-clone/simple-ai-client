import { instance as aiClientRegistryInstance } from '@civ-clone/core-ai-client/AIClientRegistry';
import BarbarianClient from './BarbarianClient';
import SimpleAIClient from './SimpleAIClient';

aiClientRegistryInstance.register(SimpleAIClient);
aiClientRegistryInstance.register(BarbarianClient);
