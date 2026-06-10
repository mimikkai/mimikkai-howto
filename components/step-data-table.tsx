"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { CASE_CONFIGS, PRODUCTS, THREADS_POSTS } from "@/lib/case-config"

interface StepDataTableProps {
  caseSlug: string
  onNext: () => void
  onBack: () => void
}

interface PriceDataRow {
  id: number
  product: string
  price: string
  status: "ожидает" | "обработка" | "найдено" | "не найдено"
}

interface ThreadsDataRow {
  id: number
  date: string
  postUrl: string
  postText: string
  comment: string
  status: "ожидает" | "обработка" | "Готово"
}

const BATCH_SIZE = 5
const BATCH_DELAY_MS = 50

export function StepDataTable({ caseSlug, onNext, onBack }: StepDataTableProps) {
  const caseConfig = CASE_CONFIGS[caseSlug]
  const isThreads = caseSlug === "threads-comments"

  const [priceData, setPriceData] = React.useState<PriceDataRow[]>([])
  const [threadsData, setThreadsData] = React.useState<ThreadsDataRow[]>([])
  const [isFilling, setIsFilling] = React.useState(false)
  const [isFilled, setIsFilled] = React.useState(false)
  const [lastAddedCount, setLastAddedCount] = React.useState(0)
  const scrollRef = React.useRef<HTMLDivElement>(null)

  const totalRows = isThreads ? THREADS_POSTS.length : PRODUCTS.length
  const dataLength = isThreads ? threadsData.length : priceData.length
  const fillProgress = Math.round((dataLength / totalRows) * 100)

  const handleFillData = React.useCallback(() => {
    if (isFilling) return
    setIsFilling(true)
    setPriceData([])
    setThreadsData([])
    setIsFilled(false)

    let batchIndex = 0

    const interval = setInterval(() => {
      const start = batchIndex * BATCH_SIZE
      const end = Math.min(start + BATCH_SIZE, totalRows)
      batchIndex++

      if (isThreads) {
        const newRows: ThreadsDataRow[] = []
        for (let i = start; i < end; i++) {
          newRows.push({
            id: i + 1,
            date: THREADS_POSTS[i].date,
            postUrl: "",
            postText: "",
            comment: "",
            status: "ожидает" as const,
          })
        }
        setThreadsData((prev) => [...prev, ...newRows])
      } else {
        const newRows: PriceDataRow[] = []
        for (let i = start; i < end; i++) {
          newRows.push({
            id: i + 1,
            product: PRODUCTS[i],
            price: "",
            status: "ожидает" as const,
          })
        }
        setPriceData((prev) => [...prev, ...newRows])
      }

      setLastAddedCount(end - start)

      if (end >= totalRows) {
        clearInterval(interval)
        setIsFilling(false)
        setIsFilled(true)
      }
    }, BATCH_DELAY_MS)
  }, [isFilling, isThreads, totalRows])

  React.useEffect(() => {
    if (isFilling && scrollRef.current) {
      const scrollEl = scrollRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      )
      if (scrollEl) {
        scrollEl.scrollTop = scrollEl.scrollHeight
      }
    }
  }, [priceData, threadsData, isFilling])

  const priceStatusColor: Record<string, string> = {
    ожидает: "bg-gray-500/15 text-gray-600 dark:text-gray-400",
    обработка: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
    найдено: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
    "не найдено": "bg-red-500/15 text-red-700 dark:text-red-400",
  }

  const threadsStatusColor: Record<string, string> = {
    ожидает: "bg-gray-500/15 text-gray-600 dark:text-gray-400",
    обработка: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
    Готово: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  }

  const columns = caseConfig.dataTable.columns

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center gap-3">
        <Badge variant="outline">Шаг 3 из 4</Badge>
        <h2 className="text-lg font-semibold">Таблица данных</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        {caseConfig.dataTable.description}
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
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
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
                <p className="text-sm font-medium">{caseConfig.dataTable.emptyTitle}</p>
                <p className="text-xs">
                  {caseConfig.dataTable.emptyDesc}
                </p>
              </div>
            </div>
          ) : isThreads ? (
            <ScrollArea ref={scrollRef} className="md:h-[440px] h-[calc(100dvh-340px)]">
              <table className="w-full text-xs">
                <thead className="sticky top-0 z-10 bg-card shadow-[0_1px_0_var(--color-border)]">
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="w-8 px-2 py-2 font-medium">#</th>
                    {columns.map((col) => (
                      <th
                        key={col.id}
                        className={`px-2 py-2 font-medium ${
                          col.id === "C" ? "hidden sm:table-cell" : ""
                        } ${
                          col.id === "D" ? "hidden md:table-cell" : ""
                        } ${
                          col.id === "B" ? "hidden lg:table-cell w-36" : ""
                        }`}
                      >
                        {col.id} — {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {threadsData.map((row, index) => {
                    const isNew =
                      index >= threadsData.length - lastAddedCount && isFilling
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
                          {row.id}
                        </td>
                        <td className="px-2 py-2 font-medium">{row.date}</td>
                        <td className="hidden px-2 py-2 text-muted-foreground lg:table-cell">
                          {row.postUrl || "—"}
                        </td>
                        <td className="hidden px-2 py-2 text-muted-foreground sm:table-cell max-w-[200px] truncate">
                          {row.postText || "—"}
                        </td>
                        <td className="hidden px-2 py-2 text-muted-foreground md:table-cell max-w-[160px] truncate">
                          {row.comment || "—"}
                        </td>
                        <td className="px-2 py-2">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${threadsStatusColor[row.status]}`}
                          >
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </ScrollArea>
          ) : (
            <ScrollArea ref={scrollRef} className="md:h-[440px] h-[calc(100dvh-340px)]">
              <table className="w-full text-xs">
                <thead className="sticky top-0 z-10 bg-card shadow-[0_1px_0_var(--color-border)]">
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="w-12 px-3 py-2 font-medium">#</th>
                    <th className="px-3 py-2 font-medium">
                      A — Название товара
                    </th>
                    <th className="hidden w-36 px-3 py-2 font-medium sm:table-cell">B — Цена</th>
                    <th className="w-28 px-3 py-2 font-medium">C — Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {priceData.map((row, index) => {
                    const isNew =
                      index >= priceData.length - lastAddedCount && isFilling
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
                        <td className="px-3 py-2 text-muted-foreground">
                          {row.id}
                        </td>
                        <td className="px-3 py-2 font-medium">{row.product}</td>
                        <td className="hidden px-3 py-2 text-muted-foreground sm:table-cell">
                          {row.price || "—"}
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${priceStatusColor[row.status]}`}
                          >
                            {row.status}
                          </span>
                        </td>
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
              {isFilling ? "Заполнение..." : caseConfig.dataTable.fillButtonText}
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