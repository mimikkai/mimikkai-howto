"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface StepMimLuaProps {
  onNext: () => void
  onBack: () => void
}

const INPUT_COLUMNS = [
  { id: "A", label: "Название товара", example: "iPhone 15 Pro Max 256GB" },
]

const OUTPUT_COLUMNS = [
  { id: "B", label: "Цена", example: "109 990 ₽" },
  { id: "C", label: "Статус", example: "найдено" },
]

const PROMPT_STEPS = [
  { text: "Открой браузер через MCP Playwright", icon: "🌐" },
  { text: "Найди товар на маркетплейсах", icon: "🔍" },
  { text: "Определи актуальную цену", icon: "💰" },
  { text: "Запиши результат в колонку B", icon: "📝" },
  { text: "Обнови статус в колонку C", icon: "✅" },
]

export function StepMimLua({ onNext, onBack }: StepMimLuaProps) {
  return (
    <div className="flex h-full flex-col gap-6">
      <div className="flex items-center gap-3">
        <Badge variant="outline">Шаг 2 из 4</Badge>
        <h2 className="text-lg font-semibold">ИИ-агент</h2>
      </div>

      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <span className="inline-flex size-10 items-center justify-center rounded-xl bg-primary/10 text-xl">🤖</span>
          <div>
            <div className="text-base font-semibold">Поиск цен на товары</div>
            <div className="text-xs text-muted-foreground">ИИ-агент для поиска актуальных цен через браузер</div>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex size-6 items-center justify-center rounded-md bg-rose-500/10 text-xs">🧠</span>
              <span className="text-sm font-medium">Сценарий</span>
            </div>
            <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
              <p className="text-xs text-muted-foreground italic leading-relaxed">
                &laquo;Ты — агент для поиска цен на товары в интернете. Для каждого товара выполни шаги ниже.&raquo;
              </p>
              <div className="space-y-1.5">
                {PROMPT_STEPS.map((s, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                      {i + 1}
                    </div>
                    <span className="text-sm">{s.icon} {s.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex size-6 items-center justify-center rounded-md bg-emerald-500/10 text-xs">📊</span>
              <span className="text-sm font-medium">Структура данных</span>
            </div>
            <div className="rounded-xl border bg-muted/30 p-4">
              <div className="flex items-stretch gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="inline-flex size-2 rounded-full bg-amber-500" />
                    <span className="text-xs font-medium text-amber-700 dark:text-amber-400">Вход</span>
                    <span className="text-[10px] text-muted-foreground">— заполняет пользователь</span>
                  </div>
                  {INPUT_COLUMNS.map((col) => (
                    <div key={col.id} className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="font-mono text-xs font-bold text-amber-700 dark:text-amber-400">{col.id}</span>
                        <span className="text-xs font-medium">{col.label}</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground">{col.example}</div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center">
                  <div className="flex flex-col items-center gap-1 text-muted-foreground">
                    <div className="h-4 w-px bg-border" />
                    <span className="text-xs">→</span>
                    <div className="h-4 w-px bg-border" />
                  </div>
                </div>

                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="inline-flex size-2 rounded-full bg-purple-500" />
                    <span className="text-xs font-medium text-purple-700 dark:text-purple-400">Выход</span>
                    <span className="text-[10px] text-muted-foreground">— заполняет агент</span>
                  </div>
                  {OUTPUT_COLUMNS.map((col) => (
                    <div key={col.id} className="rounded-lg bg-purple-500/10 border border-purple-500/20 px-3 py-2">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="font-mono text-xs font-bold text-purple-700 dark:text-purple-400">{col.id}</span>
                        <span className="text-xs font-medium">{col.label}</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground">{col.example}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

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
