import { test } from "node:test"
import assert from "node:assert/strict"
import "./price-search"
import {
  getScenario,
  listScenarios,
  registerScenario,
} from "./registry"
import type { BaseRow, ScenarioDefinition } from "./types"

interface TestData {
  value: string
}

const stubScenario: ScenarioDefinition<TestData> = {
  meta: {
    slug: "test-scenario",
    title: "Test",
    description: "",
    icon: "🧪",
    available: true,
  },
  config: {
    slug: "test-scenario",
    chat: {
      greeting: "",
      presetPrompt: "",
      presetPromptDesc: "",
      assistantResponse: "",
    },
    mimLua: {
      inputColumns: [],
      outputColumns: [],
      promptSteps: [],
      agentTitle: "",
      agentDesc: "",
      promptIntro: "",
    },
    dataTable: {
      columns: [],
      description: "",
      fillButtonText: "",
      emptyIcon: "",
      emptyTitle: "",
      emptyDesc: "",
    },
  },
  data: [{ value: "x" }],
  toRow: (item, index) => ({ id: index + 1, status: "ожидает", value: item.value }),
  steps: {
    StepChat: () => null,
    StepMimLua: () => null,
    StepDataTable: () => null,
    StepProcessing: () => null,
  },
}

test("getScenario returns null for unknown slug", () => {
  const result = getScenario("definitely-not-registered")
  assert.equal(result, null)
})

test("getScenario returns scenario for registered slug", () => {
  registerScenario("test-scenario", stubScenario as ScenarioDefinition<unknown>)
  const result = getScenario("test-scenario")
  assert.ok(result)
  assert.equal(result?.meta.slug, "test-scenario")
})

test("listScenarios contains registered scenarios", () => {
  const scenarioA: ScenarioDefinition<TestData> = {
    ...stubScenario,
    meta: { ...stubScenario.meta, slug: "test-scenario-2" },
  }
  registerScenario("test-scenario-2", scenarioA as ScenarioDefinition<unknown>)
  const list = listScenarios()
  const slugs = list.map((s) => s.meta.slug)
  assert.ok(slugs.includes("test-scenario-2"), `slugs: ${slugs.join(",")}`)
})

test("registry contains price-search (loaded at module init time)", () => {
  const result = getScenario("price-search")
  assert.ok(result, "price-search should be registered by lib/cases/price-search/index.ts")
  assert.equal(result?.meta.slug, "price-search")
  assert.equal(result?.meta.available, true)
})
