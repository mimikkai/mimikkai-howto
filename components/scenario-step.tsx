"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getScenario } from "@/lib/cases/registry"
import type { StepComponent } from "@/lib/cases/types"

export type StepNumber = 1 | 2 | 3 | 4

interface ScenarioStepBaseProps {
  slug: string
  step: StepNumber
}

interface StepChatWrapperProps extends ScenarioStepBaseProps {
  step: 1
  onComplete: (prompt: string) => void
}

interface StepNavWrapperProps extends ScenarioStepBaseProps {
  step: 2 | 3 | 4
  onBack: () => void
  onNext?: () => void
}

type ScenarioStepProps = StepChatWrapperProps | StepNavWrapperProps

const STEP_TITLES: Record<StepNumber, string> = {
  1: "Создание агента",
  2: "ИИ-агент",
  3: "Таблица данных",
  4: "Обработка агентом",
}

function MissingScenario({ slug, step }: { slug: string; step: StepNumber }) {
  if (process.env.NODE_ENV !== "production") {
    console.warn("[scenario-step] missing scenario", { slug, step })
  }
  return (
    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
      Сценарий не найден
    </div>
  )
}

export function ScenarioStep(props: ScenarioStepProps) {
  const { slug, step } = props
  const scenario = getScenario(slug)

  React.useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.debug("[scenario-step] render", { slug, step })
    }
  }, [slug, step])

  if (!scenario) {
    return <MissingScenario slug={slug} step={step} />
  }

  const StepComponent = scenario.steps[
    step === 1
      ? "StepChat"
      : step === 2
        ? "StepMimLua"
        : step === 3
          ? "StepDataTable"
          : "StepProcessing"
  ] as unknown as StepComponent<Record<string, unknown>>

  return (
    <>
      {step === 1 ? (
        <StepComponent
          caseSlug={slug}
          onComplete={(props as StepChatWrapperProps).onComplete}
        />
      ) : step === 4 ? (
        <StepComponent
          caseSlug={slug}
          onBack={(props as StepNavWrapperProps).onBack}
        />
      ) : (
        <StepComponent
          caseSlug={slug}
          onBack={(props as StepNavWrapperProps).onBack}
          onNext={(props as StepNavWrapperProps).onNext ?? (() => {})}
        />
      )}
    </>
  )
}

interface StepNavButtonsProps {
  onBack: () => void
  onNext?: () => void
  nextLabel: string
}

export function StepNavButtons({ onBack, onNext, nextLabel }: StepNavButtonsProps) {
  return (
    <div className="flex justify-between">
      <Button variant="outline" onClick={onBack}>
        ← Назад
      </Button>
      {onNext ? (
        <Button size="lg" className="gap-2" onClick={onNext}>
          {nextLabel}
        </Button>
      ) : null}
    </div>
  )
}
