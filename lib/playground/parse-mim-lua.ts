import * as luainjs from "lua-in-js"
import type {
  MimColumn,
  MimEntry,
  MimEntryValue,
  MimModule,
  MimParseError,
  MimParseResult,
  MimPrompt,
  MimPromptSection,
  MimPromptTools,
  MimFieldType,
} from "./types"

function isTable(v: unknown): v is luainjs.Table {
  return v !== null && typeof v === "object" && "get" in v && "numValues" in v
}

function coerceString(v: unknown, stage: string, key: string): string {
  if (typeof v === "string") return decodeXUserDefined(v)
  if (typeof v === "number") return String(v)
  if (typeof v === "boolean") return String(v)
  if (v === undefined || v === null) return ""
  console.warn("[playground:parse-mim-lua] coerceString fallback", { stage, key, type: typeof v })
  return ""
}

function coerceNumber(v: unknown, stage: string, key: string): number {
  if (typeof v === "number") return v
  if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) return Number(v)
  console.warn("[playground:parse-mim-lua] coerceNumber fallback", { stage, key, type: typeof v })
  return 0
}

function coerceBoolean(v: unknown, stage: string, key: string): boolean {
  if (typeof v === "boolean") return v
  if (v === undefined || v === null) return false
  console.warn("[playground:parse-mim-lua] coerceBoolean fallback", { stage, key, type: typeof v })
  return Boolean(v)
}

function tableKeys(tbl: luainjs.Table): string[] {
  const keys: string[] = []
  if (tbl.keys) {
    for (const k of tbl.keys) keys.push(String(k))
  }
  if (tbl.strValues) {
    for (const k of Object.keys(tbl.strValues)) {
      if (!keys.includes(k)) keys.push(k)
    }
  }
  return keys
}

function tableArray(tbl: luainjs.Table): luainjs.Table[] {
  const arr: luainjs.Table[] = []
  if (tbl.numValues) {
    for (let i = 1; i < tbl.numValues.length; i++) {
      const v = tbl.numValues[i]
      if (isTable(v)) arr.push(v)
    }
  }
  return arr
}

function parseColumn(id: string, tbl: luainjs.Table): MimColumn {
  const label = coerceString(tbl.get("label"), "column", "label")
  const description = coerceString(tbl.get("description"), "column", "description")
  const field_type = coerceString(tbl.get("field_type"), "column", "field_type") as MimFieldType
  const is_required = coerceBoolean(tbl.get("is_required"), "column", "is_required")
  const read_only = coerceBoolean(tbl.get("read_only"), "column", "read_only")
  return {
    id,
    label,
    description,
    field_type: field_type || "STRING",
    is_required,
    read_only,
    kind: read_only ? "output" : "input",
  }
}

function parseColumns(columnsRaw: unknown): MimColumn[] {
  if (!isTable(columnsRaw)) {
    console.warn("[playground:parse-mim-lua] columns is not a table")
    return []
  }
  const keys = tableKeys(columnsRaw as luainjs.Table).sort()
  const cols: MimColumn[] = []
  for (const id of keys) {
    if (!/^[A-Z]+$/.test(id)) continue
    const colRaw = (columnsRaw as luainjs.Table).get(id)
    if (!isTable(colRaw)) continue
    cols.push(parseColumn(id, colRaw))
  }
  return cols
}

function parseEntryValue(v: unknown): MimEntryValue {
  if (typeof v === "string") return decodeXUserDefined(v)
  if (typeof v === "number") return v
  if (typeof v === "boolean") return v
  if (v === undefined || v === null) return null
  if (isTable(v)) {
    const obj = (v as luainjs.Table).toObject()
    if (typeof obj === "object" && obj !== null && !Array.isArray(obj)) {
      return JSON.stringify(obj)
    }
    return String(obj)
  }
  return null
}

function parseEntry(tbl: luainjs.Table, index: number): MimEntry {
  const entry: MimEntry = { id: index, status: "ожидает" } as MimEntry
  const keys = tableKeys(tbl)
  for (const k of keys) {
    const v = tbl.get(k)
    entry[k] = parseEntryValue(v)
  }
  return entry
}

function parseEntries(entriesRaw: unknown): MimEntry[] {
  if (!isTable(entriesRaw)) {
    console.warn("[playground:parse-mim-lua] entry is not a table")
    return []
  }
  const tables = tableArray(entriesRaw as luainjs.Table)
  return tables.map((t, i) => parseEntry(t, i))
}

function dedent(text: string): string {
  const lines = text.split(/\r?\n/)
  const nonEmpty = lines.filter((l) => l.trim() !== "")
  if (nonEmpty.length === 0) return text
  const indent = Math.min(...nonEmpty.map((l) => l.match(/^\s*/)![0].length))
  return lines.map((l) => (l.trim() === "" ? "" : l.slice(indent))).join("\n")
}

function splitYamlSections(raw: string): MimPromptSection[] {
  const lines = raw.split(/\r?\n/)
  const sections: MimPromptSection[] = []
  let currentKey = ""
  let currentBuf: string[] = []
  let inBlock = false

  const flush = () => {
    if (currentKey) {
      const raw = currentBuf.join("\n").replace(/^\n+/, "").replace(/\s+$/, "")
      const dedented = dedent(raw)
      sections.push({ key: currentKey, content: dedented })
    }
    currentKey = ""
    currentBuf = []
  }

  for (const line of lines) {
    const headerMatch = line.match(/^(\w+):\s*\|?\s*$/)
    if (headerMatch && (line.includes("|") || inBlock === false || line.trim().endsWith(":"))) {
      if (inBlock) flush()
      currentKey = headerMatch[1]
      inBlock = true
      if (line.includes("|")) {
        continue
      }
      continue
    }
    if (inBlock) {
      if (/^\S/.test(line) && !line.startsWith(" ") && !line.startsWith("\t") && line.trim() !== "") {
        flush()
        inBlock = false
        const subMatch = line.match(/^(\w+):\s*(.*)$/)
        if (subMatch) {
          currentKey = subMatch[1]
          const rest = subMatch[2].trim()
          if (rest === "|" || rest === "") {
            inBlock = true
            continue
          } else {
            currentBuf.push(rest)
            inBlock = true
            continue
          }
        }
      }
      currentBuf.push(line)
    }
  }
  flush()
  return sections.filter((s) => s.key && s.content)
}

function parseToolBlock(content: string): MimPromptTools | null {
  const lines = content.split(/\r?\n/)
  const trimmed = lines.map((l) => l.replace(/^\s+/, ""))
  const nameMatch = trimmed.find((l) => l.startsWith("usage:"))
  if (!nameMatch) return null
  const usage = nameMatch.replace(/^usage:\s*/, "").replace(/^["']|["']$/g, "")
  const copilotIdLine = trimmed.find((l) => l.startsWith("copilot_id:"))
  const copilotId = copilotIdLine ? copilotIdLine.replace(/^copilot_id:\s*/, "").replace(/^["']|["']$/g, "") : ""
  const signatureLine = trimmed.find((l) => l.startsWith("signature:"))
  const signature = signatureLine ? signatureLine.replace(/^signature:\s*/, "").replace(/^["']|["']$/g, "") : ""
  const parameters: Record<string, string> = {}
  const examples: string[] = []
  let inParameters = false
  let inExamples = false
  for (const l of trimmed) {
    if (l.startsWith("parameters:")) {
      inParameters = true
      inExamples = false
      continue
    }
    if (l.startsWith("examples:")) {
      inParameters = false
      inExamples = true
      continue
    }
    if (inParameters && /^[\w_]+:/.test(l)) {
      const [k, ...rest] = l.split(":")
      parameters[k.trim()] = rest.join(":").trim().replace(/^["']|["']$/g, "")
    }
    if (inExamples && l.startsWith("-")) {
      examples.push(l.replace(/^-\s*/, "").trim().replace(/^["']|["']$/g, ""))
    }
  }
  return {
    name: "",
    usage,
    copilotId,
    signature,
    parameters,
    examples,
  }
}

function parsePrompt(promptRaw: string): MimPrompt {
  const sections = splitYamlSections(promptRaw)
  const taskSection = sections.find((s) => s.key === "task")
  const systemRoleSection = sections.find((s) => s.key === "system_role")
  const toolsSection = sections.find((s) => s.key === "tools")
  const validationSection = sections.find((s) => s.key === "validation_rules")
  const outputFormatSection = sections.find((s) => s.key === "output_format")
  const specialCasesSection = sections.find((s) => s.key === "special_cases")

  const tools: MimPromptTools[] = []
  if (toolsSection) {
    const toolNameRegex = /^(?:\s{0,2})(\w+):\s*$/gm
    const toolNames = [...toolsSection.content.matchAll(toolNameRegex)].map((m) => m[1])
    for (const toolName of toolNames) {
      const re = new RegExp(`^(?:\\s{0,2})${toolName}:\\s*\\n((?:\\s{2,}.*\\n?)+)`, "m")
      const m = toolsSection.content.match(re)
      if (m) {
        const tool = parseToolBlock(m[1])
        if (tool) {
          tool.name = toolName
          tools.push(tool)
        }
      }
    }
  }

  const validationRules: { field: string; check: string; errorMessage: string; minLength?: number }[] = []
  if (validationSection) {
    const blocks = validationSection.content.split(/(?=^\s*-\s*field:)/m)
    for (const block of blocks) {
      const fieldM = block.match(/field:\s*(.+)/)
      const checkM = block.match(/check:\s*(.+)/)
      const errM = block.match(/error_message:\s*(.+)/)
      const minM = block.match(/min_length:\s*(\d+)/)
      if (fieldM && checkM && errM) {
        validationRules.push({
          field: fieldM[1].trim().replace(/^["']|["']$/g, ""),
          check: checkM[1].trim().replace(/^["']|["']$/g, ""),
          errorMessage: errM[1].trim().replace(/^["']|["']$/g, ""),
          minLength: minM ? Number(minM[1]) : undefined,
        })
      }
    }
  }

  const outputFormat: Record<string, string> = {}
  if (outputFormatSection) {
    for (const line of outputFormatSection.content.split(/\r?\n/)) {
      const m = line.match(/^\s*(\w+):\s*(.+)/)
      if (m) outputFormat[m[1]] = m[2].trim().replace(/^["']|["']$/g, "")
    }
  }

  const specialCases: { condition: string; action: string }[] = []
  if (specialCasesSection) {
    const blocks = specialCasesSection.content.split(/(?=^\s*-\s*condition:)/m)
    for (const block of blocks) {
      const condM = block.match(/condition:\s*"?(.+?)"?\s*$/m)
      const actM = block.match(/action:\s*"?(.+?)"?\s*$/m)
      if (condM && actM) {
        specialCases.push({
          condition: condM[1].trim().replace(/"$/, ""),
          action: actM[1].trim().replace(/"$/, ""),
        })
      }
    }
  }

  return {
    raw: promptRaw,
    sections,
    task: taskSection?.content ?? "",
    systemRole: systemRoleSection?.content ?? "",
    tools,
    validationRules,
    outputFormat,
    specialCases,
  }
}

function convertLongStrings(source: string): string {
  return source.replace(/\[(=*)\[([\s\S]*?)\]\1\]/g, (_match, equals, content) => {
    let s = content
    if (s.startsWith("\n")) s = s.slice(1)
    s = s.replace(/\\/g, "\\\\")
    s = s.replace(/"/g, '\\"')
    s = s.replace(/\n/g, "\\n")
    s = s.replace(/\r/g, "\\r")
    s = s.replace(/\t/g, "\\t")
    return '"' + s + '"'
  })
}

function escapeNonAsciiForLua(source: string): string {
  const converted = convertLongStrings(source)
  const encoder = new TextEncoder()
  let out = ""
  for (const ch of converted) {
    const code = ch.codePointAt(0) ?? 0
    if (code > 0x7f) {
      const bytes = encoder.encode(ch)
      for (const b of bytes) {
        out += "\\" + b.toString(10).padStart(3, "0")
      }
    } else {
      out += ch
    }
  }
  return out
}

function decodeXUserDefined(s: string): string {
  if (typeof s !== "string" || s.length === 0) return s
  let hasHigh = false
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i)
    if (c >= 0xf700 && c <= 0xf7ff) {
      hasHigh = true
      break
    }
  }
  if (!hasHigh) return s
  const bytes = new Uint8Array(s.length)
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i)
    bytes[i] = c >= 0xf700 && c <= 0xf7ff ? c & 0xff : c & 0xff
  }
  try {
    return new TextDecoder("utf-8", { fatal: false }).decode(bytes)
  } catch {
    return s
  }
}

export function parseMimLua(source: string): MimParseResult {
  console.debug("[playground:parse-mim-lua] start", { sourceLength: source.length })
  let ret: unknown
  try {
    const env = luainjs.createEnv()
    const escaped = escapeNonAsciiForLua(source)
    const script = env.parse(escaped)
    ret = script.exec()
  } catch (e) {
    const err: MimParseError = {
      message: e instanceof Error ? e.message : String(e),
      stage: "lua-exec",
      detail: e,
    }
    console.error("[playground:parse-mim-lua] lua-exec failed", err)
    return { ok: false, error: err }
  }

  if (!isTable(ret)) {
    const err: MimParseError = {
      message: "mim.lua не вернул таблицу (ожидался `return mim`)",
      stage: "adapter",
    }
    console.error("[playground:parse-mim-lua] return is not a table", { type: typeof ret })
    return { ok: false, error: err }
  }

  try {
    const name = coerceString(ret.get("name"), "module", "name")
    const description = coerceString(ret.get("description"), "module", "description")
    const columns = parseColumns(ret.get("columns"))
    const entry = parseEntries(ret.get("entry"))
    const promptRaw = coerceString(ret.get("prompt"), "module", "prompt")
    const prompt = parsePrompt(promptRaw)

    if (!name) {
      console.warn("[playground:parse-mim-lua] name is empty")
    }
    if (columns.length === 0) {
      console.warn("[playground:parse-mim-lua] no columns parsed")
    }

    const inputColumns = columns.filter((c) => c.kind === "input")
    const outputColumns = columns.filter((c) => c.kind === "output")

    const module: MimModule = {
      name,
      description,
      columns,
      inputColumns,
      outputColumns,
      entry,
      prompt,
    }
    console.info("[playground:parse-mim-lua] parsed ok", {
      name,
      columnsCount: columns.length,
      inputCount: inputColumns.length,
      outputCount: outputColumns.length,
      entryCount: entry.length,
      toolsCount: prompt.tools.length,
    })
    return { ok: true, module }
  } catch (e) {
    const err: MimParseError = {
      message: e instanceof Error ? e.message : String(e),
      stage: "adapter",
      detail: e,
    }
    console.error("[playground:parse-mim-lua] adapter failed", err)
    return { ok: false, error: err }
  }
}