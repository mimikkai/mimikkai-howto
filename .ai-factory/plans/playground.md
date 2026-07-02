# Implementation Plan: Playground — загрузка mim.lua с интерактивным демо

Branch: main (no-git-switch)
Created: 2026-07-02

## Settings
- Testing: yes
- Logging: verbose
- Docs: no  # WARN [docs] only, no mandatory checkpoint

## Roadmap Linkage
Milestone: "none"
Rationale: ROADMAP.md отсутствует — linkage пропущен

## Research Context
Source: .ai-factory/RESEARCH.md (Active Summary)

Topic: Playground — раздел загрузки mim.lua (или .zip с mim.lua внутри) с интерактивным демо загруженного сценария
Goal: Пользователь загружает mim.lua → парсинг через lua-in-js → 4 шага демо (чат, ИИ-агент, таблица, обработка), демонстрирующие компонент MimikkAI
Constraints:
- Next.js App Router (Next 16.2.6), Tailwind CSS v4, `prefers-reduced-motion` обязательно
- lua-in-js (npm ^2.2.5) уже установлен — использовать для парсинга mim.lua
- Архитектура: Вариант B — свой `/playground` player с упрощёнными runtime step-компонентами; НЕ лезть в `components/step-processing.tsx` (legacy 2992 строки)
- `lib/cases/scheduler.ts` — shared createScheduler(), переиспользуем
- Кодстайл: без комментариев, verbose DEBUG-логи вида `[playground:xxx] msg {data}`
Decisions:
- `mim.columns` — объект с ключами A..F (не массив). Итерируем через `tbl.keys`/`strValues`. `read_only: true` → output, `false` → input
- `mim.entry` — массив объектов (`tbl.numValues`), каждый с input-полями
- `mim.prompt` — строка с YAML-блоками (`key: |`). Наивный split по `^(\w+):\s*\|$` → секции
- .zip: новая зависимость `fflate` (~3 КБ) — `unzipSync` в браузере
- Кнопка «Загрузить пример» — встроенный mim.lua (анализ отзывов клиентов)
- Чат (шаг 1): пользователь печатает `mim.name` → ассистент отвечает `mim.description` → кнопка → шаг 2
- Шаг 4: текстовый лог «обработка в веб-браузере…» + построчное заполнение output-колонок через имитацию `update_entry_fields` (через scheduler)
Open questions:
- (none)
Success signals:
- `/playground` открывается, принимает .lua и .zip с mim.lua внутри
- Парсинг извлекает name, description, columns (input/output), entry, prompt-секции
- 4 шага демо работают end-to-end на примере «Анализ отзывов клиентов»
- Шаг 4 построчно заполняет output-колонки с текстовым логом
- `pnpm typecheck` + `pnpm test` + `pnpm build` — зелёные

## Commit Plan
- **Commit 1** (after tasks 1-3): "feat(playground): add mim.lua parser and types"
- **Commit 2** (after tasks 4-5): "feat(playground): add upload page and playground shell"
- **Commit 3** (after tasks 6-9): "feat(playground): add 4 demo steps (chat, mim-lua, data-table, processing)"
- **Commit 4** (after task 10): "feat(playground): wire home card and final polish"

## Tasks

### Phase 1: Foundation — types, parser, example
- [x] Task 1: Создать `lib/playground/types.ts` с типами MimModule
- [x] Task 2: Создать `lib/playground/parse-mim-lua.ts` — парсер mim.lua через lua-in-js
- [x] Task 3: Создать `lib/playground/example-mim-lua.ts` — встроенный пример mim.lua

### Phase 2: Upload + shell
- [x] Task 4: Установить `fflate`, создать `lib/playground/extract-archive.ts` (.zip → mim.lua source)
- [x] Task 5: Создать `app/playground/page.tsx` + `app/playground/playground-content.tsx` — upload + 4-step shell

### Phase 3: 4 demo steps
- [x] Task 6: Создать `components/playground/step-upload.tsx` (upload UI + drag&drop + «Загрузить пример»)  (depends on 4, 5)
- [x] Task 7: Создать `components/playground/step-chat.tsx` — чат: user печатает mim.name → assistant mim.description (depends on 5)
- [x] Task 8: Создать `components/playground/step-mim-lua.tsx` — превью mim.lua (input/output колонки + task/tools из prompt) (depends on 5)
- [x] Task 9: Создать `components/playground/step-data-table.tsx` + `components/playground/step-processing.tsx` — таблица + обработка (depends on 5)
<!-- Commit checkpoint: tasks 6-9 -->

### Phase 4: Integration
- [x] Task 10: Добавить карточку «Playground» на главную (`app/page.tsx`) + финальная проверка typecheck/test/build (depends on 5, 9)