# Baspen Photo — Аналог Kadr.app

## Context

Kadr.app — платформа дистрибуции фотографий для мероприятий. Фотограф загружает снимки, система распознаёт лица, участник находит свои фото по селфи или стартовому номеру — без регистрации и приложений. Цель: создать полный аналог с нуля в `/Users/mobibrand/Documents/Baspen photo/` (пустой git-репозиторий).

### Бизнес-требования
- **Рынок**: все массовые мероприятия (спорт, корпоративы, концерты, фестивали, туризм)
- **Регион**: Казахстан (первичный), СНГ, международный
- **Языки**: RU (дефолт), KZ, EN — через `next-intl`
- **Хостинг**: self-hosted в Казахстане (данные не покидают страну). Провайдер TBD
- **Название**: рабочее — Baspen, финальное TBD
- **Дедлайн**: нет, делаем качественно
- **Дизайн**: есть макеты в Figma

### Монетизация (двойная модель)
- **Эксклюзив-пакет**: организатор покупает у платформы → продаёт фото сам, забирает 100% выручки
- **Без эксклюзива**: фотограф продаёт фото → комиссия платформе + организатору
- **Покупка участником**: поштучно (1 фото) или пакет "все мои фото" со скидкой
- **Платежи**: TBD (вероятно Kaspi Pay + международный эквайринг). Заложить абстракцию `PaymentProvider`

### Ролевая модель
- **Super Admin** (владелец платформы) — полная админ-панель: пользователи, события, финансы, тарифы
- **Owner** (организатор) — создаёт событие, управляет настройками, приглашает фотографов, брендинг, спонсоры
- **Photographer** — загружает фото (браузер + tethering API), управляет ценами (если без эксклюзива)
- **Viewer** (команда) — просмотр, базовая аналитика

### Дистрибуция участникам
- QR-код на мероприятии (генерация в дашборде)
- Ссылка для соцсетей / мессенджеров
- Виджет на сайте организатора
- (позже) SMS/WhatsApp рассылка

### UX участника
- Заходит по ссылке/QR → селфи/номер → мгновенные результаты
- Без регистрации, без приложения
- Фото публикуется сразу (без модерации)
- Шеринг с брендированной рамкой (лого события, спонсоры, дата)
- Уведомления — позже (пока только realtime в браузере)
- Масштаб: до 100 000+ фото на событие

### Преимущества над Kadr.app
- InsightFace (лучше для азиатских лиц vs AWS Rekognition)
- Данные в КЗ (compliance)
- Гибкая монетизация (эксклюзив-пакет + комиссионная модель)
- Брендированные рамки для шеринга

---

## Figma Design (страница Flow)

Figma file: `lxIG84nQsymXeHORHfegsl`

### Design System
- **Primary**: `#005FF9` (синий)
- **Text**: `#2C2D2E`
- **Background**: `#FFFFFF`
- **Success**: `#0DC268`
- **Border**: `rgba(0,16,61,0.12)` (default), `rgba(0,16,61,0.48)` (active)
- **Fonts**: SF Pro Display (headings, uppercase), Inter (body, 14-16px)
- **Кнопки**: pill shape (`border-radius: 50px`), primary filled / secondary outlined
- **Инпуты**: `border-radius: 4px`, label сверху
- **Темы**: Light + Dark

### Экраны (node IDs)

**Авторизация:**
- Login (split layout: фото + форма) — `18:6123`
- Login error state — `20:6205`
- Login filled — `21:6792`
- Success → ЛК — `21:7004`
- Password reset — `21:6115`
- New password — `21:6251`

**Поиск фото (participant-facing):**
- Search page (rainbow bg + центральная карточка) — `32:6277`
- Face camera (oval mask, capture button) — `32:6335`
- Number search (__ - __ - __ - __) — `32:6502`
- Result gallery (hero banner + masonry grid) — `32:6547`
- Result with H1 (date, title, photographer) — `107:6631`
- Lightbox portrait — `158:6004`
- Lightbox landscape (counter 3/84) — `164:6185`

**Мобильные (375px):**
- Search mobile — `70:6061`
- Number mobile — `70:7134`
- Result mobile — `107:6569`, `128:6038`
- Face mobile — `70:6857`

**Личный кабинет (dashboard):**
- Dashboard layout (sidebar + header) — `53:8863`
- Sidebar: Обучение, Проекты, Визитки, Платежи
- Header: Главное, FAQ, Контакты, Сотрудничество, язык, Войти

**Landing:**
- Login modal (телефон +7) — `15:14488`

### UX Flow (из Figma)
1. Участник заходит → Search page (2 кнопки: лицо / номер)
2. "Поиск по лицу" → Camera с овальной разметкой → снимок → результат
3. "Поиск по номеру" → ввод 4-секционного номера → результат
4. Result: hero-баннер + табы альбомов + masonry grid с download/like
5. Клик на фото → lightbox (стрелки, счётчик N/total)
6. Header result: лайк, шеринг, "Поиск по лицу", "Поиск по номеру", "Скачать всё"

---

## Tech Stack

| Слой | Технология |
|---|---|
| Frontend | Next.js 15 (App Router) + TypeScript + Tailwind CSS |
| i18n | next-intl (RU/KZ/EN) |
| Database | PostgreSQL + pgvector (self-hosted, не Supabase — для КЗ хостинга) |
| ORM | Drizzle ORM |
| State | TanStack Query |
| Auth | NextAuth.js v5 (email/password) |
| Face Recognition | CompreFace (Docker, InsightFace, 99.86% accuracy) |
| Client face detection | face-api.js (браузер) |
| Queue | BullMQ + Redis |
| Storage | MinIO (S3-compatible, self-hosted) |
| Realtime | Socket.io или SSE (self-hosted, без зависимости от Supabase) |
| Images | Sharp (thumbnails, watermarks, EXIF) |
| Payments | Абстракция PaymentProvider (Kaspi Pay / Stripe / TBD) |
| Race numbers | YOLOv4 + Tesseract OCR (Phase 5) |
| Deploy | Docker Compose → КЗ сервер (Nginx reverse proxy + SSL) |
| Package manager | pnpm |

---

## Database Schema (ключевые таблицы)

- **users** — все пользователи (email, role: super_admin/owner/photographer/viewer, payment_account_id)
- **subscription_plans** — тарифы платформы (Free/Pro/Enterprise, лимиты фото/событий)
- **user_subscriptions** — подписка пользователя на тариф
- **events** — мероприятия (slug, owner_id, branding JSONB, geofence, pricing_mode: exclusive/commission, settings)
- **event_members** — связь пользователей с событием (user_id, event_id, role: owner/photographer/viewer)
- **albums** — группировка фото внутри события
- **photos** — снимки (storage_path, thumbnail_path, watermarked_path, exif_data, processing_status, bib_numbers[])
- **face_embeddings** — вектора лиц `vector(512)`, bbox, confidence. IVFFlat index по event_id
- **participants** — анонимные сессии (selfie_embedding, bib_number, phone/email optional)
- **participant_matches** — кэш совпадений (participant_id, photo_id, similarity)
- **orders** + **order_items** — покупки фото (поштучно / пакет "все мои фото")
- **sponsor_blocks** — рекламные интеграции + данные для брендированной рамки шеринга
- **share_frames** — шаблоны рамок для шеринга в соцсети (лого, спонсоры, дата)

---

## Architecture

```
Photographer → Next.js UI → MinIO Storage (presigned URL upload)
                          → API route → BullMQ job → Worker:
                              1. Sharp: thumbnail + watermark
                              2. EXIF extraction
                              3. CompreFace: face detection → embeddings
                              4. pgvector: store embeddings
                              5. Match vs active participants
                              6. SSE/Socket.io → push to participant

Participant → /e/{slug} → selfie → face-api.js (browser) → API → CompreFace → pgvector similarity search → photo grid
```

### Инфраструктура (Docker Compose)

```
nginx (reverse proxy + SSL) → Next.js app (:3000)
                             → CompreFace (:8000)
                             → MinIO (:9000)
PostgreSQL + pgvector (:5432)
Redis (:6379)
BullMQ Worker (same codebase, отдельный процесс)
```

Всё крутится на одном сервере в КЗ. При росте — горизонтальное масштабирование workers.

---

## Project Structure

```
baspen-photo/
├── app/
│   ├── [locale]/
│   │   ├── (auth)/              # login, register
│   │   ├── (dashboard)/         # photographer/organizer dashboard
│   │   │   ├── events/          # CRUD events, photo management, analytics
│   │   │   ├── settings/        # user settings, payment onboarding
│   │   │   └── layout.tsx
│   │   ├── (admin)/             # super admin panel
│   │   │   ├── users/           # all users management
│   │   │   ├── events/          # all events overview
│   │   │   ├── finance/         # platform revenue, commissions
│   │   │   ├── plans/           # subscription plans management
│   │   │   └── layout.tsx
│   │   └── e/[slug]/            # public event page (participant)
│   ├── api/
│   │   ├── upload/              # presigned URL generation
│   │   ├── search/              # face search
│   │   ├── webhooks/            # payment webhooks
│   │   ├── camera/              # auto-upload API (tethering)
│   │   └── share/               # branded frame generation
│   └── embed/[slug]/            # embeddable widget
├── components/
│   ├── ui/                  # UI primitives
│   ├── upload/              # drag-drop zone, progress
│   ├── gallery/             # photo grid, lightbox, masonry
│   ├── selfie/              # camera capture, face detection
│   ├── share/               # branded frame overlay, social share buttons
│   ├── qr/                  # QR code generator for events
│   └── event/               # event cards, branding
├── lib/
│   ├── db/schema.ts         # Drizzle schema (pgvector columns)
│   ├── db/queries/          # typed query helpers
│   ├── storage/             # MinIO S3 client helpers
│   ├── compreface/client.ts # CompreFace REST client
│   ├── payments/            # PaymentProvider абстракция (Kaspi/Stripe/TBD)
│   └── utils/               # image.ts (Sharp), geo.ts (Haversine)
├── worker/
│   ├── index.ts             # BullMQ worker entry
│   └── jobs/                # process-photo, match-participants, watermark
├── messages/
│   ├── ru.json              # русский (дефолт)
│   ├── kz.json              # казахский
│   └── en.json              # английский
├── docker-compose.yml       # PostgreSQL, Redis, CompreFace, MinIO, Nginx
├── docker-compose.prod.yml  # production overrides
├── nginx/nginx.conf         # reverse proxy + SSL
└── drizzle.config.ts
```

---

## Phases (24 задачи, 6 фаз)

### Phase 1: Foundation (Tasks 1-4) — "Фотограф загружает, фото отображаются"

| # | Task | Описание |
|---|---|---|
| 1 | Project scaffolding | `pnpm create next-app`, Drizzle ORM, next-intl (RU/KZ/EN), Docker Compose (PostgreSQL+pgvector, Redis, CompreFace, MinIO), ESLint, структура папок |
| 2 | Auth + roles + users | NextAuth.js v5 (email/password). Роли: super_admin, owner, photographer, viewer. Таблица `users`, `subscription_plans`. Protected routes, layout дашборда |
| 3 | Events CRUD + team | Создание/редактирование событий, slug, `event_members` (приглашение фотографов/команды по email). QR-код генерация. Публичная страница `/[locale]/e/[slug]` |
| 4 | Photo upload + storage | Bulk drag-drop upload, presigned URLs → MinIO, thumbnail generation (Sharp), фото-грид на странице события. Без модерации — сразу публикуется |

### Phase 2: Face Recognition (Tasks 5-9) — "Участник находит себя по селфи"

| # | Task | Описание |
|---|---|---|
| 5 | CompreFace + processing queue | BullMQ worker: получает фото → Sharp thumbnails → CompreFace API → embeddings в pgvector. UI статуса обработки. Цель: 100K+ фото на событие |
| 6 | pgvector search | Drizzle custom column `vector(512)`, IVFFlat index, API route для similarity search с фильтром по event_id |
| 7 | Selfie capture + face search UI | Камера (`getUserMedia`), face-api.js валидация лица, отправка на API, masonry-grid результатов. Анонимная сессия (без регистрации) |
| 8 | Watermarking | Sharp overlay на preview-изображения. Конфиг watermark в настройках события |
| 9 | Photo detail + download | Lightbox, free download (если включено), OG-теги для шеринга |

### Phase 3: Realtime + UX (Tasks 10-14) — "Фото появляются в реальном времени"

| # | Task | Описание |
|---|---|---|
| 10 | Realtime matching | Worker матчит новые фото с активными participants. SSE push новых совпадений в браузер |
| 11 | Public page polish | Responsive masonry gallery, lazy loading, blur-up placeholders, album tabs, branding из JSONB |
| 12 | Branded share frames | Sharp: генерация фото с рамкой (лого события, спонсоры, дата). Кнопки "Поделиться в Instagram Stories / Telegram / WhatsApp" |
| 13 | Session persistence | localStorage + cookie. "Вернуться к своим фото" без повторного селфи |
| 14 | Geofencing | Browser Geolocation API + Haversine distance. Авто-показ события при нахождении в радиусе |

### Phase 4: Monetization (Tasks 15-18) — "Фотограф зарабатывает"

| # | Task | Описание |
|---|---|---|
| 15 | Payment provider + pricing | Абстракция PaymentProvider. Две модели: эксклюзив (орг платит платформе, продаёт сам, 100% себе) и комиссионная (фотограф продаёт, комиссия платформе + оргу) |
| 16 | Purchase flow | Покупка поштучно или пакет "все мои фото" со скидкой. Checkout → download tokens → оригинал без watermark |
| 17 | White-label + widget + sponsors | `<iframe>` embed code. Sponsor blocks на странице события. Кастомные домены |
| 18 | Dashboard analytics | Статистика: фото, поиски, участники, скачивания, доход. Recharts графики |

### Phase 5: Admin + Platform (Tasks 19-21) — "Управление платформой"

| # | Task | Описание |
|---|---|---|
| 19 | Super Admin панель | Все пользователи, все события, финансы платформы (доход от подписок + комиссии), управление тарифами |
| 20 | Subscription management | Тарифные планы (Free/Pro/Enterprise), лимиты (фото/событий/storage), страница биллинга для пользователей |
| 21 | Platform metrics + audit | Общая статистика (MAU, события/месяц, объём фото), аудит-лог действий |

### Phase 6: Advanced (Tasks 22-24) — "Масштаб и спорт"

| # | Task | Описание |
|---|---|---|
| 22 | Race bib number detection | Python microservice: YOLOv4 + Tesseract OCR. Поиск по стартовому номеру |
| 23 | Camera auto-upload API | REST API для tethering-софта / Lightroom плагина. API key auth |
| 24 | Performance + production | HNSW index (вместо IVFFlat), Nginx CDN caching, WebP/AVIF, горизонтальное масштабирование workers, docker-compose.prod.yml, SSL, backup strategy |

---

## Critical Files

- `lib/db/schema.ts` — Drizzle schema, pgvector columns, все таблицы
- `worker/jobs/process-photo.ts` — пайплайн обработки фото (сердце продукта)
- `lib/compreface/client.ts` — REST клиент CompreFace
- `lib/payments/provider.ts` — абстракция платежей (Kaspi/Stripe/TBD)
- `app/[locale]/e/[slug]/page.tsx` — публичная страница события (UX участника)
- `docker-compose.yml` — полная инфраструктура (PostgreSQL, Redis, CompreFace, MinIO, Nginx)
- `messages/ru.json`, `messages/kz.json`, `messages/en.json` — i18n

---

## Verification Plan

1. **Phase 1**: Создать событие → пригласить фотографа → загрузить 10 фото → увидеть thumbnails в галерее (на RU/KZ/EN)
2. **Phase 2**: Загрузить 100 фото → сделать селфи → получить свои фото с similarity > 0.55
3. **Phase 3**: Открыть страницу участника → фотограф загружает новое фото → оно появляется в реальном времени → поделиться с брендированной рамкой
4. **Phase 4**: Купить 1 фото → купить пакет "все мои" → скачать оригиналы без watermark
5. **Phase 5**: Super admin видит всех пользователей, финансы, может управлять тарифами
6. **Phase 6**: Загрузить спортивные фото → найти по номеру на нагруднике

---

## Open Questions (TBD)

- [ ] Хостинг-провайдер в КЗ (нужен Docker + желательно GPU для CompreFace)
- [ ] Конкретная платёжная система (Kaspi Pay API, Stripe, Halyk Pay, или несколько)
- [ ] Доменное имя (baspen.photo? baspen.kz?)
