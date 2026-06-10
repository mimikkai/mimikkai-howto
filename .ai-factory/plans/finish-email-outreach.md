# Implementation Plan: Завершение миграции email-outreach + Fix #3 (contentEnter)

Branch: none
Created: 2026-06-11

## Settings
- Testing: no
- Logging: verbose
- Docs: no

## Research Context
Source: `.ai-factory/RESEARCH.md` (Active Summary)

Goal: каждый сценарий живёт в `lib/cases/<slug>/` самодостаточно; добавление нового сценария = новая папка + 1 запись в registry, без правок в общих компонентах
Constraints:
- Next.js App Router, client component в `app/page.tsx`
- `prefers-reduced-motion` обязателен для всех анимаций
- Scheduler (`createScheduler`) — shared, не дублировать
Decisions:
- Каждый сценарий владеет ВСЕМИ 4 шагами (полная изоляция)
- `BrowserPhase` нормализуется в общий формат; сценарий мапит свои стадии → общие
- CSS-keyframe анимации + `prefers-reduced-motion` override — стандартный паттерн

## Проблема
email-outreach не отображается на лендинге, потому что:
1. `app/page.tsx` не импортирует `@/lib/cases/email-outreach` → `registerScenario` не вызывается
2. `lib/cases/email-outreach/` содержит только `data.ts` + пустую `steps/` — нет `config.ts`, `index.ts`, компонентов шагов

## Commit Plan
- **Commit 1** (после задач 1-4): `refactor: migrate email-outreach to modular scenario structure`
- **Commit 2** (после задач 5-6): `feat: add contentEnter animation for browser content transitions`

## Tasks

### Phase 1: Миграция email-outreach (Tasks 15-17 из refactor-modular-scenarios.md)

- [x] Task 1: Создать `lib/cases/email-outreach/config.ts` — перенести блок `email-outreach` из `CASE_CONFIGS` (строки 868-934 в `lib/case-config.tsx`). Экспортировать `emailOutreachConfig` типа `CaseConfig`. Структура зеркалит `threads-comments/config.ts`.
  - Files: `lib/cases/email-outreach/config.ts`
  - **LOGGING:** отсутствует (статический конфиг)

- [x] Task 2: Перенести StepChat и StepMimLua в `lib/cases/email-outreach/steps/`. Копия price-search/threads-comments версий с заменой `import { caseConfig }` на локальный `import { emailOutreachConfig } from "../config"`.
  - Files: `lib/cases/email-outreach/steps/StepChat.tsx`, `lib/cases/email-outreach/steps/StepMimLua.tsx`
  - **LOGGING:** `console.debug('[email-outreach:chat] render')`, `console.debug('[email-outreach:mimlua] render')`

- [x] Task 3: Перенести StepDataTable в `lib/cases/email-outreach/steps/StepDataTable.tsx`. Выделить из `components/step-data-table.tsx` ветку `isEmail=true`. Локальный `EmailDataRow extends BaseRow` с полями: sphere, senderName, caseUsed, company, site, email, phone, letter1, sendStatus, letter2, letter3, letter4. Экспортировать `toEmailRow` маппер из `EmailContact → EmailDataRow`. Локальный `emailStatusColor`. Видимые колонки: A(Сфера), B(От кого), D(Компания), E(Сайт), F(Почта), I(Статус). Dialog со всеми 12 колонками: E — ссылка, H/J/K/L — ScrollArea для писем, I — статус badge.
  - Files: `lib/cases/email-outreach/steps/StepDataTable.tsx`
  - **LOGGING:** `console.debug('[email-outreach:datatable] render', { rowCount, selectedRow })`, `console.debug('[email-outreach:datatable] fillData', { count })`

- [x] Task 4: Перенести StepProcessing в `lib/cases/email-outreach/steps/StepProcessing.tsx`. Выделить из `components/step-processing.tsx` подмножество email (строки 297-1260, ~963 строки). 10 локальных `LocalPhase` значений (email_yandex_home ... email_sent_confirmed) + `PHASE_TO_NORMALIZED` маппинг. Использовать `createScheduler()` вместо raw `setTimeout`. Встроить `EmailStatusBadge` как вложенный компонент. Processing flow: Яндекс → результаты → сайт компании → контакты → найден email → compose → send → confirmed. Chat-сообщения: поиск/изучение/найден/генерация/отправлено. Tab strip: Яндекс + сайт компании + почтовый клиент. Таблица: 6 видимых колонок + Dialog.
  - Files: `lib/cases/email-outreach/steps/StepProcessing.tsx`
  - **LOGGING:** `console.debug('[email-outreach:processing] phase', { phase, rowIndex })` на каждом фазовом переходе; `console.info('[email-outreach:processing] row done', { rowIndex, company, email })` по завершении строки; `console.debug('[email-outreach:processing] map normalized', { local, normalized })` на маппинге фаз; `console.debug('[email-outreach:processing] scheduler', { action, runId })` на schedule/cancel

- [x] Task 5: Создать `lib/cases/email-outreach/index.ts` — экспорт `ScenarioDefinition<EmailContact, EmailDataRow>` + `registerScenario("email-outreach", ...)`. Структура зеркалит `threads-comments/index.ts`. Добавить `import "@/lib/cases/email-outreach"` в `app/page.tsx` (строка 8, после threads-comments). После этого email-outreach появится на лендинге.
  - Files: `lib/cases/email-outreach/index.ts`, `app/page.tsx`
  - **LOGGING:** `console.info('[cases:registry] registered', { slug: 'email-outreach', hasSteps: 4 })` через registry при module init

### Phase 2: Fix #3 — contentEnter анимация

- [x] Task 6: Добавить `@keyframes contentEnter` + `.content-animate-in` класс в `app/globals.css`. Анимация: fade-in + slide-up при смене URL в эмуляторе браузера. Тайминг: 0.28s ease-out. Применить класс к content container `<div className="h-[300px] overflow-y-auto bg-background p-2.5">` в `StepProcessing.tsx` для price-search и threads-comments. Триггер: `key={currentUrl}` на контейнере — React монтирует новый элемент при смене URL, keyframe срабатывает автоматически. Добавить `.content-animate-in` в `@media (prefers-reduced-motion: reduce)` override.
  - Files: `app/globals.css`, `lib/cases/price-search/steps/StepProcessing.tsx`, `lib/cases/threads-comments/steps/StepProcessing.tsx`
  - **LOGGING:** отсутствует (CSS анимация, логировать нечего)

## Ключевые моменты реализации

### Scheduler (Task 4)
Использовать shared `createScheduler()` из `lib/cases/scheduler.ts`:
- `scheduler.schedule(cb, ms)` вместо `setTimeout`
- `scheduler.tweenProgress(setter, from, to, duration)` для прогресс-бара
- `scheduler.cancelAll()` при pause/unmount
- `scheduler.nextRunId()` / `scheduler.isStale(runId)` для защиты от stale runs

### BrowserPhase нормализация (Task 4)
```
email_yandex_home      → idle
email_yandex_typing     → typing
email_yandex_results    → results
email_company_click     → loading
email_company_site      → detail
email_contacts_page     → loading
email_found             → results
email_compose           → form
email_send_click        → loading
email_sent_confirmed    → done
```

### ContentEnter анимация (Task 6)
```css
@keyframes contentEnter {
  0%   { opacity: 0; transform: translateY(6px); }
  100% { opacity: 1; transform: translateY(0); }
}
.content-animate-in {
  animation: contentEnter 0.28s ease-out both;
}
```
Применение: `key={currentUrl}` на content container — при смене URL React размонтирует старый и монтирует новый элемент, keyframe играет автоматически.