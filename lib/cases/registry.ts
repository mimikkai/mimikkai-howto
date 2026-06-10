import type { BaseRow, ScenarioDefinition } from "./types"

const registry: Record<string, ScenarioDefinition<unknown, BaseRow>> = {}

export function getScenario(slug: string): ScenarioDefinition<unknown, BaseRow> | null {
  const scenario = registry[slug]
  if (!scenario) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[cases:registry] scenario not found", {
        slug,
        availableSlugs: Object.keys(registry),
      })
    }
    return null
  }
  return scenario
}

export function listScenarios(): ScenarioDefinition<unknown, BaseRow>[] {
  return Object.values(registry)
}

export function registerScenario(
  slug: string,
  scenario: ScenarioDefinition<unknown, BaseRow>
): void {
  if (registry[slug]) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[cases:registry] overriding existing scenario", { slug })
    }
  }
  registry[slug] = scenario
  if (process.env.NODE_ENV !== "production") {
    console.info("[cases:registry] registered", {
      slug,
      hasSteps: Object.keys(scenario.steps).length,
    })
  }
}

if (process.env.NODE_ENV !== "production") {
  console.debug("[cases:registry] initialized", { count: Object.keys(registry).length })
}
