# Implementation Plan: Переключатель темы (segmented control с иконками)

Branch: none
Created: 2026-06-10

## Settings
- Testing: no
- Logging: standard
- Docs: no

## Context
В верхнем правом углу header добавить segmented control с 3 режимами темы: Системная / Тёмная / Светлая. Иконки: Monitor (🖥️), Moon (🌙), Sun (☀️) — inline SVG без новых зависимостей. next-themes уже подключен, useTheme() доступен. Dropdown-menu компонента нет — используем простой segmented control из кнопок.

## Tasks

### Phase 1: Компонент переключателя темы
- [x] Task 1: Создать компонент `components/theme-toggle.tsx` — клиентский ("use client"), использует `useTheme()` из next-themes. Segmented control: 3 кнопки с inline SVG иконками (Monitor, Moon, Sun). Активная кнопка подсвечивается (`bg-muted` или `bg-primary/10`). Гидратация: рендерить пустышку до mount, после — реальный toggle. Скрыть на `mounted === false`.
  - Files: `components/theme-toggle.tsx`

### Phase 2: Интеграция в header
- [x] Task 2: Добавить `<ThemeToggle />` в header `app/page.tsx` — справа от ссылки `mimikkai.ru`. Обернуть правую часть в flex-контейнер с gap. PageContent — уже "use client", проблем нет.
  - Files: `app/page.tsx`

### Phase 3: Чистка
- [x] Task 3: Удалить ThemeHotkey из `components/theme-provider.tsx` — хоткей `d` заменён визуальным переключателем. Оставить только ThemeProvider обёртку.
  - Files: `components/theme-provider.tsx`