export type MimFieldType = "STRING" | "NUMBER" | "BOOLEAN"

export interface MimColumn {
  id: string
  label: string
  description: string
  field_type: MimFieldType
  is_required: boolean
  read_only: boolean
  kind: "input" | "output"
}

export type MimEntryValue = string | number | boolean | null

export type MimEntry = Record<string, MimEntryValue> & {
  id: number
  status: "ожидает" | "обработка" | "готово"
}

export interface MimPromptSection {
  key: string
  content: string
}

export interface MimPromptTools {
  name: string
  usage: string
  copilotId: string
  signature: string
  parameters: Record<string, string>
  examples: string[]
}

export interface MimPrompt {
  raw: string
  sections: MimPromptSection[]
  task: string
  systemRole: string
  tools: MimPromptTools[]
  validationRules: { field: string; check: string; errorMessage: string; minLength?: number }[]
  outputFormat: Record<string, string>
  specialCases: { condition: string; action: string }[]
}

export interface MimModule {
  name: string
  description: string
  columns: MimColumn[]
  inputColumns: MimColumn[]
  outputColumns: MimColumn[]
  entry: MimEntry[]
  prompt: MimPrompt
}

export interface MimParseError {
  message: string
  stage: "lua-exec" | "adapter" | "validation"
  detail?: unknown
}

export type MimParseResult =
  | { ok: true; module: MimModule }
  | { ok: false; error: MimParseError }

if (process.env.NODE_ENV !== "production") {
  console.debug("[playground:types] module loaded", {
    fieldTypes: ["STRING", "NUMBER", "BOOLEAN"],
  })
}