"use client"

import { Suspense, useCallback, useEffect, Fragment } from "react"
import { useSearchParams, useRouter, useParams } from "next/navigation"
import { ScenarioStep } from "@/components/scenario-step"
import { listScenarios } from "@/lib/cases/registry"
import "@/lib/cases/price-search"
import "@/lib/cases/threads-comments"
import "@/lib/cases/email-outreach"
import "@/lib/cases/ticket-reply"
import "@/lib/cases/crm-order-tracking"
import "@/lib/cases/marketplace-card-fill"
import { ThemeToggle } from "@/components/theme-toggle"
import { SiteHeader } from "@/components/site-header"
import { CreateAgentButton } from "@/components/create-agent-button"

type Step = 1 | 2 | 3 | 4

const STEP_TITLES: Record<Step, string> = {
  1: "Создание агента",
  2: "ИИ-агент",
  3: "Таблица данных",
  4: "Обработка агентом",
}

const STEP_ICONS: Record<Step, string> = {
  1: "💬",
  2: "🤖",
  3: "📊",
  4: "🤖",
}

const STEP_SLUGS: Record<Step, string> = {
  1: "chat",
  2: "ai-agent",
  3: "data",
  4: "processing",
}

const SLUG_TO_STEP: Record<string, Step> = {
  chat: 1,
  "ai-agent": 2,
  data: 3,
  processing: 4,
}

export function ScenarioPageContent() {
  return (
    <Suspense>
      <ScenarioPageInner />
    </Suspense>
  )
}

function ScenarioPageInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string

  const scenarios = listScenarios()

  const currentScenario = scenarios.find((s) => s.meta.slug === slug) ?? null
  const stepSlug = searchParams.get("step")
  const step: Step | null = (SLUG_TO_STEP[stepSlug ?? ""] as Step) || null

  const goToStep = useCallback(
    (s: Step) => {
      router.push(`/${slug}?step=${STEP_SLUGS[s]}`)
    },
    [router, slug]
  )

  useEffect(() => {
    if (!stepSlug) {
      router.replace(`/${slug}?step=chat`)
    }
  }, [slug, stepSlug, router])

  if (!currentScenario) {
    return (
      <div className="flex min-h-svh flex-col">
        <SiteHeader>
          <ThemeToggle />
        </SiteHeader>
        <main className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col items-center justify-center px-6 py-6">
          <p className="text-muted-foreground">Сценарий не найден</p>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader label="Интерактивное демо">
        <CreateAgentButton className="hidden sm:inline-flex" />
        <ThemeToggle />
      </SiteHeader>

      <nav className="border-b bg-muted/30">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex items-center gap-1 py-2">
            <button
              onClick={() => router.push("/")}
              className="mr-2 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/60"
            >
              ← {currentScenario.meta.title}
            </button>
            {([1, 2, 3, 4] as Step[]).map((s) => (
              <Fragment key={s}>
                <div
                  className={`mx-1 h-px w-6 ${s <= (step ?? 1) ? "bg-primary" : "bg-border"}`}
                />
                <button
                  onClick={() =>
                    step !== null && s <= step ? goToStep(s) : undefined
                  }
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    step !== null && s === step
                      ? "bg-primary text-primary-foreground"
                      : step !== null && s < step
                        ? "cursor-pointer bg-primary/10 text-primary hover:bg-primary/20"
                        : "text-muted-foreground"
                  }`}
                  disabled={step === null || s > step}
                >
                  <span>{STEP_ICONS[s]}</span>
                  <span className="hidden sm:inline">{STEP_TITLES[s]}</span>
                  <span className="sm:hidden">{s}</span>
                </button>
              </Fragment>
            ))}
          </div>
        </div>
      </nav>

      <main className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col px-6 py-6">
        {step === 1 && (
          <ScenarioStep
            slug={slug}
            step={1}
            onComplete={() => goToStep(2)}
          />
        )}
        {step === 2 && (
          <ScenarioStep
            slug={slug}
            step={2}
            onBack={() => goToStep(1)}
            onNext={() => goToStep(3)}
          />
        )}
        {step === 3 && (
          <ScenarioStep
            slug={slug}
            step={3}
            onBack={() => goToStep(2)}
            onNext={() => goToStep(4)}
          />
        )}
        {step === 4 && (
          <ScenarioStep
            slug={slug}
            step={4}
            onBack={() => goToStep(3)}
          />
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