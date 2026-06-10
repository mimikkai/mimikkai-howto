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
import { emailOutreachConfig } from "../config"
import { EMAIL_CONTACTS, type EmailContact } from "../data"
import type { BaseRow } from "../../types"

interface StepDataTableProps {
  caseSlug: string
  onNext: () => void
  onBack: () => void
}

export interface EmailDataRow extends BaseRow {
  sphere: string
  senderName: string
  caseUsed: string
  company: string
  site: string
  email: string
  phone: string
  letter1: string
  sendStatus: "ожидает" | "обработка" | "Письмо отправлено и сохранено" | "ошибка"
  letter2: string
  letter3: string
  letter4: string
}

const BATCH_SIZE = 5
const BATCH_DELAY_MS = 50

const emailStatusColor: Record<string, string> = {
  ожидает: "bg-gray-500/15 text-gray-600 dark:text-gray-400",
  обработка: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  "Письмо отправлено и сохранено":
    "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  ошибка: "bg-red-500/15 text-red-700 dark:text-red-400",
}

const VISIBLE_COLS = ["A", "B", "D", "E", "F", "I"]

const LETTER_COLS = ["H", "J", "K", "L"]

export function StepDataTable({
  caseSlug,
  onNext,
  onBack,
}: StepDataTableProps) {
  const caseConfig = emailOutreachConfig
  const [emailData, setEmailData] = React.useState<EmailDataRow[]>([])
  const [isFilling, setIsFilling] = React.useState(false)
  const [isFilled, setIsFilled] = React.useState(false)
  const [lastAddedCount, setLastAddedCount] = React.useState(0)
  const [selectedRow, setSelectedRow] = React.useState<EmailDataRow | null>(
    null
  )
  const scrollRef = React.useRef<HTMLDivElement>(null)

  if (process.env.NODE_ENV !== "production") {
    console.debug("[email-outreach:datatable] render", {
      rowCount: emailData.length,
      selectedRow: selectedRow?.id,
    })
  }

  const totalRows = EMAIL_CONTACTS.length
  const dataLength = emailData.length
  const fillProgress = Math.round((dataLength / totalRows) * 100)

  const handleFillData = React.useCallback(() => {
    if (isFilling) return
    setIsFilling(true)
    setEmailData([])
    setIsFilled(false)

    let batchIndex = 0

    const interval = setInterval(() => {
      const start = batchIndex * BATCH_SIZE
      const end = Math.min(start + BATCH_SIZE, totalRows)
      batchIndex++

      const newRows: EmailDataRow[] = []
      for (let i = start; i < end; i++) {
        newRows.push({
          id: i + 1,
          status: "ожидает",
          sphere: EMAIL_CONTACTS[i].sphere,
          senderName: EMAIL_CONTACTS[i].senderName,
          caseUsed: EMAIL_CONTACTS[i].caseUsed,
          company: "",
          site: "",
          email: "",
          phone: "",
          letter1: "",
          sendStatus: "ожидает" as const,
          letter2: "",
          letter3: "",
          letter4: "",
        })
      }
      setEmailData((prev) => [...prev, ...newRows])
      setLastAddedCount(end - start)

      if (end >= totalRows) {
        clearInterval(interval)
        setIsFilling(false)
        setIsFilled(true)
      }

      if (process.env.NODE_ENV !== "production") {
        console.debug("[email-outreach:datatable] fillData", { count: end })
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
  }, [emailData, isFilling])

  const columns = caseConfig.dataTable.columns
  const visibleColumns = columns.filter((c) => VISIBLE_COLS.includes(c.id))

  const getColumnValue = (row: EmailDataRow, colId: string): string => {
    switch (colId) {
      case "A":
        return row.sphere
      case "B":
        return row.senderName
      case "C":
        return row.caseUsed
      case "D":
        return row.company
      case "E":
        return row.site
      case "F":
        return row.email
      case "G":
        return row.phone
      case "H":
        return row.letter1
      case "I":
        return row.sendStatus
      case "J":
        return row.letter2
      case "K":
        return row.letter3
      case "L":
        return row.letter4
      default:
        return ""
    }
  }

  const getColumnCell = (row: EmailDataRow, colId: string) => {
    const value = getColumnValue(row, colId)
    if (colId === "E" && value) {
      return (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 dark:text-blue-400"
        >
          сайт
        </a>
      )
    }
    if (colId === "I") {
      return (
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${emailStatusColor[row.sendStatus] || ""}`}
        >
          {row.sendStatus}
        </span>
      )
    }
    if (LETTER_COLS.includes(colId)) {
      return value ? (
        <span className="text-muted-foreground">письмо</span>
      ) : (
        "—"
      )
    }
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
                            : col.id === "D"
                              ? "hidden md:table-cell"
                              : col.id === "F"
                                ? "hidden w-36 lg:table-cell"
                                : ""
                        }`}
                      >
                        {col.id} — {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {emailData.map((row, index) => {
                    const isNew =
                      index >= emailData.length - lastAddedCount && isFilling
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
                        <td className="px-2 py-2 font-medium">{row.sphere}</td>
                        <td className="hidden px-2 py-2 sm:table-cell">
                          {row.senderName || "—"}
                        </td>
                        <td className="hidden px-2 py-2 font-medium md:table-cell">
                          {row.company || "—"}
                        </td>
                        <td className="px-2 py-2">
                          {row.site ? (
                            <a
                              href={row.site}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 dark:text-blue-400"
                            >
                              сайт
                            </a>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="hidden px-2 py-2 text-muted-foreground lg:table-cell">
                          {row.email || "—"}
                        </td>
                        <td className="px-2 py-2">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${emailStatusColor[row.sendStatus] || ""}`}
                          >
                            {row.sendStatus}
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
                const isUrlCol = col.id === "E"
                const isStatusCol = col.id === "I"
                const isLetterCol = LETTER_COLS.includes(col.id)
                return (
                  <div key={col.id} className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-muted-foreground">
                      {col.id} — {col.label}
                    </span>
                    {isUrlCol && value ? (
                      <a
                        href={value}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="break-all text-sm text-blue-600 underline dark:text-blue-400"
                      >
                        {value}
                      </a>
                    ) : isStatusCol ? (
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${emailStatusColor[selectedRow.sendStatus] || ""}`}
                      >
                        {selectedRow.sendStatus}
                      </span>
                    ) : isLetterCol && value ? (
                      <ScrollArea className="max-h-32 rounded border bg-muted/30 p-2">
                        <span className="whitespace-pre-wrap text-sm">
                          {value}
                        </span>
                      </ScrollArea>
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

export function toEmailRow(
  item: EmailContact,
  index: number
): EmailDataRow {
  return {
    id: index + 1,
    status: "ожидает",
    sphere: item.sphere,
    senderName: item.senderName,
    caseUsed: item.caseUsed,
    company: item.company,
    site: item.site,
    email: item.email,
    phone: item.phone,
    letter1: item.letter1,
    sendStatus: "ожидает",
    letter2: item.letter2,
    letter3: item.letter3,
    letter4: item.letter4,
  }
}