# Research

Updated: 2026-06-10 22:15
Status: active

## Active Summary (input for /aif-plan)
Topic: рефакторинг архитектуры — модульные сценарии вместо раздутых step-*.tsx
Goal: каждый сценарий живёт в `lib/cases/<slug>/` самодостаточно; добавление нового сценария = новая папка, без правок в общих компонентах
Constraints:
- Next.js App Router (app/page.tsx уже client component)
- текущий код: 4 step-компонента, `caseSlug` прокидывается как пропс
- `step-processing.tsx` — 2992 строки, главный талrepainting pain
- `step-data-table.tsx` — 548 строк, три ветки рендера через `isEmail/isThreads`
- `lib/case-config.tsx` — 935 строк (типы + PRODUCTS + THREADS_POSTS + EMAIL_CONTACTS + CASE_CONFIGS)
- 5 сценариев: 3 active (price-search, threads-comments, email-outreach), 2 disabled (order-processing, ticket-reply)
Decisions:
- папка сценария владеет ВСЕМИ 4 шагами (StepChat, StepMimLua, StepDataTable, StepProcessing) — полная изоляция
- сценарий сам хранит данные и стейт (не прокидываются сверху)
- BrowserPhase нормализуется в общий формат, сценарий мапит свои стадии → общие + рендерит свои экраны
- CASE_CONFIGS и datasets переезжают в `lib/cases/<slug>/config.ts` и `lib/cases/<slug>/data.ts`
- реестр сценариев — `lib/cases/registry.ts`, через него `app/page.tsx` ищет нужный сценарий по slug
Open questions:
- общий chrome (header с лого/ThemeToggle, footer, навигация по шагам) — оставить в `app/page.tsx`, а `ScenarioStep` оборачивает контент шага (Badge + h2 + back/next кнопки). Уточнить в плане.
- как именно нормализовать BrowserPhase — предложить набор общих стадий в плане, согласовать с пользователем
- типизация `ScenarioDefinition<TData, TRow>` — generics vs широкий тип; решить в плане
Success signals:
- `components/step-*.tsx` удалены или уменьшены до тонкой обёртки
- `lib/case-config.tsx` удалён
- добавление нового сценария = создание папки + 1 запись в registry
- `step-processing.tsx`-аналог каждого сценария < 600 строк
- `app/page.tsx` < 80 строк
Next step: `/aif-plan` — детальный план рефакторинга: registry, ScenarioDefinition, новая структура lib/cases/, миграция существующих 3 сценариев, общий ScenarioStep wrapper

## Sessions

### 2026-06-10 22:15 — модуляризация сценариев
What changed:
- зафиксированы 4 ключевых решения: 4 шага в сценарии, свои данные, нормализация BrowserPhase, конфиг в `lib/cases/<slug>/`
- зафиксирована целевая структура `lib/cases/<slug>/{index,config,data,steps/}`
Key notes:
- главная боль — `step-processing.tsx` (2992 строки) с фазами всех 3 сценариев в одном `BrowserPhase` union
- `lib/case-config.tsx` совмещает типы, datasets, конфиги — нужно разделить
- StepChat и StepMimLua уже работают через `CASE_CONFIGS[slug]`, для сценария они становятся локальными копиями (или фабриками)
- `app/page.tsx` — 300 строк, содержит логику роутинга по step slugs, и лендинг со списком сценариев; роутинг остаётся, лендинг переезжает на `listScenarios()` из registry
Links (paths):
- components/step-chat.tsx:20 — точка входа `StepChat`, читает `CASE_CONFIGS[caseSlug]`
- components/step-mim-lua.tsx:14 — аналогично
- components/step-data-table.tsx:64 — три ветки через `isEmail/isThreads`
- components/step-processing.tsx:1262 — точка выбора `processNext` через `isEmail ? ... : isThreads ? ... : ...`
- lib/case-config.tsx:766 — большой `CASE_CONFIGS` объект
- app/page.tsx:91 — `PageContent` с роутингом и лендингом
