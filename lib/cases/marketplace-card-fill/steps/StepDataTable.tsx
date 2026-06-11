"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { marketplaceCardFillConfig } from "../config"
import { MARKETPLACE_PRODUCTS, type MarketplaceProduct } from "../data"
import type { BaseRow } from "../../types"

interface StepDataTableProps {
  caseSlug: string
  onNext: () => void
  onBack: () => void
}

export interface MarketplaceProductRow extends BaseRow {
  name: string
  article: string
  exactName: string
  category: string
  subcategory: string
  brand: string
  description: string
  country: string
  weightKg: number
  lengthCm: number
  widthCm: number
  heightCm: number
  color: string
  material: string
  model: string
  keywords: string[]
  photoUrls: string[]
  equipment: string
  warranty: string
  ageCategory: string
  fillStatus: "ожидает" | "обрабатывается" | "заполнено"
}

const BATCH_SIZE = 5
const BATCH_DELAY_MS = 50

const fillStatusColor: Record<string, string> = {
  ожидает: "bg-gray-500/15 text-gray-600 dark:text-gray-400",
  обрабатывается: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  заполнено: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
}

const VISIBLE_COLS = ["A", "C", "D", "E", "T"]

export function StepDataTable({
  caseSlug,
  onNext,
  onBack,
}: StepDataTableProps) {
  const caseConfig = marketplaceCardFillConfig
  const [tableData, setTableData] = React.useState<MarketplaceProductRow[]>([])
  const [isFilling, setIsFilling] = React.useState(false)
  const [isFilled, setIsFilled] = React.useState(false)
  const [lastAddedCount, setLastAddedCount] = React.useState(0)
  const [selectedRow, setSelectedRow] =
    React.useState<MarketplaceProductRow | null>(null)
  const scrollRef = React.useRef<HTMLDivElement>(null)

  if (process.env.NODE_ENV !== "production") {
    console.debug("[marketplace-card-fill:datatable] render", {
      rowCount: tableData.length,
      selectedRow: selectedRow?.id,
    })
  }

  const totalRows = MARKETPLACE_PRODUCTS.length
  const dataLength = tableData.length
  const fillProgress = Math.round((dataLength / totalRows) * 100)

  const handleFillData = React.useCallback(() => {
    if (isFilling) return
    setIsFilling(true)
    setTableData([])
    setIsFilled(false)

    let batchIndex = 0

    const interval = setInterval(() => {
      const start = batchIndex * BATCH_SIZE
      const end = Math.min(start + BATCH_SIZE, totalRows)
      batchIndex++

      const newRows: MarketplaceProductRow[] = []
      for (let i = start; i < end; i++) {
        newRows.push(toMarketplaceProductRow(MARKETPLACE_PRODUCTS[i], i))
      }
      setTableData((prev) => [...prev, ...newRows])
      setLastAddedCount(end - start)

      if (end >= totalRows) {
        clearInterval(interval)
        setIsFilling(false)
        setIsFilled(true)
      }

      if (process.env.NODE_ENV !== "production") {
        console.debug("[marketplace-card-fill:datatable] fillData", {
          count: end,
        })
      }
    }, BATCH_DELAY_MS)
  }, [isFilling, totalRows])

  React.useEffect(() => {
    if (isFilling && scrollRef.current) {
      const scrollEl = scrollRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      )
      if (scrollEl) {
        scrollEl.scrollTop = scrollEl.scrollHeight
      }
    }
  }, [tableData, isFilling])

  const columns = caseConfig.dataTable.columns
  const visibleColumns = columns.filter((c) => VISIBLE_COLS.includes(c.id))

  const getColumnValue = (row: MarketplaceProductRow, colId: string): string => {
    switch (colId) {
      case "A": return row.name
      case "B": return row.article
      case "C": return row.exactName
      case "D": return `${row.category} / ${row.subcategory}`
      case "E": return row.brand
      case "F": return row.description
      case "G": return row.country
      case "H": return String(row.weightKg)
      case "I": return String(row.lengthCm)
      case "J": return String(row.widthCm)
      case "K": return String(row.heightCm)
      case "L": return row.color
      case "M": return row.material
      case "N": return row.model
      case "O": return row.keywords.join(", ")
      case "P": return `${row.photoUrls.length} фото`
      case "Q": return row.equipment
      case "R": return row.warranty
      case "S": return row.ageCategory
      case "T": return row.fillStatus
      default: return ""
    }
  }

  const getColumnCell = (row: MarketplaceProductRow, colId: string) => {
    if (colId === "D") {
      return (
        <span className="inline-flex items-center gap-1 text-[10px]">
          <span className="rounded bg-blue-500/10 px-1.5 py-0.5 font-medium text-blue-700 dark:text-blue-400">
            {row.category}
          </span>
          <span className="text-muted-foreground">/</span>
          <span className="rounded bg-purple-500/10 px-1.5 py-0.5 font-medium text-purple-700 dark:text-purple-400">
            {row.subcategory}
          </span>
        </span>
      )
    }
    if (colId === "L") {
      return (
        <span className="inline-flex items-center rounded-full bg-gray-500/15 px-2 py-0.5 text-[10px] font-medium">
          {row.color}
        </span>
      )
    }
    if (colId === "O") {
      return (
        <span className="flex flex-wrap gap-0.5">
          {row.keywords.slice(0, 3).map((kw, i) => (
            <span
              key={i}
              className="inline-flex rounded bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-medium text-emerald-700 dark:text-emerald-400"
            >
              {kw}
            </span>
          ))}
          {row.keywords.length > 3 && (
            <span className="text-[9px] text-muted-foreground">
              +{row.keywords.length - 3}
            </span>
          )}
        </span>
      )
    }
    if (colId === "P") {
      return (
        <span className="text-[10px] text-blue-600 dark:text-blue-400 underline decoration-dotted">
          {row.photoUrls.length} фото
        </span>
      )
    }
    if (colId === "T") {
      return (
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${fillStatusColor[row.fillStatus] || ""}`}
        >
          {row.fillStatus === "обрабатывается" && (
            <span className="mr-1 animate-spin">⟳</span>
          )}
          {row.fillStatus}
        </span>
      )
    }
    const value = getColumnValue(row, colId)
    return value || "—"
  }

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
                <span className="text-3xl">{caseConfig.dataTable.emptyIcon}</span>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">
                  {caseConfig.dataTable.emptyTitle}
                </p>
                <p className="text-xs">{caseConfig.dataTable.emptyDesc}</p>
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
                    {visibleColumns.map((col) => (
                      <th
                        key={col.id}
                        className={`px-2 py-2 font-medium ${
                          col.id === "C"
                            ? "hidden sm:table-cell"
                            : ""
                        }`}
                      >
                        {col.id} — {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableData.map((row, index) => {
                    const isNew =
                      index >= tableData.length - lastAddedCount && isFilling
                    return (
                      <tr
                        key={row.id}
                        className={`cursor-pointer border-b transition-colors hover:bg-muted/50 ${isNew ? "row-animate-in" : ""}`}
                        style={
                          isNew
                            ? {
                                animationDelay: `${(index % BATCH_SIZE) * 40}ms`,
                              }
                            : undefined
                        }
                        onClick={() => setSelectedRow(row)}
                      >
                        <td className="px-2 py-2 text-muted-foreground">
                          {row.id}
                        </td>
                        <td className="px-2 py-2 font-medium">{row.name}</td>
                        <td className="hidden px-2 py-2 sm:table-cell">
                          {row.exactName || "—"}
                        </td>
                        <td className="px-2 py-2">{getColumnCell(row, "D")}</td>
                        <td className="px-2 py-2">{row.brand || "—"}</td>
                        <td className="px-2 py-2">
                          {getColumnCell(row, "T")}
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

      {selectedRow && (
        <Dialog
          open={!!selectedRow}
          onOpenChange={(open) => {
            if (!open) setSelectedRow(null)
          }}
        >
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Строка {selectedRow.id}</DialogTitle>
              <DialogDescription>
                Данные выбранной строки таблицы
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              {columns.map((col) => {
                return (
                  <div key={col.id} className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-muted-foreground">
                      {col.id} — {col.label}
                    </span>
                    <span className="whitespace-pre-wrap text-sm">
                      {getColumnCell(selectedRow, col.id)}
                    </span>
                  </div>
                )
              })}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

export function toMarketplaceProductRow(
  item: MarketplaceProduct,
  index: number
): MarketplaceProductRow {
  return {
    id: index + 1,
    status: "ожидает",
    name: item.name,
    article: item.article,
    exactName: item.exactName,
    category: item.category,
    subcategory: item.subcategory,
    brand: item.brand,
    description: item.description,
    country: item.country,
    weightKg: item.weightKg,
    lengthCm: item.lengthCm,
    widthCm: item.widthCm,
    heightCm: item.heightCm,
    color: item.color,
    material: item.material,
    model: item.model,
    keywords: item.keywords,
    photoUrls: item.photoUrls,
    equipment: item.equipment,
    warranty: item.warranty,
    ageCategory: item.ageCategory,
    fillStatus: "ожидает",
  }
}