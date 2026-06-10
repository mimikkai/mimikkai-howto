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
import { crmOrderTrackingConfig } from "../config"
import { CRM_ORDERS, type CrmOrder } from "../data"
import type { BaseRow } from "../../types"

interface StepDataTableProps {
  caseSlug: string
  onNext: () => void
  onBack: () => void
}

export interface CrmOrderRow extends BaseRow {
  orderNumber: string
  client: string
  trackNumber: string
  deliveryStatus: "ожидает" | "обрабатывается" | "отслежено"
  eta: string
  notifyChannel: "telegram" | "email" | "whatsapp"
  notifySent: boolean
}

const BATCH_SIZE = 5
const BATCH_DELAY_MS = 50

const crmStatusColor: Record<string, string> = {
  ожидает: "bg-gray-500/15 text-gray-600 dark:text-gray-400",
  обрабатывается: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  отслежено: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
}

const VISIBLE_COLS = ["A", "B", "D", "F"]

const channelIcon: Record<string, string> = {
  telegram: "📱",
  email: "📧",
  whatsapp: "💬",
}

const channelLabel: Record<string, string> = {
  telegram: "Telegram",
  email: "Email",
  whatsapp: "WhatsApp",
}

export function StepDataTable({
  caseSlug,
  onNext,
  onBack,
}: StepDataTableProps) {
  const caseConfig = crmOrderTrackingConfig
  const [crmData, setCrmData] = React.useState<CrmOrderRow[]>([])
  const [isFilling, setIsFilling] = React.useState(false)
  const [isFilled, setIsFilled] = React.useState(false)
  const [lastAddedCount, setLastAddedCount] = React.useState(0)
  const [selectedRow, setSelectedRow] = React.useState<CrmOrderRow | null>(
    null
  )
  const scrollRef = React.useRef<HTMLDivElement>(null)

  if (process.env.NODE_ENV !== "production") {
    console.debug("[crm-order-tracking:datatable] render", {
      rowCount: crmData.length,
      selectedRow: selectedRow?.id,
    })
  }

  const totalRows = CRM_ORDERS.length
  const dataLength = crmData.length
  const fillProgress = Math.round((dataLength / totalRows) * 100)

  const handleFillData = React.useCallback(() => {
    if (isFilling) return
    setIsFilling(true)
    setCrmData([])
    setIsFilled(false)

    let batchIndex = 0

    const interval = setInterval(() => {
      const start = batchIndex * BATCH_SIZE
      const end = Math.min(start + BATCH_SIZE, totalRows)
      batchIndex++

      const newRows: CrmOrderRow[] = []
      for (let i = start; i < end; i++) {
        newRows.push({
          id: i + 1,
          status: "ожидает",
          orderNumber: CRM_ORDERS[i].orderNumber,
          client: "",
          trackNumber: "",
          deliveryStatus: "ожидает" as const,
          eta: "",
          notifyChannel: CRM_ORDERS[i].notifyChannel,
          notifySent: false,
        })
      }
      setCrmData((prev) => [...prev, ...newRows])
      setLastAddedCount(end - start)

      if (end >= totalRows) {
        clearInterval(interval)
        setIsFilling(false)
        setIsFilled(true)
      }

      if (process.env.NODE_ENV !== "production") {
        console.debug("[crm-order-tracking:datatable] fillData", { count: end })
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
  }, [crmData, isFilling])

  const columns = caseConfig.dataTable.columns
  const visibleColumns = columns.filter((c) => VISIBLE_COLS.includes(c.id))

  const getColumnValue = (row: CrmOrderRow, colId: string): string => {
    switch (colId) {
      case "A": return row.orderNumber
      case "B": return row.client
      case "C": return row.trackNumber
      case "D": return row.deliveryStatus
      case "E": return row.eta
      case "F": return row.notifySent
        ? `${channelIcon[row.notifyChannel]} ${channelLabel[row.notifyChannel]} — отправлено`
        : "—"
      default: return ""
    }
  }

  const getColumnCell = (row: CrmOrderRow, colId: string) => {
    if (colId === "D") {
      return (
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${crmStatusColor[row.deliveryStatus] || ""}`}
        >
          {row.deliveryStatus}
        </span>
      )
    }
    if (colId === "F") {
      if (row.notifySent) {
        return (
          <span className="text-[10px]">
            {channelIcon[row.notifyChannel]} {channelLabel[row.notifyChannel]}
          </span>
        )
      }
      return "—"
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
                          col.id === "B"
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
                  {crmData.map((row, index) => {
                    const isNew =
                      index >= crmData.length - lastAddedCount && isFilling
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
                        <td className="px-2 py-2 font-medium">{row.orderNumber}</td>
                        <td className="hidden px-2 py-2 sm:table-cell">
                          {row.client || "—"}
                        </td>
                        <td className="px-2 py-2">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${crmStatusColor[row.deliveryStatus] || ""}`}
                          >
                            {row.deliveryStatus}
                          </span>
                        </td>
                        <td className="px-2 py-2">
                          {row.notifySent ? (
                            <span className="text-[10px]">
                              {channelIcon[row.notifyChannel]} {channelLabel[row.notifyChannel]}
                            </span>
                          ) : (
                            "—"
                          )}
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
                const value = getColumnValue(selectedRow, col.id)
                const isStatusCol = col.id === "D"
                const isNotifyCol = col.id === "F"
                return (
                  <div key={col.id} className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-muted-foreground">
                      {col.id} — {col.label}
                    </span>
                    {isStatusCol ? (
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${crmStatusColor[selectedRow.deliveryStatus] || ""}`}
                      >
                        {selectedRow.deliveryStatus}
                      </span>
                    ) : isNotifyCol ? (
                      <span className="whitespace-pre-wrap text-sm">
                        {selectedRow.notifySent
                          ? `${channelIcon[selectedRow.notifyChannel]} ${channelLabel[selectedRow.notifyChannel]} — отправлено`
                          : "—"}
                      </span>
                    ) : (
                      <span className="whitespace-pre-wrap text-sm">
                        {value || "—"}
                      </span>
                    )}
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

export function toCrmOrderRow(
  item: CrmOrder,
  index: number
): CrmOrderRow {
  return {
    id: index + 1,
    status: "ожидает",
    orderNumber: item.orderNumber,
    client: item.client,
    trackNumber: item.trackNumber,
    deliveryStatus: "ожидает",
    eta: item.eta,
    notifyChannel: item.notifyChannel,
    notifySent: false,
  }
}