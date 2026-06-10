import type { BaseRow, ScenarioDefinition } from "../types"
import { registerScenario } from "../registry"
import { priceSearchConfig } from "./config"
import { PRODUCTS } from "./data"
import { StepChat } from "./steps/StepChat"
import { StepMimLua } from "./steps/StepMimLua"
import { StepDataTable, toPriceRow } from "./steps/StepDataTable"
import { StepProcessing } from "./steps/StepProcessing"

export interface PriceDataRow extends BaseRow {
  product: string
  price: string
  status: "ожидает" | "обработка" | "найдено" | "не найдено"
}

export const priceSearchScenario: ScenarioDefinition<string, PriceDataRow> = {
  meta: {
    slug: "price-search",
    title: "Поиск цен",
    description: "Агент находит цены товаров, переходя на сайты магазинов",
    icon: "🛍️",
    available: true,
  },
  config: priceSearchConfig,
  data: PRODUCTS,
  toRow: toPriceRow,
  steps: {
    StepChat,
    StepMimLua,
    StepDataTable,
    StepProcessing,
  },
}

registerScenario("price-search", priceSearchScenario as ScenarioDefinition<unknown>)
