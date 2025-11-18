import { runExplainabilityAgent } from './mastraAgent.js';

export async function explainPrediction(prediction, metadata = {}) {
  return runExplainabilityAgent(prediction, metadata);
}
