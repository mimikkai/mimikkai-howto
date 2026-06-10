import type { BaseRow, ScenarioDefinition } from "../types"
import { registerScenario } from "../registry"
import { threadsCommentsConfig } from "./config"
import { THREADS_POSTS, type ThreadsPost } from "./data"
import { StepChat } from "./steps/StepChat"
import { StepMimLua } from "./steps/StepMimLua"
import { StepDataTable, toThreadsRow } from "./steps/StepDataTable"
import { StepProcessing } from "./steps/StepProcessing"

export interface ThreadsDataRow extends BaseRow {
  date: string
  postUrl: string
  postText: string
  comment: string
  status: "ожидает" | "обработка" | "Готово"
}

export const threadsCommentsScenario: ScenarioDefinition<
  ThreadsPost,
  ThreadsDataRow
> = {
  meta: {
    slug: "threads-comments",
    title: "Комментирование в Threads",
    description:
      "Агент находит посты об AI в Threads и оставляет нативные комментарии",
    icon: "📣",
    available: true,
  },
  config: threadsCommentsConfig,
  data: THREADS_POSTS,
  toRow: toThreadsRow,
  steps: {
    StepChat,
    StepMimLua,
    StepDataTable,
    StepProcessing,
  },
}

registerScenario(
  "threads-comments",
  threadsCommentsScenario as ScenarioDefinition<unknown>
)
