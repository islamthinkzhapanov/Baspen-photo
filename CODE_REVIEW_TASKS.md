# Code Review: Baspen Photo — Таски для отдельных сессий

Каждый таск ниже — это отдельная задача которую можно скопировать и вставить в новое окно Claude Code.

---

## Phase 1: CRITICAL

### Таск 1: Auth на `/api/photos/[id]/process`
```
В файле src/app/api/photos/[id]/process/route.ts нет аутентификации — любой может вызвать POST и тригернуть пересоздание миниатюр для любого фото.

Добавь:
1. Вызов auth() в начале хендлера, если нет сессии → вернуть 401
2. Найти фото по id, получить его eventId
3. Вызвать getEventAccess(eventId, session.user.id) — если нет доступа → 403

Импорты: auth из @/lib/auth, getEventAccess из @/lib/event-auth
```

---

### Таск 2: Транзакции для bulk-delete фото
```
В файле src/app/api/events/[id]/photos/bulk-delete/route.ts строки 67-79 три операции идут без транзакции:
- delete faceEmbeddings
- delete photos  
- update events photoCount

Если update count упадёт — счётчик будет врать.

Оберни эти 3 операции в db.transaction(async (tx) => { ... }). Используй tx вместо db внутри транзакции. S3 удаление (строки 59-64) должно остаться ВНЕ транзакции (его нельзя откатить). Порядок: сначала DB транзакция, потом S3 удаление.
```

---

### Таск 3: Транзакции для создания фото и single delete
```
Два места где insert/delete фото и обновление счётчика идут без транзакции:

1. src/app/api/events/[id]/photos/route.ts POST хендлер — insert photo + update photoCount
2. src/app/api/photos/[id]/route.ts DELETE хендлер — delete faceEmbeddings + delete photo + update photoCount

Оберни каждую группу в db.transaction(async (tx) => { ... }). S3 операции оставь вне транзакции.
```

---

### Таск 4: Транзакция для принятия инвайта
```
В файле src/app/api/invite/accept/route.ts две операции идут без транзакции:
- update users (установить пароль, активировать)
- update inviteTokens (пометить как использованный)

Если второй update упадёт — токен можно использовать повторно.

Оберни обе операции в db.transaction(async (tx) => { ... }).
```

---

### Таск 5: Soft delete для аккаунтов пользователей
```
В src/app/api/user/profile/route.ts строки 74-89 DELETE мгновенно и безвозвратно удаляет пользователя + все каскадные данные.

Нужно:
1. В src/lib/db/schema.ts добавить в таблицу users колонку: deletedAt: timestamp("deleted_at", { mode: "date" })
2. Сгенерировать миграцию: pnpm drizzle-kit generate
3. В DELETE хендлере заменить db.delete(users) на db.update(users).set({ deletedAt: new Date() })
4. Добавить запись в auditLog: action "account_delete", entityType "user", entityId session.user.id
5. В src/lib/auth.ts в функции authorize — после получения пользователя из БД проверить: если user.deletedAt стоит → вернуть null (не пускать логин)

НЕ добавлять пока cron job на окончательное удаление — это отдельная задача.
```

---

## Phase 2: HIGH

### Таск 6: Проверка доступа к событию в `/api/upload`
```
В файле src/app/api/upload/route.ts любой залогиненный пользователь может генерить presigned URL для загрузки в чужие события — нет проверки что пользователь является участником события.

После строки 11 (проверка session) добавь:
1. import { getEventAccess } from "@/lib/event-auth"
2. const access = await getEventAccess(eventId, session.user.id)
3. if (!access.hasAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
```

---

### Таск 7: Валидация storagePath при регистрации фото
```
В файле src/app/api/events/[id]/photos/route.ts POST хендлер — клиент передаёт storagePath и сервер ему верит. Можно указать путь к фото из другого события.

Добавь валидацию storagePath перед insert:
- Путь должен соответствовать паттерну: events/${eventId}/originals/ + имя файла
- Regex: /^events\/EVENT_ID\/originals\/[a-zA-Z0-9_-]+\.[a-z]+$/  (подставить реальный eventId)
- Если не совпадает → вернуть 400 "Invalid storage path"

Также проверь что mimeType из allowedTypes: ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]
```

---

### Таск 8: Rate limiting
```
Нет ограничения на количество запросов ни на одном эндпоинте. Это позволяет спамить AWS Rekognition (поиск по лицу), email восстановления пароля, регистрацию и т.д.

1. Создай src/lib/rate-limit.ts — sliding window rate limiter на Redis:
   - Redis уже используется (ioredis), найди существующий клиент или создай новый
   - Функция: rateLimit(key: string, limit: number, windowSeconds: number) → { allowed: boolean, remaining: number }
   - Реализация через INCR + EXPIRE (простейшая, достаточна для наших масштабов)

2. Примени в этих файлах (добавить проверку в начало хендлера, до бизнес-логики):
   - src/app/api/auth/register/route.ts — 5/час на IP
   - src/app/api/auth/forgot-password/route.ts — 3/15мин на email
   - src/app/api/search/face/route.ts — 20/час на IP
   - src/app/api/search/number/route.ts — 60/мин на IP
   - src/app/api/camera/upload/route.ts — 200/час на API key (из заголовка Authorization)

IP брать из request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
При превышении → 429 с { error: "Too many requests", retryAfter: seconds }
```

---

### Таск 9: Ротация Resend API ключа
```
Это ручная задача, не код:
1. Проверь что .env.local в .gitignore: git check-ignore -v .env.local
2. Проверь что ключ не попал в git историю: git log --all -p -- .env.local | head -50
3. Если попал — напиши мне, надо будет чистить историю
4. Напомни мне зайти в https://resend.com/api-keys и ротировать ключ re_Wowxj56i_*
```

---

## Phase 3: MEDIUM

### Таск 10: Защита маршрутов на сервере (layout auth guards)
```
Сейчас страницы /admin/* и /dashboard/* рендерятся для всех — нет серверной проверки авторизации в layout файлах. API возвращает 403, но UI-оболочка админки показывается.

1. src/app/[locale]/(admin)/layout.tsx:
   - Добавить import { auth } from "@/lib/auth" и import { redirect } from "next/navigation"
   - В начале компонента: const session = await auth()
   - if (!session?.user || session.user.role !== "super_admin") redirect("/login")

2. src/app/[locale]/(dashboard)/layout.tsx:
   - Аналогично: const session = await auth()
   - if (!session?.user) redirect("/login")

Эти layout — серверные компоненты, поэтому auth() и redirect() работают напрямую.
```

---

### Таск 11: Error boundaries
```
Сейчас любая ошибка рендера компонента показывает белый экран. Нужны error.tsx файлы.

Создай три файла с одинаковым содержимым (но разными заголовками):
- src/app/[locale]/(admin)/error.tsx
- src/app/[locale]/(dashboard)/error.tsx  
- src/app/[locale]/(photographer)/error.tsx

Каждый — "use client" компонент, принимающий { error, reset }. Показывает:
- Заголовок "Произошла ошибка"
- Кнопка "Попробовать снова" (вызывает reset())
- console.error(error) для отладки
- Минимальный стиль через Tailwind, в стиле остального проекта
```

---

### Таск 12: API error handler wrapper
```
Большинство API роутов не обёрнуты в try/catch — при ошибке БД или S3 сервер падает с 500 и может показать стектрейс.

1. Создай src/lib/api-handler.ts:
   - Экспортируй функцию withHandler(handler) — обёртка для Next.js route handler
   - Внутри: try { return await handler(request, context) } catch (err) { console.error(err); return NextResponse.json({ error: "Internal server error" }, { status: 500 }) }

2. Примени ко всем API роутам. Начни с самых критичных:
   - src/app/api/events/[id]/photos/route.ts
   - src/app/api/events/[id]/photos/bulk-delete/route.ts
   - src/app/api/search/face/route.ts
   - src/app/api/search/number/route.ts
   - src/app/api/events/[id]/route.ts
   - src/app/api/upload/route.ts
   
   Потом все остальные в src/app/api/
```

---

### Таск 13: JWT profileCompleted + publish button fix
```
Две мелкие но важные правки:

1. src/lib/auth.ts — в jwt callback, ветка trigger === "update":
   Сейчас сервер верит клиенту что профиль заполнен. Замени на запрос к БД:
   - Получи user из таблицы users по token.id
   - token.profileCompleted = !!(user.phone && user.occupation)

2. src/components/event/EventDetailPage.tsx — кнопка publish/unpublish:
   Найди onClick с updateMutation.mutate({ isPublished: !event.isPublished })
   Добавь disabled={updateMutation.isPending} на эту кнопку — сейчас двойной клик отправляет 2 запроса.
```

---

### Таск 14: Серверная пагинация фото
```
GET /api/events/[id]/photos возвращает ВСЕ фото за раз. При 1000+ фото это будет тормозить.

1. src/app/api/events/[id]/photos/route.ts GET:
   - Добавить query params: page (default 1), limit (default 100, max 500)
   - Применить .limit(limit).offset((page - 1) * limit) к запросу
   - Отдельным запросом получить total count
   - Вернуть { photos, total, page, limit }

2. src/hooks/usePhotos.ts — useEventPhotos:
   - Добавить page в queryKey и queryFn
   - Добавить параметр page в хук

3. Компоненты которые используют useEventPhotos — добавить "Загрузить ещё" или пагинацию.
   Посмотри как это используется и выбери подходящий паттерн.
```

---

## Phase 4: LOW

### Таск 15: Типизация API ответов
```
Все хуки в src/hooks/ (usePhotos, useEvents, useAlbums, useSearch, useAdmin, useSponsors, useOrders) 
используют fetchJson который возвращает any. TypeScript не ловит ошибки в данных.

1. Создай типы в src/types/api.ts для всех API ответов (Event, Photo, Album, etc.)
   Посмотри что возвращают API роуты и создай matching интерфейсы.

2. В каждом хуке добавь generic к useQuery:
   useQuery<Photo[]>({ queryKey: [...], queryFn: ... })

3. Сделай fetchJson generic: async function fetchJson<T>(url, init?): Promise<T>

Не трогай логику — только типы.
```

---

### Таск 16: Единый ConfirmDialog + мелкие UI фиксы
```
1. Создай src/components/ui/ConfirmDialog.tsx — переиспользуемый диалог подтверждения.
   Посмотри какой UI kit используется в проекте (Radix? Tremor?) и сделай в том же стиле.
   Props: open, onOpenChange, title, description, confirmText, onConfirm, variant ("danger" | "default")

2. Замени все window.confirm() на ConfirmDialog:
   - Удаление альбома в EventDetailPage
   - Удаление события в EventsPage  
   - Удаление спонсора в SponsorsSection
   - Отзыв API ключа в ApiKeysPanel
   - Удаление события в admin EventsPage

3. В EventDetailPage — перенеси инициализацию settings state из render в useEffect
   (найди блок if (event && !settingsInitialized) с кучей setState вызовов)
```

---

### Таск 17: Env checks + DB pool + мелкие валидации
```
Несколько мелких но полезных правок:

1. src/lib/storage/s3.ts и src/lib/rekognition/client.ts:
   Заменить ! non-null assertions на runtime проверки:
   if (!process.env.S3_ACCESS_KEY) throw new Error("S3_ACCESS_KEY env var is required")
   
2. src/lib/db/index.ts:
   Добавить pool config: postgres(url, { max: 10, idle_timeout: 20, connect_timeout: 10 })

3. src/app/api/search/number/route.ts:
   Добавить валидацию: if (!number || number.length > 10 || !/^\d+$/.test(number)) return 400

4. src/components/gallery/Lightbox.tsx и src/components/gallery/PhotoDetailClient.tsx:
   Заменить пустые catch {} на toast.error("Не удалось скачать фото")

5. src/components/upload/PhotoUploadZone.tsx или useUploadPhotos:
   При частичной загрузке — показать toast с количеством/именами файлов которые не загрузились
```
