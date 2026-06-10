"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

interface StepMimLuaProps {
  onNext: () => void
  onBack: () => void
}

const COLUMNS = [
  {
    id: "A",
    label: "Название товара",
    field_type: "STRING",
    is_required: true,
    readonly: false,
    direction: "input" as const,
    description: "Пользователь указывает название товара, цену которого нужно найти",
    example: "iPhone 15 Pro Max 256GB",
  },
  {
    id: "B",
    label: "Цена",
    field_type: "STRING",
    is_required: false,
    readonly: true,
    direction: "output" as const,
    description: "ИИ-агент записывает сюда найденную актуальную цену",
    example: "109 990 ₽",
  },
  {
    id: "C",
    label: "Статус",
    field_type: "STRING",
    is_required: false,
    readonly: true,
    direction: "output" as const,
    description: "ИИ-агент обновляет статус обработки: найдено / не найдено",
    example: "найдено",
  },
]

const PROMPT_STEPS = [
  { step: 1, text: "Открой браузер через MCP Playwright", icon: "🌐" },
  { step: 2, text: "Найди товар на маркетплейсах", icon: "🔍" },
  { step: 3, text: "Определи актуальную цену", icon: "💰" },
  { step: 4, text: "Запиши результат в колонку B", icon: "📝" },
  { step: 5, text: "Обнови статус в колонку C", icon: "✅" },
]

export function StepMimLua({ onNext, onBack }: StepMimLuaProps) {
  return (
    <div className="flex h-full flex-col gap-5">
      <div className="flex items-center gap-3">
        <Badge variant="outline">Шаг 2 из 4</Badge>
        <h2 className="text-lg font-semibold">Структура ИИ-агента</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Конфигурация <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono">mim.lua</code> определяет данные, промпт и поведение агента. Ниже — визуальное описание созданного агента.
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="inline-flex size-8 items-center justify-center rounded-lg bg-primary/10 text-lg">🤖</span>
            <div>
              <div className="text-base">Поиск цен на товары</div>
              <div className="text-xs text-muted-foreground font-normal">ИИ-агент для поиска актуальных цен на товары через браузер</div>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="inline-flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-lg">📊</span>
            <div>
              <div className="text-base">Схема данных</div>
              <div className="text-xs text-muted-foreground font-normal">Таблица с входными и выходными полями — как таблица в Excel</div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3">
            {COLUMNS.map((col, i) => (
              <React.Fragment key={col.id}>
                {i > 0 && <Separator />}
                <div className="flex items-start gap-4">
                  <div className="flex shrink-0 flex-col items-center gap-1 pt-0.5">
                    <div className={`flex size-10 items-center justify-center rounded-lg font-mono text-lg font-bold ${
                      col.direction === "input"
                        ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                        : "bg-purple-500/15 text-purple-700 dark:text-purple-400"
                    }`}>
                      {col.id}
                    </div>
                    <Badge variant="outline" className="text-[9px] px-1">
                      {col.direction === "input" ? "вход" : "выход"}
                    </Badge>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{col.label}</span>
                      <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">{col.field_type}</span>
                      {col.is_required && (
                        <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-400">обязательное</span>
                      )}
                      {col.readonly && (
                        <span className="rounded bg-purple-500/15 px-1.5 py-0.5 text-[10px] font-medium text-purple-700 dark:text-purple-400">только чтение</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-1.5">{col.description}</p>
                    <div className="rounded-md border bg-muted/30 px-2.5 py-1.5">
                      <span className="text-[10px] text-muted-foreground">Пример: </span>
                      <span className="text-xs font-medium">{col.example}</span>
                    </div>
                  </div>
                </div>
              </React.Fragment>
            ))}
          </div>

          <div className="mt-4 rounded-lg border border-dashed bg-muted/20 p-3">
            <div className="mb-2 text-xs font-medium text-muted-foreground">Как выглядит таблица:</div>
            <div className="overflow-hidden rounded-md border">
              <table className="w-full text-xs">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-3 py-1.5 text-left font-medium text-amber-700 dark:text-amber-400">A — Название</th>
                    <th className="px-3 py-1.5 text-left font-medium text-purple-700 dark:text-purple-400">B — Цена</th>
                    <th className="px-3 py-1.5 text-left font-medium text-purple-700 dark:text-purple-400">C — Статус</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t">
                    <td className="px-3 py-1.5">iPhone 15 Pro Max</td>
                    <td className="px-3 py-1.5 text-muted-foreground">—</td>
                    <td className="px-3 py-1.5 text-muted-foreground">—</td>
                  </tr>
                  <tr className="border-t bg-emerald-500/5">
                    <td className="px-3 py-1.5">Samsung Galaxy S24</td>
                    <td className="px-3 py-1.5 font-medium text-emerald-700 dark:text-emerald-400">89 990 ₽</td>
                    <td className="px-3 py-1.5"><span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-400">найдено</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="inline-flex size-8 items-center justify-center rounded-lg bg-rose-500/10 text-lg">🧠</span>
            <div>
              <div className="text-base">Промпт — инструкции для AI</div>
              <div className="text-xs text-muted-foreground font-normal">Определяет, как агент обрабатывает каждую строку таблицы</div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-3 rounded-lg border bg-rose-500/5 px-4 py-3">
            <p className="text-xs text-muted-foreground italic">
              &laquo;Ты — агент для поиска цен на товары в интернете. Для каждого товара выполни шаги ниже и верни результат в формате JSON.&raquo;
            </p>
          </div>

          <div className="flex flex-col gap-2">
            {PROMPT_STEPS.map((s) => (
              <div key={s.step} className="flex items-center gap-3 rounded-lg border bg-background px-3 py-2">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {s.step}
                </div>
                <span className="text-lg shrink-0">{s.icon}</span>
                <span className="text-sm">{s.text}</span>
              </div>
            ))}
          </div>

          <div className="mt-3 rounded-lg border bg-muted/30 px-3 py-2">
            <div className="mb-1 text-[10px] font-medium text-muted-foreground">Формат ответа агента:</div>
            <div className="font-mono text-xs text-muted-foreground">
              {"{ "}
              <span className="text-rose-600 dark:text-rose-400">"price"</span>
              {": "}
              <span className="text-emerald-600 dark:text-emerald-400">"109 990 ₽"</span>
              {", "}
              <span className="text-rose-600 dark:text-rose-400">"status"</span>
              {": "}
              <span className="text-emerald-600 dark:text-emerald-400">"найдено"</span>
              {" }"}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="py-3">
          <div className="flex items-start gap-3">
            <span className="text-lg shrink-0">💡</span>
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Как это работает:</span> Платформа MimikkAi читает <code className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">mim.lua</code>, создаёт таблицу по схеме <code className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">columns</code> и запускает ИИ-агента с промптом для каждой строки. Агент заполняет колонки с <code className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">readonly</code>, пользователь — колонки с <code className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">is_required</code>.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          ← Назад
        </Button>
        <Button size="lg" className="gap-2" onClick={onNext}>
          📊 Посмотри данные
        </Button>
      </div>
    </div>
  )
}