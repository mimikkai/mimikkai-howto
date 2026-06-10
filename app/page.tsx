"use client"

import * as React from "react"
import { StepChat } from "@/components/step-chat"
import { StepMimLua } from "@/components/step-mim-lua"
import { StepDataTable } from "@/components/step-data-table"
import { StepProcessing } from "@/components/step-processing"
import { Button } from "@/components/ui/button"

type Step = 1 | 2 | 3 | 4

const STEP_TITLES: Record<Step, string> = {
  1: "Создание агента",
  2: "Структура mim.lua",
  3: "Таблица данных",
  4: "Обработка агентом",
}

const STEP_ICONS: Record<Step, string> = {
  1: "💬",
  2: "📄",
  3: "📊",
  4: "🤖",
}

export default function Page() {
  const [step, setStep] = React.useState<Step>(1)

  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold">MimikkAi</span>
            <span className="text-xs text-muted-foreground">Интерактивный гайд</span>
          </div>
          <a
            href="https://mimikkai.ru"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground underline-offset-2 hover:underline"
          >
            mimikkai.ru
          </a>
        </div>
      </header>

      <nav className="border-b bg-muted/30">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex items-center gap-1 py-2">
            {([1, 2, 3, 4] as Step[]).map((s) => (
              <React.Fragment key={s}>
                {s > 1 && (
                  <div className={`mx-1 h-px w-6 ${s <= step ? "bg-primary" : "bg-border"}`} />
                )}
                <button
                  onClick={() => s < step ? setStep(s) : undefined}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    s === step
                      ? "bg-primary text-primary-foreground"
                      : s < step
                        ? "bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer"
                        : "text-muted-foreground"
                  }`}
                  disabled={s > step}
                >
                  <span>{STEP_ICONS[s]}</span>
                  <span className="hidden sm:inline">{STEP_TITLES[s]}</span>
                  <span className="sm:hidden">{s}</span>
                </button>
              </React.Fragment>
            ))}
          </div>
        </div>
      </nav>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-6">
        {step === 1 && <StepChat onComplete={() => setStep(2)} />}
        {step === 2 && (
          <StepMimLua
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        )}
        {step === 3 && (
          <StepDataTable
            onNext={() => setStep(4)}
            onBack={() => setStep(2)}
          />
        )}
        {step === 4 && (
          <StepProcessing
            onBack={() => setStep(3)}
            onComplete={() => {
              alert("🎉 Гайд завершён! Теперь вы знаете, как работает платформа MimikkAi.")
            }}
          />
        )}
      </main>
    </div>
  )
}