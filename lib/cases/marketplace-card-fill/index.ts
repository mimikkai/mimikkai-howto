import type { ScenarioDefinition } from "../types"
import { registerScenario } from "../registry"
import { marketplaceCardFillConfig } from "./config"
import { MARKETPLACE_PRODUCTS, type MarketplaceProduct } from "./data"
import { StepChat } from "./steps/StepChat"
import { StepMimLua } from "./steps/StepMimLua"
import { StepDataTable, toMarketplaceProductRow, type MarketplaceProductRow } from "./steps/StepDataTable"
import { StepProcessing } from "./steps/StepProcessing"

export type { MarketplaceProductRow }

export const marketplaceCardFillScenario: ScenarioDefinition<
  MarketplaceProduct,
  MarketplaceProductRow
> = {
  meta: {
    slug: "marketplace-card-fill",
    title: "Заполнение карточек на маркетплейсе",
    description:
      "Агент ищет информацию на сайте поставщика и заполняет карточку товара на Ozon",
    icon: "🛒",
    available: true,
  },
  config: marketplaceCardFillConfig,
  data: MARKETPLACE_PRODUCTS,
  toRow: toMarketplaceProductRow,
  steps: {
    StepChat,
    StepMimLua,
    StepDataTable,
    StepProcessing,
  },
}

registerScenario(
  "marketplace-card-fill",
  marketplaceCardFillScenario as ScenarioDefinition<unknown>
)