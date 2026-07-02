"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { parseMimLua } from "@/lib/playground/parse-mim-lua"
import { extractMimLua } from "@/lib/playground/extract-archive"
import { EXAMPLE_MIM_LUA } from "@/lib/playground/example-mim-lua"
import type { MimModule } from "@/lib/playground/types"

interface StepUploadProps {
  onParsed: (mod: MimModule, filename: string) => void
}

type Status =
  | { kind: "idle" }
  | { kind: "reading" }
  | { kind: "error"; message: string }
  | { kind: "ok"; preview: string; filename: string }

const ACCEPT = ".lua,.zip"

export function StepUpload({ onParsed }: StepUploadProps) {
  const [status, setStatus] = React.useState<Status>({ kind: "idle" })
  const [isDragging, setIsDragging] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.debug("[playground:step-upload] render", { status: status.kind })
    }
  }, [status])

  const processSource = React.useCallback(
    (source: string, filename: string) => {
      console.debug("[playground:step-upload] processSource", {
        filename,
        length: source.length,
      })
      setStatus({ kind: "reading" })
      const result = parseMimLua(source)
      if (!result.ok) {
        console.error("[playground:step-upload] parse failed", result.error)
        setStatus({
          kind: "error",
          message: `Ошибка парсинга (${result.error.stage}): ${result.error.message}`,
        })
        return
      }
      setStatus({
        kind: "ok",
        preview: result.module.name,
        filename,
      })
      onParsed(result.module, filename)
    },
    [onParsed]
  )

  const handleFile = React.useCallback(
    async (file: File) => {
      console.info("[playground:step-upload] file selected", {
        name: file.name,
        size: file.size,
      })
      const extract = await extractMimLua(file)
      if (!extract.ok) {
        console.error("[playground:step-upload] extract failed", extract)
        setStatus({
          kind: "error",
          message: `Ошибка (${extract.stage}): ${extract.message}`,
        })
        return
      }
      processSource(extract.source, extract.filename)
    },
    [processSource]
  )

  const handleInputChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  const handleDrop = React.useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files?.[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  const handleDragOver = React.useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = React.useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleLoadExample = React.useCallback(() => {
    console.info("[playground:step-upload] load example")
    processSource(EXAMPLE_MIM_LUA, "mim.lua (пример)")
  }, [processSource])

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex items-center gap-3">
        <Badge variant="outline">Playground</Badge>
        <h2 className="text-lg font-semibold">Загрузите mim.lua</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Загрузите файл <code className="rounded bg-muted px-1.5 py-0.5 text-xs">mim.lua</code> или
        архив <code className="rounded bg-muted px-1.5 py-0.5 text-xs">.zip</code> с mim.lua
        внутри — посмотрите, как ваш сценарий будет выглядеть в MimikkAi.
      </p>

      <div className="flex flex-1 flex-col items-center justify-center gap-6">
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`flex w-full max-w-xl cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-12 text-center transition-all ${
            isDragging
              ? "border-primary bg-primary/5 scale-[1.01]"
              : "border-border hover:border-primary/50 hover:bg-muted/30"
          }`}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            onChange={handleInputChange}
            className="hidden"
          />
          <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-3xl">
            📥
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">
              Перетащите файл сюда или нажмите для выбора
            </p>
            <p className="text-xs text-muted-foreground">
              Поддерживаются <code className="text-xs">.lua</code> и{" "}
              <code className="text-xs">.zip</code> (с mim.lua внутри)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="h-px w-12 bg-border" />
          <span className="text-xs text-muted-foreground">или</span>
          <div className="h-px w-12 bg-border" />
        </div>

        <Button
          size="lg"
          variant="outline"
          className="gap-2 rounded-2xl"
          onClick={handleLoadExample}
        >
          <span className="text-lg">📝</span>
          Загрузить пример
        </Button>
      </div>

      {status.kind === "reading" && (
        <Card className="animate-in fade-in duration-300">
          <CardContent className="flex items-center gap-3 p-4">
            <span className="inline-flex size-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="text-sm text-muted-foreground">
              Читаю и паршу mim.lua…
            </span>
          </CardContent>
        </Card>
      )}

      {status.kind === "error" && (
        <Card className="animate-in fade-in border-red-500/50 duration-300">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <span className="text-lg text-red-500">⚠️</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-red-700 dark:text-red-400">
                  Не удалось загрузить mim.lua
                </p>
                <p className="mt-1 text-xs text-muted-foreground break-all">
                  {status.message}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {status.kind === "ok" && (
        <Card className="animate-in fade-in border-emerald-500/50 duration-300">
          <CardContent className="flex items-center gap-3 p-4">
            <span className="text-lg text-emerald-500">✅</span>
            <div className="flex-1">
              <p className="text-sm font-medium">
                {status.preview}
              </p>
              <p className="text-xs text-muted-foreground">{status.filename}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}