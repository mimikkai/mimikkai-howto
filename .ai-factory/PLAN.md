# Implementation Plan: Анимация заполнения таблицы данных

Branch: none
Created: 2026-06-10

## Settings
- Testing: no
- Logging: standard
- Docs: no

## Tasks

### Phase 1: Empty State + Fill Button
- [ ] Task 1: Изменить `StepDataTable` — начальное состояние `data = []`, добавить кнопку "Заполнить данные" на месте таблицы. Показывать пустое состояние (иконка + текст) когда данных нет. Кнопка "🚀 Запусти агента" скрыта до заполнения.
  - Files: `components/step-data-table.tsx`

### Phase 2: Animated Row Population
- [ ] Task 2: Добавить `useState` для `data` (пустой массив), `isFilling` (boolean), `fillProgress` (number). При нажатии "Заполнить данные" запускать заполнение по 5 строк каждые 40мс через `setInterval`. Обновлять `fillProgress` и `data` на каждой итерации. Показывать Progress bar + счётчик "N/100 строк" над таблицей во время заполнения.
  - Files: `components/step-data-table.tsx`

### Phase 3: Row Entry Animation
- [ ] Task 3: Добавить CSS-анимацию для новых строк — fade-in + slide-down. Использовать inline style `animationDelay` на основе индекса группы для stagger-эффекта. Tailwind `animate-in fade-in slide-in-from-top-2` через классы или keyframes. Каждая новая строка появляется с плавной анимацией.
  - Files: `components/step-data-table.tsx`, `app/globals.css` (если нужны keyframes)

### Phase 4: Post-Fill State
- [ ] Task 4: После завершения заполнения (`fillProgress === 100`) — скрыть прогресс-бар, показать кнопку "🚀 Запусти агента", сменить текст кнопки "Заполнить данные" на неактивную или скрыть. Счётчик строк в заголовке карточки обновляется.
  - Files: `components/step-data-table.tsx`