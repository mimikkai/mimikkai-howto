import type { BaseRow, ScenarioDefinition } from "../types"
import { registerScenario } from "../registry"
import { ticketReplyConfig } from "./config"
import { TICKETS, type TicketItem } from "./data"
import { StepChat } from "./steps/StepChat"
import { StepMimLua } from "./steps/StepMimLua"
import { StepDataTable, toTicketRow } from "./steps/StepDataTable"
import { StepProcessing } from "./steps/StepProcessing"

export interface TicketDataRow extends BaseRow {
  date: string
  question: string
  answer: string
  source: string
  status: "ожидает" | "обработка" | "отвечено" | "не найдено"
}

export const ticketReplyScenario: ScenarioDefinition<TicketItem, TicketDataRow> = {
  meta: {
    slug: "ticket-reply",
    title: "Ответ на тикеты",
    description:
      "ИИ-агент отвечает на обращения клиентов, ища ответы в wiki-документации",
    icon: "🎫",
    available: true,
  },
  config: ticketReplyConfig,
  data: TICKETS,
  toRow: toTicketRow,
  steps: {
    StepChat,
    StepMimLua,
    StepDataTable,
    StepProcessing,
  },
}

registerScenario("ticket-reply", ticketReplyScenario as ScenarioDefinition<unknown>)

if (process.env.NODE_ENV !== "production") {
  console.debug("[ticket-reply:index] registered", { slug: "ticket-reply" })
}