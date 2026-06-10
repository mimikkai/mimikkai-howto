# Implementation Plan: Мобильная адаптация StepProcessing (tabs)

Branch: none
Created: 2026-06-10

## Settings
- Testing: no
- Logging: standard
- Docs: no

## Context
StepProcessing — 3 панели (Таблица, Чат, Браузер) в grid-cols-3. На мобильном стакаются вертикально (~1500px высота). Нужен tabs-паттерн: десктоп — все 3 видны, мобильный — табы переключают панели. activePane уже существует и авто-переключается; добавить userTouchedTab чтобы уважать ручной выбор.

## Tasks

### Phase 1: Tabs UI + Responsive Layout
- [x] Task 1: Добавить tab-кнопки в `StepProcessing` — строка с 3 кнопками (📊 Таблица, 🤖 Чат ИИ, 🌐 Браузер). На десктопе — визуальный индикатор активной панели. На мобильном — переключатель. Breakpoint: `md` (768px).
  - Files: `components/step-processing.tsx`

- [x] Task 2: Рефакторинг layout — десктоп: `md:grid-cols-3` как сейчас, все панели видны. Мобильный: показывать только `activePane`, остальные `hidden md:flex`. Убрать фиксированные `h-[460px]` на ScrollArea → `md:h-[460px] h-[calc(100dvh-320px)]` с динамической высотой.
  - Files: `components/step-processing.tsx`

- [x] Task 3: Добавить стейт `userTouchedTab` — при ручном клике на таб установить `true`. Авто-переключение через `setAgentActivePane` проверяет `userTouchedTabRef.current`: если true — не переключать, но подсветить таб индикатором (dot). При остановке/завершении агента — сбросить `userTouchedTab`.
  - Files: `components/step-processing.tsx`

### Phase 2: Mobile Polish
- [x] Task 4: Исправить высоту ScrollArea — заменить `h-[460px]` на адаптивную высоту. На мобильном контейнер занимает `calc(100dvh - 320px)`.
  - Files: `components/step-processing.tsx`

- [x] Task 5: Минорные мобильные фиксы на шагах 1-3 — StepChat: уменьшить кнопку `px-6 py-5 text-base sm:px-8 sm:py-6 sm:text-lg`. StepMimLua: стекать вход/выход вертикально на <640px через `flex-col sm:flex-row`. StepDataTable: скрыть колонку цена на мобильном через `hidden sm:table-cell`.
  - Files: `components/step-chat.tsx`, `components/step-mim-lua.tsx`, `components/step-data-table.tsx`