import type { ScenarioDefinition } from "../types"
import { registerScenario } from "../registry"

export const priceSearchStub: ScenarioDefinition<string> = {
  meta: {
    slug: "price-search",
    title: "Поиск цен",
    description: "Заглушка сценария price-search",
    icon: "🛍️",
    available: false,
  },
  config: {
    slug: "price-search",
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
  data: [],
  toRow: (item: string, index: number) => ({
    id: index + 1,
    status: "ожидает",
    product: item,
  }),
  steps: {
    StepChat: () => null,
    StepMimLua: () => null,
    StepDataTable: () => null,
    StepProcessing: () => null,
  },
}

registerScenario("price-search", priceSearchStub as ScenarioDefinition<unknown>)
