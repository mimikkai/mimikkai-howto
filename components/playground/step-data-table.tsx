"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import type { MimModule, MimEntry } from "@/lib/playground/types"

interface StepDataTableProps {
  mim: MimModule
  onNext: () => void
  onBack: () => void
}

const BATCH_SIZE = 5
const BATCH_DELAY_MS = 50

export function StepDataTable({ mim, onNext, onBack }: StepDataTableProps) {
  const [rows, setRows] = React.useState<MimEntry[]>([])
  const [isFilling, setIsFilling] = React.useState(false)
  const [isFilled, setIsFilled] = React.useState(false)
  const [lastAddedCount, setLastAddedCount] = React.useState(0)
  const scrollRef = React.useRef<HTMLDivElement>(null)

  const totalRows = mim.entry.length
  const dataLength = rows.length
  const fillProgress = Math.round((dataLength / totalRows) * 100)

  const columns = mim.columns
  const visibleCols = columns.slice(0, 5)

  React.useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.debug("[playground:step-data-table] render", {
        rowCount: rows.length,
        totalRows,
        colsCount: columns.length,
      })
    }
  }, [rows.length, totalRows, columns.length])

  const handleFillData = React.useCallback(() => {
    if (isFilling) return
    setIsFilling(true)
    setRows([])
    setIsFilled(false)

    let batchIndex = 0
    const interval = setInterval(() => {
      const start = batchIndex * BATCH_SIZE
      const end = Math.min(start + BATCH_SIZE, totalRows)
      batchIndex++

      const newRows: MimEntry[] = []
      for (let i = start; i < end; i++) {
        newRows.push({ ...mim.entry[i], id: i, status: "ожидает" })
      }
      setRows((prev) => [...prev, ...newRows])
      setLastAddedCount(end - start)

      if (end >= totalRows) {
        clearInterval(interval)
        setIsFilling(false)
        setIsFilled(true)
      }
    }, BATCH_DELAY_MS)
  }, [isFilling, totalRows, mim.entry])

  React.useEffect(() => {
    if (isFilling && scrollRef.current) {
      const scrollEl = scrollRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      )
      if (scrollEl) {
        scrollEl.scrollTop = scrollEl.scrollHeight
      }
    }
  }, [rows, isFilling])

  const getCellValue = (row: MimEntry, colId: string): string => {
    const v = row[colId]
    if (v === null || v === undefined) return ""
    return String(v)
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center gap-3">
        <Badge variant="outline">Шаг 3 из 4</Badge>
        <h2 className="text-lg font-semibold">Таблица данных</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Данные из <code className="rounded bg-muted px-1.5 py-0.5 text-xs">mim.entry</code> —
        ИИ-агент обработает {totalRows} строк.
      </p>

      {(isFilling || (isFilled && dataLength > 0)) && (
        <div className="flex items-center gap-3">
          <Progress value={fillProgress} className="flex-1" />
          <span className="text-xs text-muted-foreground tabular-nums">
            {dataLength}/{totalRows} строк
          </span>
        </div>
      )}

      <Card className="min-h-0 flex-1">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-sm">
            <span>Данные для обработки</span>
            <span className="text-xs text-muted-foreground">
              {dataLength} строк
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="min-h-0 pb-0">
          {dataLength === 0 && !isFilling ? (
            <div className="flex h-[440px] flex-col items-center justify-center gap-4 text-muted-foreground">
              <div className="flex size-16 items-center justify-center rounded-full bg-muted">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
                  <path d="M14 2v6h6" />
                  <path d="M8 13h2" />
                  <path d="M14 13h2" />
                  <path d="M8 17h2" />
                  <path d="M14 17h2" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">Нет данных</p>
                <p className="text-xs">Нажмите кнопку ниже, чтобы заполнить таблицу</p>
              </div>
            </div>
          ) : (
            <ScrollArea
              ref={scrollRef}
              className="h-[calc(100dvh-340px)] md:h-[440px]"
            >
              <table className="w-full text-xs">
                <thead className="sticky top-0 z-10 bg-card shadow-[0_1px_0_var(--color-border)]">
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="w-8 px-2 py-2 font-medium">#</th>
                    {visibleCols.map((col) => (
                      <th
                        key={col.id}
                        className={`px-2 py-2 font-medium ${
                          col.kind === "output" ? "hidden lg:table-cell" : ""
                        } ${col.id === visibleCols[visibleCols.length - 1]?.id ? "" : ""}`}
                      >
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {col.id}
                        </span>{" "}
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => {
                    const isNew =
                      index >= rows.length - lastAddedCount && isFilling
                    return (
                      <tr
                        key={row.id}
                        className={`border-b transition-colors hover:bg-muted/50 ${isNew ? "row-animate-in" : ""}`}
                        style={
                          isNew
                            ? {
                                animationDelay: `${(index % BATCH_SIZE) * 40}ms`,
                              }
                            : undefined
                        }
                      >
                        <td className="px-2 py-2 text-muted-foreground">
                          {row.id + 1}
                        </td>
                        {visibleCols.map((col) => {
                          const v = getCellValue(row, col.id)
                          return (
                            <td
                              key={col.id}
                              className={`px-2 py-2 ${col.kind === "output" ? "hidden lg:table-cell" : ""}`}
                            >
                              {v ? (
                                <span
                                  className={`max-w-[200px] truncate inline-block ${
                                    col.kind === "output"
                                      ? "text-purple-700 dark:text-purple-400"
                                      : "text-foreground"
                                  }`}
                                >
                                  {v}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          ← Назад
        </Button>
        <div className="flex gap-2">
          {!isFilled && (
            <Button
              size="lg"
              className="gap-2"
              onClick={handleFillData}
              disabled={isFilling}
            >
              {isFilling ? "Заполнение..." : "Заполнить данные"}
            </Button>
          )}
          {isFilled && (
            <Button size="lg" className="gap-2" onClick={onNext}>
              Начать обработку
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}