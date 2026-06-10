# Implementation Plan: Кейс «Комментирование в Threads»

Branch: none
Created: 2026-06-10

## Settings
- Testing: no
- Logging: standard
- Docs: no

## Context
Добавить интерактивный демо-кейс «Комментирование в Threads» — второй доступный сценарий после «Поиск цен». Агент ищет посты об AI в Threads, генерирует комментарии с упоминанием Mimikkai и публикует их. 4 шага: чат → ИИ-агент (mim.lua) → таблица данных (30 строк, 5 колонок A-E) → обработка (имитация браузера Threads: поиск → лента → пост → комментарий → публикация → запись в таблицу).

Архитектура: проброс `caseSlug` во все Step-компоненты с ветвлением данных внутри. Данные кейсов вынести в `lib/case-config.tsx`.

## Commit Plan
- **Commit 1** (after tasks 1-3): "feat: add case config and enable threads-comments case"
- **Commit 2** (after tasks 4-7): "feat: add threads-comments flow to all step components"

## Tasks

### Phase 1: Конфигурация кейсов
- [x] Task 1: Создать `lib/case-config.tsx` — конфигурация данных для обоих кейсов. Интерфейс `CaseConfig` с полями: slug, chat (greeting, presetPrompt, assistantResponse), mimLua (inputColumns, outputColumns, promptSteps, agentTitle, agentDesc), dataTable (rows, columns), processing (browserPhases, processFlow). Экспортировать мапу `CASE_CONFIGS: Record<string, CaseConfig>`. Для price-search — текущие данные из Step-компонентов. Для threads-comments — данные по шаблону из docs.mimikkai.ru.
  - Files: `lib/case-config.tsx`

- [x] Task 2: Сгенерировать 30 строк данных для threads-comments в `lib/case-config.tsx` — реалистичные посты об AI/автоматизации на русском (по аналогии с 4 примерами пользователя). Каждая строка: дата (DD.MM), текст поста, ссылка (threads.com/@handle/post/xxx), текст комментария, статус («ожидает»). 30 разных авторов, тем и комментариев.
  - Files: `lib/case-config.tsx`

- [x] Task 3: Обновить `app/page.tsx` — установить `available: true` для threads-comments, пробросить `caseSlug` как prop во все 4 Step-компонента.
  - Files: `app/page.tsx`

### Phase 2: Ветвление Step-компонентов
- [x] Task 4: Обновить `components/step-chat.tsx` — принять `caseSlug: string`, ветвить ASSISTANT_GREETING, PRESET_PROMPT, ASSISTANT_RESPONSE по caseSlug. Для threads: greeting = «Привет! Я помогу создать ИИ-агента...», presetPrompt = «Я хочу ИИ-агента для комментирования постов в Threads», response = описание агента для Threads (поиск постов → генерация комментариев → публикация).
  - Files: `components/step-chat.tsx`

- [x] Task 5: Обновить `components/step-mim-lua.tsx` — принять `caseSlug: string`, ветвить INPUT_COLUMNS, OUTPUT_COLUMNS, PROMPT_STEPS, agentTitle, agentDesc. Для threads: вход A-Дата, выход B-Ссылка/C-Текст поста/D-Комментарий/E-Статус. Сценарий: открыть Threads → найти пост → сгенерировать комментарий → опубликовать → записать результат.
  - Files: `components/step-mim-lua.tsx`

- [x] Task 6: Обновить `components/step-data-table.tsx` — принять `caseSlug: string`, ветвить структуру таблицы и данные. Для threads: 5 колонок (A-E), 30 строк с постами, статус «ожидает», без цены. Адаптировать заголовки, описание и рендер.
  - Files: `components/step-data-table.tsx`

- [x] Task 7: Обновить `components/step-processing.tsx` — принять `caseSlug: string`, добавить полный цикл имитации браузера Threads для threads-comments. Фазы: threads_home → threads_search_click → threads_search_typing → threads_search_loading → threads_feed → threads_post_click → threads_post_reading → threads_comment_click → threads_comment_typing → threads_comment_publish → threads_done. Для каждой фазы — свой UI: Threads лого, строка поиска, карточки постов с авторами/лайками/временем, поле комментария, кнопка «Опубликовать», подтверждение. Таблица: 5 колонок, статус «Готово». Заполнение B,C,D,E при завершении обработки строки.
  - Files: `components/step-processing.tsx`