# План: SEO-улучшения (title, мета-теги, robots, sitemap)

Branch: none
Created: 2026-06-11

## Settings
- Testing: no
- Logging: minimal
- Docs: no

## Research Context

Topic: SEO-улучшения для mimikkai-howto — нет `<title>`, нет description, нет OG-тегов, `lang="en"` вместо `"ru"`, нет robots.txt, нет sitemap.xml
Goal: Добавить корректные SEO-метаданные, чтобы вкладка браузера показывала заголовок, поисковики индексировали страницу, а шаринг в соцсетях работал
Constraints:
- Next.js App Router с `output: "export"` (статический экспорт) — robots.ts/sitemap.ts НЕ работают, нужны статические файлы в public/
- `page.tsx` — `"use client"`, metadata можно экспортировать только из серверных компонентов (layout.tsx)
- Весь UI на русском языке — lang должен быть "ru"
- Единственная страница (SPA с query-параметрами) — один набор метаданных

Decisions:
- metadata экспортируем из `app/layout.tsx` (серверный корневой компонент)
- robots.txt и sitemap.xml — статические файлы в `public/`
- favicon уже есть в `app/favicon.ico` — Next.js подхватывает автоматически

## Commit Plan
- **Commit 1** (после всех задач): `fix: add SEO metadata, robots.txt, sitemap.xml`

## Tasks

### Phase 1: Метаданные в layout.tsx

- [x] Task 1: Добавить `export const metadata` в `app/layout.tsx`
  - Исправить `lang="en"` → `lang="ru"` на `<html>`
  - Добавить `export const metadata: Metadata` со следующими полями:
    - `title`: "MimikkAi — Интерактивное демо ИИ-агентов"
    - `description`: "Посмотрите, как ИИ-агенты MimikkAi обрабатывают заявки, ищут товары, заполняют карточки на маркетплейсах и отвечают на тикеты. Выберите сценарий и наблюдайте за работой агента в реальном времени."
    - `keywords`: ["ИИ-агент", "автоматизация", "MimikkAi", "демо", "чат-бот", "обработка заявок", "маркетплейс"]
    - `openGraph.title`: "MimikkAi — Интерактивное демо ИИ-агентов"
    - `openGraph.description`: та же что и description
    - `openGraph.url`: "https://howto.mimikkai.ru"
    - `openGraph.siteName`: "MimikkAi"
    - `openGraph.locale`: "ru_RU"
    - `openGraph.type`: "website"
    - `icons.icon`: "/favicon.ico"
    - `robots`: { index: true, follow: true }
    - `alternates.canonical`: "https://howto.mimikkai.ru"
  - Files: `app/layout.tsx`
  - **LOGGING:** нет (статический конфиг)

### Phase 2: Статические SEO-файлы

- [x] Task 2: Создать `public/robots.txt`
  ```
  User-agent: *
  Allow: /
  Sitemap: https://howto.mimikkai.ru/sitemap.xml
  ```
  - Files: `public/robots.txt`

- [x] Task 3: Создать `public/sitemap.xml`
  ```xml
  <?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
      <loc>https://howto.mimikkai.ru</loc>
      <changefreq>weekly</changefreq>
      <priority>1.0</priority>
    </url>
  </urlset>
  ```
  - Files: `public/sitemap.xml`

### Phase 3: Верификация

- [x] Task 4: Верификация — `pnpm build` и проверка HTML
  - Запустить `pnpm build`
  - Проверить что `out/index.html` содержит `<title>`, `<meta name="description">`, `og:*` теги, `<link rel="canonical">`, `<html lang="ru">`
  - Проверить что `out/robots.txt` и `out/sitemap.xml` скопированы из public/
  - Files: нет (проверка сборки)