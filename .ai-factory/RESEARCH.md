# Research

Updated: 2026-07-02 21:00
Status: active

## Active Summary (input for /aif-plan)
<!-- aif:active-summary:start -->
Topic: Playground — раздел загрузки mim.lua (или .zip с mim.lua внутри) с интерактивным демо загруженного сценария
Goal: Пользователь загружает mim.lua → парсинг через lua-in-js → 4 шага демо (чат, ИИ-агент, таблица, обработка), демонстрирующие компонент MimikkAI
Constraints:
- Next.js App Router (Next 16.2.6), Tailwind CSS v4, `prefers-reduced-motion` обязательно
- lua-in-js (npm ^2.2.5) уже установлен — использовать для парсинга mim.lua
- Архитектура сценариев: `lib/cases/<slug>/` + registry, но playground — runtime, не статичный сценарий
- `components/step-*.tsx` (chat, mim-lua, data-table, processing) жёстко прибиты к `CASE_CONFIGS[slug]` и конкретным фазам браузера (2992 строки) — НЕ переиспользовать напрямую
- `lib/cases/scheduler.ts` — shared createScheduler(), можно использовать в playground
- Кодстайл: без комментариев, verbose DEBUG-логи вида `[playground:xxx] msg {data}`
- Маршрут: `/playground`
Decisions:
- Архитектура: Вариант B — свой `/playground` player с упрощёнными runtime step-компонентами, fed распарсенным mim.lua. Не лезть в `step-processing.tsx` (legacy 2992 строки)
- Парсинг mim.lua: `luainjs.createEnv().parse(src).exec()` → `luainjs.Table` → adapter `toMimModule()` (через `tbl.get("name")`, `tbl.numValues`, `tbl.strValues`, `tbl.keys`, `tbl.toObject()`)
- `mim.columns` — объект с ключами A..F (не массив). Итерируем через `tbl.keys`/`strValues`. `read_only: true` → output, `false` → input
- `mim.entry` — массив объектов (`tbl.numValues`), каждый с input-полями
- `mim.prompt` — строка с YAML-блоками (`key: |`). Наивный split по `^(\\w+):\\s*\\|$` → секции {system_role, task, tools, validation_rules, output_format, special_cases}. Рендерим `task` + `tools.update_entry_fields` как шаги
- .zip: новая зависимость `fflate` (~3 КБ) — `unzipSync` в браузере
- Кнопка «Загрузить пример» — предзаполненный mim.lua (анализ отзывов) из вопроса
- Чат (шаг 1): пользователь печатает `mim.name` → ассистент отвечает `mim.description` → кнопка → шаг 2
- Шаг 4: текстовый лог «обработка в веб-браузере…» + постепенное заполнение output-колонок через имитацию `update_entry_fields` (построчно, через scheduler)
- Документация: нет (warn-only)
- Тесты: да (для парсера mim.lua + adapter)
- Логирование: verbose
Open questions:
- (none)
Success signals:
- `/playground` открывается, принимает .lua и .zip с mim.lua внутри
- Парсинг mim.lua извлекает name, description, columns (input/output), entry, prompt-секции
- 4 шага демо работают end-to-end на примере «Анализ отзывов клиентов»
- Шаг 4 построчно заполняет output-колонки с текстовым логом
- `pnpm typecheck` + `pnpm test` + `pnpm build` — зелёные
Next step: `/aif-plan full playground` → план реализации
<!-- aif:active-summary:end -->

## Sessions

### 2026-07-02 21:00 — Разведка playground
What changed:
- Изучена архитектура mimikkai-howto: `app/[slug]` + `lib/cases/<slug>/` + registry + `components/step-*.tsx`
- Выбран Вариант B (свой player) — `step-processing.tsx` 2992 строки слишком legacy
- Изучен API lua-in-js: `createEnv().parse(src).exec()` → `Table` (numValues/strValues/keys, get/set, toObject)
- Решено: fflate для .zip, наивный YAML-split для mim.prompt, пример «Анализ отзывов» встроенный
Key notes:
- `mim.columns` — объект {A:{...}, B:{...}}, не массив
- `mim.entry` — массив таблиц с input-полями
- `mim.prompt` — строка с YAML `key: |` блоками
- `CASE_CONFIGS` в `lib/case-config.tsx` (215 КБ) — статичный, playground обходит его
Links (paths):
- app/page.tsx — главная, добавить карточку Playground
- app/[slug]/scenario-page-content.tsx — образец 4-шаговой навигации
- lib/cases/types.ts — CaseConfig, MimLuaConfig, ScenarioMeta
- lib/cases/scheduler.ts — createScheduler (shared)
- components/step-chat.tsx — образец чата с typing-анимацией
- components/step-mim-lua.tsx — образец шага 2 (вход/выход/промпт)
- components/step-data-table.tsx — образец шага 3 (таблица с batch-fill)
- lib/cases/marketplace-card-fill/steps/StepProcessing.tsx — образец шага 4 (scheduler + chat log)
- node_modules/lua-in-js/dist/types/Table.d.ts — API Table
- node_modules/lua-in-js/dist/types/utils.d.ts — LuaType, coerce функции