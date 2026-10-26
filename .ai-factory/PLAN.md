# План: MIM-573 — лого ведёт на mimikkai.ru (выход из демо на мобилке)

Branch: main
Created: 2026-10-26

## Original Request

Work on Linear issue MIM-573:

Suggested branch name: dealenx/mim-573-esli-na-mobilke-popadaesh-na-interaktivnoe-deme-kher-ottuda

Если на мобилке попадаешь на интерактивное демо - хер оттуда выберешься, надо, чтобы при клике по лого кидало на mimikkai.ru

то есть надо сделать чтобы по нажатию на лого перекидывало на mimikkai.ru

## Settings
- Testing: no
- Logging: minimal
- Docs: no

## Диагностика (воспроизведено на живом сайте, 375×667, mobile UA)

Логотип реализован **четырьмя** разными способами, и только два из них кликабельны:

| Место | Файл:строка | Поведение |
|---|---|---|
| `/` (список сценариев, как на скриншоте) | `app/page.tsx:24` | `<span>` без обработчика — **некликабельный** |
| `/[slug]` | `app/[slug]/scenario-page-content.tsx:101` | `<span onClick>` → `router.push("/")` |
| `/[slug]` — ветка «сценарий не найден» | `app/[slug]/scenario-page-content.tsx:84` | `<span>` без обработчика — **некликабельный** |
| `/playground` | `app/playground/playground-content.tsx:64` | `<span onClick>` → `router.push("/")` |

Измерения (375×667, `?step=processing`):

- `<header>` имеет `position: static` → при прокрутке страницы на 253 px шапка, навигация и **лого уходят за экран**. На шаге 2 (`ai-agent`) документ 1117 px — уходит на 510 px.
- `CreateAgentButton` — `hidden sm:inline-flex`, на мобилке 0×0 → в шапке остаётся только переключатель темы.
- Единственный выход в футере — ссылка `mimikkai.ru` 63×16 px; на главной она на `scrollY=2067` из 2091 px документа, то есть под плавающей панелью in-app браузера.
- Тосты `fixed bottom-4 right-4 z-[100]` (`components/agent-launch-toast.tsx:32`) перекрывают верхние 6–8 px этой ссылки.
- Лого — `<span onClick>`, без `href`/`role`/`tabIndex`: нет клавиатурного доступа, долгого тапа «открыть в браузере», middle-click.

## Решения

- **Цель ссылки:** `https://mimikkai.ru`, `target="_blank"` + `rel="noopener noreferrer"` — как у всех остальных внешних ссылок в репозитории.
- **Одна шапка вместо четырёх:** вынести `SiteHeader` в `components/site-header.tsx`. Причина не в «красоте»: именно дублирование разметки породило три разных поведения лого. Одно место — один источник правды.
- **`sticky top-0 z-40`:** без этого на шагах 2–4 лого уезжает за экран и кликнуть по нему нельзя — задача закрыта только наполовину. `z-40` ниже `Dialog` (`z-50`), чтобы модалки продолжали перекрывать шапку.
- **Регрессия, которую создаёт смена цели лого:** на `/playground` при `step === 0` лого было единственным маршрутом назад в `/`. Добавляем ссылку «Все сценарии» в шапку Playground. На `/[slug]` регрессии нет — там есть кнопка «← <название сценария>» в навигации.
- **`label` делаем опциональным:** ветка «сценарий не найден» рендерит урезанную шапку без подписи и без `CreateAgentButton`.
- **Вне объёма:** тач-таргет футера 63×16, перекрытие футера тостом, `CreateAgentButton` скрытый на мобилке. Зафиксировано как известные проблемы, отдельными задачами не идём.

## Commit Plan
- **Commit 1** (после задач 1–4): `fix(ui): route logo to mimikkai.ru via shared sticky header`

## Tasks

### Phase 1: Общая шапка

- [x] Task 1: Создать `components/site-header.tsx` — `SiteHeader({ label?: string, children?: ReactNode })`.
  - `<header className="sticky top-0 z-40 border-b bg-background">`
  - внутри тот же контейнер `mx-auto flex max-w-6xl items-center justify-between px-3 py-2 sm:px-6 sm:py-3`
  - лого — `<a href="https://mimikkai.ru" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-lg font-bold">` + существующий SVG (path из `app/page.tsx:26-36`, viewBox `0 0 32 30`, `fill/stroke="currentColor"`, `strokeWidth="0.3"`, `className="shrink-0"`) + текст `MimikkAi`
  - `label` рендерится как `<span className="hidden text-xs text-muted-foreground sm:inline">{label}</span>` только если передан
  - правая часть: `<div className="flex items-center gap-2">{children}</div>`
  - Files: `components/site-header.tsx`
  - **LOGGING:** нет (статическая разметка, логировать нечего)

### Phase 2: Замена шапок

- [x] Task 2: `app/page.tsx` — заменить `<header>` (строки 21–51) на `<SiteHeader label="Интерактивное демо">` с `<CreateAgentButton className="hidden sm:inline-flex" />` и `<ThemeToggle />` в children. Логотип-`<span>` удалить. `useRouter` **остаётся** (его используют карточки сценариев и Playground, строки 73 и 87).
  - Files: `app/page.tsx`
  - **LOGGING:** нет (статическая разметка)
- [x] Task 3: `app/[slug]/scenario-page-content.tsx` — заменить **обе** шапки на `SiteHeader`:
  - основная (строки 97–130): `label="Интерактивное демо"`, children — `CreateAgentButton` + `ThemeToggle`
  - ветка «сценарий не найден» (строки 82–87): без `label`, children — только `ThemeToggle`
  - Files: `app/[slug]/scenario-page-content.tsx`
  - **LOGGING:** нет (статическая разметка)
- [x] Task 4: `app/playground/playground-content.tsx` — заменить `<header>` (строки 60–98) на `SiteHeader label="Playground"`, children — `CreateAgentButton`, кнопка «↺ Новый файл» (при `mimModule`), `ThemeToggle`. Добавить в шапку ссылку `Все сценарии` на `/` (видна при `step === 0`, т.к. лого больше не ведёт на `/`). После замены `useRouter` в файле больше не используется — удалить импорт и вызов (использовался только в `onClick` лого, строка 65).
  - Files: `app/playground/playground-content.tsx`
  - **LOGGING:** нет (статическая разметка)

### Phase 3: Верификация

- [x] Task 5: Проверка.
  - `mise exec -- pnpm typecheck && mise exec -- pnpm lint && mise exec -- pnpm build`
  - Мобильный смоук на `375×667` (headless Chromium, `isMobile`): на `/`, `/[slug]?step=chat`, `/[slug]?step=processing`, `/playground` — клик по лого открывает `mimikkai.ru`; после `window.scrollTo(0, scrollHeight)` шапка остаётся в вьюпорте (`header.getBoundingClientRect().top === 0`); на `/playground` при `step === 0` ссылка «Все сценарии» ведёт на `/`
  - Проверить, что `CreateAgentButton` в шапке не сломан на десктопе
  - Files: нет (проверка)
