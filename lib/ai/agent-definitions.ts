/**
 * Agent Definitions for KINK IT
 * Pre-configured agents for different use cases
 */

import { Agent } from "@openai/agents"
import { KINKY_KINCADE_INSTRUCTIONS } from "./kinky-kincade-instructions"

// Kinky Kincade - The Digital Guide
// Kinky Kincade is a system KINKSTER representing the AI assistant
export const kinkItAssistant = new Agent({
  name: "Kinky Kincade",
  instructions: KINKY_KINCADE_INSTRUCTIONS,
  model: "gpt-4o-mini",
})

// Task Management Agent - Specialized for task-related queries
export const taskManagementAgent = new Agent({
  name: "Task Management Agent",
  instructions: `You are a specialized assistant for task management in KINK IT.
  
You help users:
- Create and manage tasks
- Understand task priorities and statuses
- Track task completion
- Provide insights on task patterns

Focus on practical task management advice while respecting D/s dynamics and submission states.`,
  model: "gpt-4o-mini",
})

// Bond Management Agent - Specialized for bond-related queries
export const bondManagementAgent = new Agent({
  name: "Bond Management Agent",
  instructions: `You are a specialized assistant for bond management in KINK IT.
  
You help users:
- Understand bond types (dyads, polycules, households)
- Manage bond members and permissions
- Navigate bond settings and configurations
- Understand bond roles and responsibilities

Be knowledgeable about polyamory, relationship structures, and consent frameworks.`,
  model: "gpt-4o-mini",
})

// Kinkster Character Agent - Specialized for character creation and roleplay
export const kinksterCharacterAgent = new Agent({
  name: "Kinkster Character Agent",
  instructions: `You are a specialized assistant for Kinkster character creation and roleplay in KINK IT.
  
You help users:
- Create and customize kinkster characters
- Understand stat systems and character attributes
- Generate character backstories and personalities
- Provide roleplay guidance

Be creative and supportive while maintaining appropriate boundaries.`,
  model: "gpt-4o-mini",
})

// Agent Registry
export const agentRegistry = {
  "kink-it-assistant": kinkItAssistant,
  "task-management": taskManagementAgent,
  "bond-management": bondManagementAgent,
  "kinkster-character": kinksterCharacterAgent,
}

export type AgentName = keyof typeof agentRegistry

export function getAgent(name: AgentName): Agent {
  return agentRegistry[name]
}

export function getAllAgents(): Record<string, Agent> {
  return agentRegistry
}
