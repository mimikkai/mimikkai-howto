# Implementation Plan: Кейс «Ответ на тикеты»

Branch: main (no switch)
Created: 2026-06-11

## Settings
- Testing: no
- Logging: verbose
- Docs: no

## Context
Добавить интерактивный демо-кейс «Ответ на тикеты» (slug: `ticket-reply`) — ИИ-агент обрабатывает обращения из системы техподдержки, ищет ответ в вымышленной wiki-документации (`docs.example-wiki.ru`) и формирует ответ пользователю.

Архитектура уже модуляризована: каждый сценарий живёт в `lib/cases/<slug>/` самодостаточно. Существующие сценарии: `price-search`, `threads-comments`, `email-outreach` (только data.ts). В `app/page.tsx` уже есть запись `ticket-reply` с `available: false`.

Ключевые решения:
- Входные данные: колонка A = дата тикета (все строки `"11.06.2026"`)
- Выходные данные: B = ответ пользователю, C = источник (URL из wiki), D = статус
- Веб-ресурс: вымышленный `docs.example-wiki.ru`
- Шаги имитации: взять дату → открыть wiki → найти статью → извлечь ответ → записать в таблицу

## Research Context
Из RESEARCH.md:
- папка сценария владеет ВСЕМИ 4 шагами — полная изоляция
- сценарий сам хранит данные и стейт
- BrowserPhase нормализуется в общий формат, сценарий мапит свои стадии → общие
- CASE_CONFIGS и datasets живут в `lib/cases/<slug>/config.ts` и `data.ts`
- реестр сценариев — `lib/cases/registry.ts`

## Tasks

### Phase 1: Конфигурация и данные
- [x] Task 1: Создать `lib/cases/ticket-reply/config.ts` — CaseConfig для сценария ticket-reply.
  - `slug: "ticket-reply"`
  - chat: greeting (приветствие + выбор агента), presetPrompt = "Я хочу ИИ-агента для ответов на тикеты техподдержки", presetPromptDesc, assistantResponse (описание: агент открывает wiki, ищет ответ по вопросу, формирует текст и отправляет пользователю)
  - mimLua: inputColumns = [{id:"A", label:"Дата тикета", example:"11.06.2026"}], outputColumns = [{id:"B", label:"Ответ", example:"Для сброса пароля перейдите в Настройки..."}, {id:"C", label:"Источник", example:"https://docs.example-wiki.ru/password-reset"}, {id:"D", label:"Статус", example:"отвечено"}], promptSteps = [1.Открыть wiki-документацию🌐, 2.Найти статью по запросу🔍, 3.Извлечь ответ из статьи📄, 4.Сформировать ответ пользователю✍️, 5.Записать результат в таблицу📝], agentTitle = "Ответ на тикеты", agentDesc, promptIntro
  - dataTable: columns [A(input), B(output), C(output), D(output)], description, fillButtonText, empty*
  - Files: `lib/cases/ticket-reply/config.ts`
  - Logging: DEBUG при загрузке конфига

- [x] Task 2: Создать `lib/cases/ticket-reply/data.ts` — тестовые данные.
  - Массив TICKETS из ~30 строк, каждая = дата `"11.06.2026"` (как строка)
  - Экспорт типа и массива
  - Files: `lib/cases/ticket-reply/data.ts`
  - Logging: DEBUG при загрузке данных `{ count: TICKETS.length }`

### Phase 2: Регистрация и 4 шаг-компонента
- [x] Task 3: Создать `lib/cases/ticket-reply/index.ts` — регистрация в registry.
  - Интерфейс TicketDataRow extends BaseRow { date: string, answer: string, source: string, status: "ожидает" | "обработка" | "отвечено" | "не найдено" }
  - ticketReplyScenario: ScenarioDefinition<string, TicketDataRow> с meta, config, data, toRow, steps
  - registerScenario("ticket-reply", ...)
  - Files: `lib/cases/ticket-reply/index.ts`

- [x] Task 4: Создать `lib/cases/ticket-reply/steps/StepChat.tsx` — чат создания агента.
  - Аналог price-search/steps/StepChat.tsx, но использует ticketReplyConfig
  - Печатает greeting → preset prompt → assistant response
  - onComplete передаёт prompt
  - Files: `lib/cases/ticket-reply/steps/StepChat.tsx`

- [x] Task 5: Создать `lib/cases/ticket-reply/steps/StepMimLua.tsx` — описание ИИ-агента.
  - Аналог price-search/steps/StepMimLua.tsx, но использует ticketReplyConfig
  - Показывает сценарий, вход/выход колонки
  - Files: `lib/cases/ticket-reply/steps/StepMimLua.tsx`

- [x] Task 6: Создать `lib/cases/ticket-reply/steps/StepDataTable.tsx` — таблица данных.
  - Аналог price-search/steps/StepDataTable.tsx
  - Колонки: #, A(Дата), B(Ответ), D(Статус) — C(Источник) скрыт на мобильных
  - HandleFillData: заполняет из TICKETS, status = "ожидает"
  - toTicketRow: (date: string, index: number) => TicketDataRow
  - Статусы: ожидает(серый), обработка(amber), отвечено(emerald), не найдено(red)
  - Files: `lib/cases/ticket-reply/steps/StepDataTable.tsx`

- [x] Task 7: Создать `lib/cases/ticket-reply/steps/StepProcessing.tsx` — обработка тикетов ИИ-агентом.
  - LocalPhase: idle | wiki_home | wiki_search_typing | wiki_search_loading | wiki_search_results | wiki_article_click | wiki_article_loading | wiki_article_page | wiki_answer_found | writing
  - PHASE_TO_NORMALIZED: маппинг в NormalizedBrowserPhase
  - BrowserState: phase, tabs, url, typedQuery, searchResults, articleContent, foundAnswer, loadingProgress
  - Имитация браузера: вкладки wiki, URL bar, контент
  - Вопросы для поиска: предопределённый список (сброс пароля, настройка API, биллинг, интеграция, и т.д.) — рандомно на строку
  - generateWikiSearchResults(query) → [{title, url, snippet}]
  - generateWikiArticle(query) → {title, sections, answer}
  - Фазы обработки строки:
    1. (0ms) показать строку в таблице, статус "обработка", чат "📋 Обрабатываю тикет от ..."
    2. (700ms) чат "🔍 Ищу ответ в wiki-документации", переключить на браузер
    3. (1500ms) wiki_search_typing — набор запроса
    4. (2500ms) wiki_search_loading — загрузка результатов
    5. (4000ms) wiki_search_results — показать 3-4 результата поиска
    6. (5500ms) wiki_article_click — клик по первому результату
    7. (6500ms) wiki_article_loading — загрузка статьи
    8. (8000ms) wiki_article_page — показать статью с разделами
    9. (10000ms) wiki_answer_found — выделить ответ, чат "✅ Ответ найден"
    10. (11500ms) writing — записать в таблицу
    11. (12500ms) обновить строку (answer, source, status), следующая строка
  - 3-панельный UI: Таблица | Чат ИИ | Браузер (как в price-search)
  - Files: `lib/cases/ticket-reply/steps/StepProcessing.tsx`

### Phase 3: Интеграция в приложение
- [x] Task 8: Обновить `app/page.tsx` — изменить `available: false` на `available: true` для ticket-reply.
  - Files: `app/page.tsx:59`

- [x] Task 9: Импорт ticket-reply для регистрации — добавлен `import "@/lib/cases/ticket-reply"` в app/page.tsx. Переключены на ScenarioStep + listScenarios из registry.

## Commit Plan
- **Commit 1** (after tasks 1-3): `feat: add ticket-reply case config, data, and registry`
- **Commit 2** (after tasks 4-7): `feat: add ticket-reply step components`
- **Commit 3** (after tasks 8-9): `feat: enable ticket-reply scenario in app`