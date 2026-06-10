import type { ScenarioDefinition } from "../types"
import { registerScenario } from "../registry"
import { crmOrderTrackingConfig } from "./config"
import { CRM_ORDERS, type CrmOrder } from "./data"
import { StepChat } from "./steps/StepChat"
import { StepMimLua } from "./steps/StepMimLua"
import { StepDataTable, toCrmOrderRow, type CrmOrderRow } from "./steps/StepDataTable"
import { StepProcessing } from "./steps/StepProcessing"

export type { CrmOrderRow }

export const crmOrderTrackingScenario: ScenarioDefinition<
  CrmOrder,
  CrmOrderRow
> = {
  meta: {
    slug: "crm-order-tracking",
    title: "Отслеживание доставок в CRM",
    description:
      "Агент проверяет статус доставки, обновляет CRM и уведомляет клиента",
    icon: "📦",
    available: true,
  },
  config: crmOrderTrackingConfig,
  data: CRM_ORDERS,
  toRow: toCrmOrderRow,
  steps: {
    StepChat,
    StepMimLua,
    StepDataTable,
    StepProcessing,
  },
}

registerScenario(
  "crm-order-tracking",
  crmOrderTrackingScenario as ScenarioDefinition<unknown>
)