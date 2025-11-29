import { Mastra } from "@mastra/core/mastra";
import { maintenanceAgent } from "./agents/maintenance-agent";

export const mastra = new Mastra({
  agents: { maintenanceAgent },
});