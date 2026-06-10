"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { priceSearchConfig } from "../config"

interface StepMimLuaProps {
  caseSlug: string
  onNext: () => void
  onBack: () => void
}

export function StepMimLua({ caseSlug, onNext, onBack }: StepMimLuaProps) {
  const caseConfig = priceSearchConfig
  const {
    inputColumns,
    outputColumns,
    promptSteps,
    agentTitle,
    agentDesc,
    promptIntro,
  } = caseConfig.mimLua
  return (
    <div className="flex h-full flex-col gap-6">
      <div className="flex items-center gap-3">
        <Badge variant="outline">Шаг 2 из 4</Badge>
        <h2 className="text-lg font-semibold">ИИ-агент</h2>
      </div>

      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <span className="inline-flex size-10 items-center justify-center rounded-xl bg-primary/10 text-xl">
            🤖
          </span>
          <div>
            <div className="text-base font-semibold">{agentTitle}</div>
            <div className="text-xs text-muted-foreground">{agentDesc}</div>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className="inline-flex size-6 items-center justify-center rounded-md bg-rose-500/10 text-xs">
                🧠
              </span>
              <span className="text-sm font-medium">Сценарий</span>
            </div>
            <div className="space-y-3 rounded-xl border bg-muted/30 p-4">
              <p className="text-xs leading-relaxed text-muted-foreground italic">
                {promptIntro}
              </p>
              <div className="space-y-1.5">
                {promptSteps.map((s, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                      {i + 1}
                    </div>
                    <span className="text-sm">
                      {s.icon} {s.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className="inline-flex size-6 items-center justify-center rounded-md bg-emerald-500/10 text-xs">
                📊
              </span>
              <span className="text-sm font-medium">Структура данных</span>
            </div>
            <div className="rounded-xl border bg-muted/30 p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-stretch sm:gap-4">
                <div className="flex-1 space-y-2">
                  <div className="mb-2 flex items-center gap-1.5">
                    <span className="inline-flex size-2 rounded-full bg-amber-500" />
                    <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
                      Вход
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      — заполняет пользователь
                    </span>
                  </div>
                  {inputColumns.map((col) => (
                    <div
                      key={col.id}
                      className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2"
                    >
                      <div className="mb-1 flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-amber-700 dark:text-amber-400">
                          {col.id}
                        </span>
                        <span className="text-xs font-medium">{col.label}</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {col.example}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-center sm:justify-center">
                  <div className="flex flex-row items-center gap-1 text-muted-foreground sm:flex-col">
                    <div className="h-px w-4 bg-border sm:h-4 sm:w-px" />
                    <span className="text-xs">→</span>
                    <div className="h-px w-4 bg-border sm:h-4 sm:w-px" />
                  </div>
                </div>

                <div className="flex-1 space-y-2">
                  <div className="mb-2 flex items-center gap-1.5">
                    <span className="inline-flex size-2 rounded-full bg-purple-500" />
                    <span className="text-xs font-medium text-purple-700 dark:text-purple-400">
                      Выход
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      — заполняет агент
                    </span>
                  </div>
                  {outputColumns.map((col) => (
                    <div
                      key={col.id}
                      className="rounded-lg border border-purple-500/20 bg-purple-500/10 px-3 py-2"
                    >
                      <div className="mb-1 flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-purple-700 dark:text-purple-400">
                          {col.id}
                        </span>
                        <span className="text-xs font-medium">{col.label}</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {col.example}
                      </div>
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
