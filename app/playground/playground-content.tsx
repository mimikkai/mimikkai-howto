"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { CreateAgentButton } from "@/components/create-agent-button"
import type { MimModule } from "@/lib/playground/types"
import { StepUpload } from "@/components/playground/step-upload"
import { StepChat } from "@/components/playground/step-chat"
import { StepMimLua } from "@/components/playground/step-mim-lua"
import { StepDataTable } from "@/components/playground/step-data-table"
import { StepProcessing } from "@/components/playground/step-processing"

type Step = 0 | 1 | 2 | 3 | 4

const STEP_TITLES: Record<Exclude<Step, 0>, string> = {
  1: "Чат",
  2: "ИИ-агент",
  3: "Таблица",
  4: "Обработка",
}

const STEP_ICONS: Record<Exclude<Step, 0>, string> = {
  1: "💬",
  2: "🤖",
  3: "📊",
  4: "⚙️",
}

export function PlaygroundContent() {
  const router = useRouter()
  const [step, setStep] = React.useState<Step>(0)
  const [mimModule, setMimModule] = React.useState<MimModule | null>(null)
  const handleParsed = React.useCallback((mod: MimModule, name: string) => {
    console.info("[playground:content] mim module loaded", {
      name: mod.name,
      columns: mod.columns.length,
      entries: mod.entry.length,
      filename: name,
    })
    setMimModule(mod)
    setStep(1)
  }, [])

  const handleReset = React.useCallback(() => {
    console.debug("[playground:content] reset")
    setMimModule(null)
    setStep(0)
  }, [])

  React.useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.debug("[playground:content] render", { step, hasModule: !!mimModule })
    }
  }, [step, mimModule])

  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-3 py-2 sm:px-6 sm:py-3">
          <div className="flex items-center gap-2">
            <span
              className="flex cursor-pointer items-center gap-2 text-lg font-bold"
              onClick={() => router.push("/")}
            >
              <svg
                width="24"
                height="22"
                viewBox="0 0 32 30"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="shrink-0"
              >
                <path
                  d="M31.8496 0.150391V24.3906L26.292 29.8496H23.6797V16.7969L23.4219 17.0605L16.1504 24.4971V21.7861L26.2031 11.7402V26.6143L26.4609 26.3477L29.2842 23.4297L29.3262 23.3867V3.9668L29.0703 4.22461L16.1504 17.2217V13.5098L29.2383 0.150391H31.8496ZM2.76172 0.150391L15.8496 13.5098V17.2217L2.92969 4.22461L2.67383 3.9668V23.3867L2.71582 23.4297L5.53906 26.3477L5.79688 26.6143V11.7402L15.8496 21.7861V24.4971L8.57812 17.0605L8.32031 16.7969V29.8496H5.70801L0.150391 24.3906V0.150391H2.76172Z"
                  fill="currentColor"
                  stroke="currentColor"
                  strokeWidth="0.3"
                />
              </svg>
              MimikkAi
            </span>
            <span className="hidden text-xs text-muted-foreground sm:inline">
              Playground
            </span>
          </div>
          <div className="flex items-center gap-2">
            <CreateAgentButton className="hidden sm:inline-flex" />
            {mimModule && (
              <Button variant="outline" size="sm" onClick={handleReset}>
                ↺ Новый файл
              </Button>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      {step > 0 && mimModule && (
        <nav className="border-b bg-muted/30">
          <div className="mx-auto max-w-6xl px-6">
            <div className="flex items-center gap-1 py-2">
              <button
                onClick={() => setStep(0)}
                className="mr-2 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/60"
              >
                ← Загрузка
              </button>
              {([1, 2, 3, 4] as const).map((s) => (
                <React.Fragment key={s}>
                  <div
                    className={`mx-1 h-px w-6 ${s <= step ? "bg-primary" : "bg-border"}`}
                  />
                  <button
                    onClick={() => s <= step && setStep(s)}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      s === step
                        ? "bg-primary text-primary-foreground"
                        : s < step
                          ? "cursor-pointer bg-primary/10 text-primary hover:bg-primary/20"
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
      )}

      <main className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col px-6 py-6">
        {step === 0 && <StepUpload onParsed={handleParsed} />}
        {step === 1 && mimModule && (
          <StepChat
            mim={mimModule}
            onNext={() => setStep(2)}
            onBack={() => setStep(0)}
          />
        )}
        {step === 2 && mimModule && (
          <StepMimLua
            mim={mimModule}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        )}
        {step === 3 && mimModule && (
          <StepDataTable
            mim={mimModule}
            onNext={() => setStep(4)}
            onBack={() => setStep(2)}
          />
        )}
        {step === 4 && mimModule && (
          <StepProcessing mim={mimModule} onBack={() => setStep(3)} />
        )}
      </main>

      <footer className="border-t bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-center px-3 py-2 sm:px-6 sm:py-3">
          <a
            href="https://mimikkai.ru"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground underline-offset-2 hover:underline"
          >
            mimikkai.ru
          </a>
        </div>
      </footer>
    </div>
  )
}