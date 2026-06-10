export interface BaseRow {
  id: number
  status: string
}

export interface ScenarioMeta {
  slug: string
  title: string
  description: string
  icon: string
  available: boolean
}

export interface ChatConfig {
  greeting: string
  presetPrompt: string
  presetPromptDesc: string
  assistantResponse: string
}

export interface MimLuaColumn {
  id: string
  label: string
  example: string
}

export interface MimLuaPromptStep {
  text: string
  icon: string
}

export interface MimLuaConfig {
  inputColumns: MimLuaColumn[]
  outputColumns: MimLuaColumn[]
  promptSteps: MimLuaPromptStep[]
  agentTitle: string
  agentDesc: string
  promptIntro: string
}

export interface DataTableColumn {
  id: string
  label: string
  type: "input" | "output"
}

export interface DataTableConfig {
  columns: DataTableColumn[]
  description: string
  fillButtonText: string
  emptyIcon: string
  emptyTitle: string
  emptyDesc: string
}

export interface CaseConfig {
  slug: string
  chat: ChatConfig
  mimLua: MimLuaConfig
  dataTable: DataTableConfig
}

export type NormalizedBrowserPhase =
  | "idle"
  | "loading"
  | "typing"
  | "results"
  | "detail"
  | "form"
  | "writing"
  | "done"

export interface StepChatProps {
  caseSlug: string
  onComplete: (prompt: string) => void
}

export interface StepMimLuaProps {
  caseSlug: string
  onNext: () => void
  onBack: () => void
}

export interface StepDataTableProps {
  caseSlug: string
  onNext: () => void
  onBack: () => void
}

export interface StepProcessingProps {
  caseSlug: string
  onBack: () => void
}

export type StepComponent<P> = (props: P) => React.ReactNode

export interface ScenarioStepComponents {
  StepChat: StepComponent<StepChatProps>
  StepMimLua: StepComponent<StepMimLuaProps>
  StepDataTable: StepComponent<StepDataTableProps>
  StepProcessing: StepComponent<StepProcessingProps>
}

export interface ScenarioDefinition<TData, TRow extends BaseRow = BaseRow> {
  meta: ScenarioMeta
  config: CaseConfig
  data: TData[]
  toRow: (item: TData, index: number) => TRow
  steps: ScenarioStepComponents
}

if (process.env.NODE_ENV !== "production") {
  console.debug("[cases:types] module loaded", {
    normalizedPhases: [
      "idle",
      "loading",
      "typing",
      "results",
      "detail",
      "form",
      "writing",
      "done",
    ],
  })
}
