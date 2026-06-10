# Implementation Plan: Модульные сценарии (`refactor/modular-scenarios`)

Branch: none
Created: 2026-06-10

## Settings
- Testing: yes (registry + toRow mappers + render smoke)
- Logging: verbose
- Docs: yes (`docs/architecture/scenarios.md`)

## Roadmap Linkage
Файл `.ai-factory/ROADMAP.md` отсутствует — раздел опущен.

## Research Context
Source: `.ai-factory/RESEARCH.md` (Active Summary)

Goal: каждый сценарий живёт в `lib/cases/<slug>/` самодостаточно; добавление нового сценария = новая папка + 1 запись в registry, без правок в общих компонентах.

Constraints:
- Next.js App Router, client component в `app/page.tsx`
- Текущие размеры файлов: `step-processing.tsx` 2993 строки, `step-data-table.tsx` 549, `step-chat.tsx` 296, `lib/case-config.tsx` 936
- 5 сценариев в `app/page.tsx::CASES` (3 active, 2 disabled без конфигов)
- 3 datasets в `lib/case-config.tsx` (PRODUCTS, THREADS_POSTS, EMAIL_CONTACTS)
- 3 локальных row-интерфейса в step-data-table (PriceDataRow, ThreadsDataRow, EmailDataRow) и 3 — в step-processing
- 3 локальных StatusBadge-компонента в step-processing (StatusBadge, ThreadsStatusBadge, EmailStatusBadge)
- 1 `BrowserPhase` union на 36 значений, склеивающий все сценарии
- 3 `processNext*` useCallback под одним useState
- Только `app/page.tsx` импортирует step-*; `step-*` импортируют из `@/lib/case-config`

Decisions:
- папка сценария владеет всеми 4 шагами (`StepChat`, `StepMimLua`, `StepDataTable`, `StepProcessing`) — полная изоляция
- сценарий сам хранит данные и state, не получает их сверху через props
- `BrowserPhase` нормализуется в общий формат (idle/loading/typing/results/detail/form/done), сценарий мапит свои стадии → общие + рендерит свои экраны
- `CASE_CONFIGS` и datasets переезжают в `lib/cases/<slug>/config.ts` и `lib/cases/<slug>/data.ts`
- реестр сценариев — `lib/cases/registry.ts`; `app/page.tsx` ищет сценарий по slug
- общий chrome (header, footer, навигация по шагам) остаётся в `app/page.tsx`; `components/scenario-step.tsx` оборачивает контент шага (Badge + h2 + back/next)
- миграция строго по одному сценарию (price → threads → email → удаление легаси)

Open questions:
- типизация `ScenarioDefinition<TData, TRow>`: использовать generics или широкий `Record<string, unknown>` + scene-лokalnye типы. План принимает generics с constraint `TRow extends BaseRow`
- форма нормализованного `BrowserPhase`: набор общих стадий согласован в задаче 1.1

Success signals:
- `components/step-*.tsx` удалены
- `lib/case-config.tsx` удалён
- добавление нового сценария = создание папки + 1 запись в registry
- аналог `step-processing.tsx` для каждого сценария < 600 строк
- `app/page.tsx` < 100 строк

## Commit Plan

- **Commit 1** (после задач 1–3): `refactor: introduce lib/cases registry and ScenarioDefinition types`
- **Commit 2** (после задач 4–6): `refactor: migrate price-search to modular scenario structure`
- **Commit 3** (после задач 7–9): `refactor: migrate threads-comments to modular scenario structure`
- **Commit 4** (после задач 10–12): `refactor: migrate email-outreach to modular scenario structure`
- **Commit 5** (после задачи 13): `refactor: remove legacy step-*.tsx and lib/case-config.tsx, simplify app/page.tsx`
- **Commit 6** (после задачи 14): `docs: add modular scenarios architecture guide`

## Tasks

### Phase 1: Каркас — типы, registry, общий wrapper

- [x] Task 1: Создать `lib/cases/types.ts` — `ScenarioDefinition<TData, TRow>`, `BaseRow`, `BrowserPhase` (нормализованный union), `ScenarioMeta`, `CaseConfig` (общий интерфейс, переезд из `lib/case-config.tsx`). Описать generic-ограничение `TRow extends BaseRow = BaseRow` где `BaseRow = { id: number; status: string }`. Экспортировать `StepProps` для четырёх шагов (StepChatProps, StepMimLuaProps, StepDataTableProps, StepProcessingProps).
  - Files: `lib/cases/types.ts`
  - **LOGGING:** module-level `console.debug` через `if (process.env.NODE_ENV !== 'production')` для трейсинга загрузки типов в dev-сборке

- [x] Task 2: Создать `lib/cases/registry.ts` — `registry: Record<string, ScenarioDefinition<unknown, BaseRow>>`, функции `getScenario(slug)`, `listScenarios()`. В этом коммите registry **пустой** (объект, без записей). Добавить warn если slug не найден.
  - Files: `lib/cases/registry.ts`
  - **LOGGING:** при `getScenario(unknown)` — `console.warn('[registry] scenario not found', { slug, availableSlugs })`. При init модуля — `console.debug('[registry] initialized', { count })`

- [x] Task 3: Создать `components/scenario-step.tsx` — общий wrapper шага. Принимает `slug, step, onBack, onNext, onComplete`. Достаёт сценарий из registry, рендерит `scenario.steps.<StepName>`. Шапка шага: `<Badge>Шаг N из 4</Badge>` + `<h2>...</h2>`, кнопки навигации (если `onBack`/`onNext` прокинуты). Логика шага 1 (`onComplete: (prompt: string) => void`) и шага 2/3 (`onNext/onBack`) сохраняется.
  - Files: `components/scenario-step.tsx`
  - **LOGGING:** `console.debug('[scenario-step] render', { slug, step })` на каждый mount; `console.warn('[scenario-step] missing scenario', { slug, step })` если registry вернул null

- [x] Task 4: Создать минимальный тестовый сценарий `lib/cases/price-search/index.ts` (заглушка) и зарегистрировать его в registry. Цель — убедиться, что pipeline работает до полной миграции price-search. Поля: `meta`, `config` (минимум: chat, mimLua, dataTable), пустые `steps: {}`. Не заменяет реальный step-* код, используется только для smoke-теста сборки.
  - Files: `lib/cases/price-search/index.ts`, `lib/cases/registry.ts`
  - **LOGGING:** отсутствует (заглушка)

### Phase 2: Миграция `price-search`

- [x] Task 5: Создать `lib/cases/price-search/data.ts` — перенести `PRODUCTS` (~100 строк) из `lib/case-config.tsx`. Сохранить экспорт-нейминг `PRODUCTS`. Добавить type `Product = string` либо оставить `string[]`.
  - Files: `lib/cases/price-search/data.ts`
  - **LOGGING:** `console.debug('[price-search:data] loaded', { count: PRODUCTS.length })` на module init

- [x] Task 6: Создать `lib/cases/price-search/config.ts` — перенести блок `price-search` из `CASE_CONFIGS` (chat, mimLua, dataTable) и интерфейс `CaseConfig` сюда (или импортировать из `lib/cases/types.ts`). Не экспортировать `CASE_CONFIGS` глобально.
  - Files: `lib/cases/price-search/config.ts`
  - **LOGGING:** отсутствует (статический конфиг)

- [x] Task 7: Перенести логику price-search в `lib/cases/price-search/steps/`:
  - `StepChat.tsx` — копия `components/step-chat.tsx` с заменой `import { CASE_CONFIGS } from "@/lib/case-config"` на `import { caseConfig } from "../config"`. Локальный пропс `caseSlug` заменяется на использование сцены из registry.
  - `StepMimLua.tsx` — копия `components/step-mim-lua.tsx`, аналогично.
  - `StepDataTable.tsx` — выделить из `components/step-data-table.tsx` блок `isEmail=false && isThreads=false` (ветка price). Использовать `caseConfig.dataTable.columns` (вместо локального списка колонок). Локальный `PriceDataRow`, `priceStatusColor`.
  - `StepProcessing.tsx` — выделить из `components/step-processing.tsx`: `BrowserPhase`-подмножество для price (`idle | typing | google_loading | google_results | click_result | page_transition | market_loading | market_page | market_highlight | tab_switch | market2_loading | market2_page | price_found | writing`), `processNextPrice`, `IDLE_BROWSER` подмножество, `StatusBadge` (price-вариант), `phaseLabel` подмножество, `PRICE_RANGES`, `MARKETPLACES`, `generatePrice`, `pickMarkets`, `generateSearchResults`, `generateMarketItems`. Сценарий мапит свои стадии в нормализованный `BrowserPhase` через `mapToNormalized(localPhase): NormalizedPhase`. `scenario` экспортирует `{ meta, config, data, toRow, steps: { StepChat, StepMimLua, StepDataTable, StepProcessing } }`.
  - Files: `lib/cases/price-search/steps/StepChat.tsx`, `lib/cases/price-search/steps/StepMimLua.tsx`, `lib/cases/price-search/steps/StepDataTable.tsx`, `lib/cases/price-search/steps/StepProcessing.tsx`, `lib/cases/price-search/index.ts`
  - **LOGGING:** в StepProcessing — `console.debug('[price-search:processing] phase', { phase, rowIndex })` на каждом фазовом переходе; `console.info('[price-search:processing] row done', { rowIndex, found, price })` по завершении строки; `console.debug('[price-search:processing] map normalized', { local: 'google_loading', normalized: 'loading' })` на маппинге

- [x] Task 8: Удалить временную заглушку из Task 4. Зарегистрировать полноценный price-search сценарий в `lib/cases/registry.ts`. Проверить локально: `pnpm dev`, перейти на `?case=price-search&step=chat` и пройти все 4 шага.
  - Files: `lib/cases/registry.ts`, `lib/cases/price-search/index.ts`
  - **LOGGING:** `console.info('[registry] registered', { slug, hasSteps: Object.keys(scenario.steps).length })` на module init

- [x] Task 9: Написать тесты:
  - `lib/cases/registry.test.ts` — node:test: `getScenario('price-search')` возвращает non-null; `getScenario('unknown')` возвращает null; `listScenarios()` содержит 'price-search'; при пустой registry — корректный warn.
  - `lib/cases/price-search/toRow.test.ts` — тесты на `toPriceRow` маппер из `StepDataTable`.
  - Render smoke для `StepDataTable` отложен (нужен testing-library, расширение scope).
  - Files: `lib/cases/registry.test.ts`, `lib/cases/price-search/toRow.test.ts`
  - **LOGGING:** vitest logger, не дублировать console.debug в тестах

### Phase 3: Миграция `threads-comments`

- [ ] Task 10: Создать `lib/cases/threads-comments/data.ts` — перенести `THREADS_POSTS` (~30 записей, 240 строк) из `lib/case-config.tsx`. Добавить type `ThreadsPost = { date: string; postText: string; postUrl: string; comment: string }`.
  - Files: `lib/cases/threads-comments/data.ts`
  - **LOGGING:** `console.debug('[threads-comments:data] loaded', { count: THREADS_POSTS.length })`

- [ ] Task 11: Создать `lib/cases/threads-comments/config.ts` — перенести блок `threads-comments` из `CASE_CONFIGS`.
  - Files: `lib/cases/threads-comments/config.ts`
  - **LOGGING:** отсутствует

- [ ] Task 12: Перенести логику threads-comments в `lib/cases/threads-comments/steps/`:
  - `StepChat.tsx`, `StepMimLua.tsx` — копия price-search версий с заменой `import { caseConfig }` на локальный.
  - `StepDataTable.tsx` — выделить из `components/step-data-table.tsx` ветку `isThreads=true`. Локальный `ThreadsDataRow`, `threadsStatusColor`. Очистить `getThreadsColumnValue`.
  - `StepProcessing.tsx` — выделить из `components/step-processing.tsx` подмножество для threads: `BrowserPhase` подмножество (`threads_*`), `processNextThreads`, `ThreadsStatusBadge`, фазы браузера (home/search/feed/post/comment/published/check). Маппинг в нормализованный `BrowserPhase`.
  - `index.ts` — экспорт сценария с шагами.
  - Зарегистрировать в registry.
  - Files: `lib/cases/threads-comments/steps/StepChat.tsx`, `lib/cases/threads-comments/steps/StepMimLua.tsx`, `lib/cases/threads-comments/steps/StepDataTable.tsx`, `lib/cases/threads-comments/steps/StepProcessing.tsx`, `lib/cases/threads-comments/index.ts`, `lib/cases/registry.ts`
  - **LOGGING:** зеркалит price-search: phase, row done, map normalized

- [ ] Task 13: Написать тесты для threads-comments — зеркалят price-search: registry lookup, toRow mapper (date/postUrl/comment → ThreadsDataRow), StepDataTable render smoke с empty state и заполненной таблицей.
  - Files: `lib/cases/threads-comments/toRow.test.ts`, `lib/cases/threads-comments/steps/StepDataTable.test.tsx`
  - **LOGGING:** vitest

### Phase 4: Миграция `email-outreach`

- [ ] Task 14: Создать `lib/cases/email-outreach/data.ts` — перенести `EMAIL_CONTACTS` (30 записей, ~280 строк) и интерфейс `EmailContact` из `lib/case-config.tsx`.
  - Files: `lib/cases/email-outreach/data.ts`
  - **LOGGING:** `console.debug('[email-outreach:data] loaded', { count: EMAIL_CONTACTS.length })`

- [ ] Task 15: Создать `lib/cases/email-outreach/config.ts` — перенести блок `email-outreach` из `CASE_CONFIGS`.
  - Files: `lib/cases/email-outreach/config.ts`
  - **LOGGING:** отсутствует

- [ ] Task 16: Перенести логику email-outreach в `lib/cases/email-outreach/steps/`:
  - `StepChat.tsx`, `StepMimLua.tsx` — копия price-search версий.
  - `StepDataTable.tsx` — выделить из `components/step-data-table.tsx` ветку `isEmail=true`. Локальный `EmailDataRow`, `emailStatusColor`. Очистить `getEmailColumnValue`.
  - `StepProcessing.tsx` — выделить из `components/step-processing.tsx` подмножество для email: `BrowserPhase` подмножество (`email_*`), `processNextEmail`, `EmailStatusBadge`, фазы браузера (yandex/company/contacts/found/compose/send/confirmed). Маппинг в нормализованный `BrowserPhase`.
  - `index.ts` — экспорт сценария.
  - Зарегистрировать в registry.
  - Files: `lib/cases/email-outreach/steps/StepChat.tsx`, `lib/cases/email-outreach/steps/StepMimLua.tsx`, `lib/cases/email-outreach/steps/StepDataTable.tsx`, `lib/cases/email-outreach/steps/StepProcessing.tsx`, `lib/cases/email-outreach/index.ts`, `lib/cases/registry.ts`
  - **LOGGING:** зеркалит price-search

- [ ] Task 17: Написать тесты для email-outreach — зеркалят price-search: registry lookup, toRow mapper, StepDataTable render smoke.
  - Files: `lib/cases/email-outreach/toRow.test.ts`, `lib/cases/email-outreach/steps/StepDataTable.test.tsx`
  - **LOGGING:** vitest

### Phase 5: Удаление легаси и упрощение `app/page.tsx`

- [ ] Task 18: Упростить `app/page.tsx`:
  - удалить локальные константы `CASES`, `STEP_TITLES`, `STEP_ICONS`, `STEP_SLUGS`, `SLUG_TO_STEP` (частично переезжают)
  - удалить `StepChat`/`StepMimLua`/`StepDataTable`/`StepProcessing` импорты
  - импортировать `ScenarioStep` из `@/components/scenario-step`
  - импортировать `listScenarios` из `@/lib/cases/registry`
  - рендер лендинга: `listScenarios().map(s => <Card>...)` с `s.meta.title/description/icon/available`
  - рендер шага: `<ScenarioStep slug={caseSlug} step={step} onBack={...} onNext={...} onComplete={...} />`
  - оставить `header` (лого + ThemeToggle), `footer`, `nav` (прогресс по шагам), `Suspense`
  - целевой размер < 100 строк
  - Files: `app/page.tsx`
  - **LOGGING:** `console.debug('[page] render', { caseSlug, step })` в PageContent; `console.warn('[page] unknown case', { caseSlug, available })` если slug не найден в registry

- [ ] Task 19: Удалить легаси файлы:
  - `components/step-chat.tsx`
  - `components/step-mim-lua.tsx`
  - `components/step-data-table.tsx`
  - `components/step-processing.tsx`
  - `lib/case-config.tsx`
  - Проверить `pnpm tsc --noEmit` и `pnpm lint` — никаких residual-импортов
  - Files: (delete)
  - **LOGGING:** `console.info('[cleanup] legacy removed', { files: [...] })` однократно на следующий dev-запуск (можно не писать, проверка ручная)

- [ ] Task 20: Запустить полный smoke-test: `pnpm dev`, пройти все 3 сценария (price-search, threads-comments, email-outreach) end-to-end, проверить 4 шага в каждом. Проверить лендинг: 5 карточек (3 available + 2 disabled), клик по disabled — без реакции, клик по available — переход на `?case=<slug>&step=chat`.
  - Files: (verification)
  - **LOGGING:** ручное наблюдение в dev-консоли за [registry] / [scenario-step] / [price-search:*] / [threads-comments:*] / [email-outreach:*]

### Phase 6: Документация

- [ ] Task 21: Создать `docs/architecture/scenarios.md`:
  - обзор модели сценариев
  - структура `lib/cases/<slug>/` (index, config, data, steps/)
  - контракт `ScenarioDefinition<TData, TRow>` (типы, generic, BrowserPhase нормализация)
  - инструкция «как добавить новый сценарий» (пошагово, с примерами кода)
  - инструкция «как добавить новое состояние в BrowserPhase»
  - ссылка на registry и `listScenarios()` для лендинга
  - краткая карта нормализованных BrowserPhase значений (idle/loading/typing/results/detail/form/done) и пример маппинга из локальных фаз
  - Files: `docs/architecture/scenarios.md`
  - **LOGGING:** отсутствует (документация)
