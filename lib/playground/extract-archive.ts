import { unzipSync, strFromU8 } from "fflate"

export interface ExtractResult {
  ok: true
  source: string
  filename: string
}

export interface ExtractError {
  ok: false
  message: string
  stage: "read-file" | "unzip" | "find-mim-lua" | "decode"
}

export type ExtractArchiveResult = ExtractResult | ExtractError

const MIM_LUA_FILENAME = "mim.lua"

export async function extractMimLua(file: File): Promise<ExtractArchiveResult> {
  console.debug("[playground:extract-archive] start", {
    name: file.name,
    size: file.size,
    type: file.type,
  })

  const isZip =
    file.name.toLowerCase().endsWith(".zip") ||
    file.type === "application/zip" ||
    file.type === "application/x-zip-compressed"

  if (!isZip) {
    try {
      const text = await file.text()
      console.debug("[playground:extract-archive] plain lua", {
        length: text.length,
      })
      return { ok: true, source: text, filename: file.name }
    } catch (e) {
      return {
        ok: false,
        message: e instanceof Error ? e.message : String(e),
        stage: "read-file",
      }
    }
  }

  try {
    const buf = new Uint8Array(await file.arrayBuffer())
    let files: Record<string, Uint8Array>
    try {
      files = unzipSync(buf)
    } catch (e) {
      return {
        ok: false,
        message: e instanceof Error ? e.message : "Не удалось распаковать .zip",
        stage: "unzip",
      }
    }

    const entries = Object.keys(files)
    console.debug("[playground:extract-archive] zip entries", { entries })

    const mimEntry =
      entries.find((n) => n === MIM_LUA_FILENAME) ??
      entries.find((n) => n.toLowerCase().endsWith("mim.lua")) ??
      entries.find((n) => n.toLowerCase().endsWith(".lua"))

    if (!mimEntry) {
      return {
        ok: false,
        message: "В архиве не найден mim.lua",
        stage: "find-mim-lua",
      }
    }

    const data = files[mimEntry]
    let source: string
    try {
      source = strFromU8(data)
    } catch {
      try {
        source = new TextDecoder("utf-8", { fatal: false }).decode(data)
      } catch (e) {
        return {
          ok: false,
          message: e instanceof Error ? e.message : "Ошибка декодирования",
          stage: "decode",
        }
      }
    }

    console.info("[playground:extract-archive] extracted", {
      filename: mimEntry,
      sourceLength: source.length,
    })
    return { ok: true, source, filename: mimEntry }
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : String(e),
      stage: "read-file",
    }
  }
}