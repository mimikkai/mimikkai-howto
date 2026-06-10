import type { ScenarioDefinition } from "../types"
import { registerScenario } from "../registry"
import { emailOutreachConfig } from "./config"
import { EMAIL_CONTACTS, type EmailContact } from "./data"
import { StepChat } from "./steps/StepChat"
import { StepMimLua } from "./steps/StepMimLua"
import { StepDataTable, toEmailRow, type EmailDataRow } from "./steps/StepDataTable"
import { StepProcessing } from "./steps/StepProcessing"

export type { EmailDataRow }

export const emailOutreachScenario: ScenarioDefinition<
  EmailContact,
  EmailDataRow
> = {
  meta: {
    slug: "email-outreach",
    title: "Email рассылка",
    description:
      "Агент ищет компании через Яндекс, находит контакты и отправляет персонализированные письма",
    icon: "📧",
    available: true,
  },
  config: emailOutreachConfig,
  data: EMAIL_CONTACTS,
  toRow: toEmailRow,
  steps: {
    StepChat,
    StepMimLua,
    StepDataTable,
    StepProcessing,
  },
}

registerScenario(
  "email-outreach",
  emailOutreachScenario as ScenarioDefinition<unknown>
)