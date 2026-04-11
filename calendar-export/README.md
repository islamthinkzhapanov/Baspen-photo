# Журнал записи (Calendar) — экспорт из Syntony CRM

## Структура файлов

```
components/calendar/
  CalendarPage.tsx          — Главная страница (тулбар, навигация, переключение день/неделя)
  DayView.tsx               — Вид по дням (сетка специалистов, drag & drop)
  WeekView.tsx              — Вид по неделям (7 дней для одного специалиста)
  AppointmentBlock.tsx      — Блок записи в сетке (статус, цвет, цена, клиент)
  AppointmentSheet.tsx      — Модалка: создание/просмотр/редактирование записи
  AppointmentDetailsTab.tsx — Таб "О записи" в модалке просмотра
  EditContent.tsx           — Форма редактирования записи
  BreakSheetContent.tsx     — Модалка создания/просмотра/редактирования перерыва
  ServiceMultiSelect.tsx    — Мульти-выбор услуг с поиском и категориями
  PaymentDialog.tsx         — Диалог оплаты (Kaspi, наличные, карта, перевод)
  ClientMedicalCardTab.tsx  — Медицинская карта клиента (внутри записи)
  AppointmentPhotosTab.tsx  — Фото клиента (до/после)

hooks/
  useAppointments.ts     — CRUD записей + доступные слоты (React Query)
  useBreaks.ts           — CRUD перерывов
  useCalendarDay.ts      — Получение данных дня (специалисты, записи, перерывы)
  useCalendarWeek.ts     — Получение данных недели
  useCalendarThreeDays.ts — Режим 3 дней (когда один специалист)

types/
  calendar.ts            — TypeScript типы (SpecialistDayInfo, CalendarDayResponse, CalendarWeekResponse)

lib/
  time.ts                — timeToMinutes / minutesToTime
  pendingPrepayments.ts  — Глобальный Set для записей в процессе предоплаты
  validators/
    appointment.ts       — Zod-схемы валидации записей
    break.ts             — Zod-схемы валидации перерывов
```

## Зависимости (npm/pnpm)

```bash
pnpm add react react-dom next
pnpm add @tanstack/react-query
pnpm add date-fns
pnpm add zod
pnpm add lucide-react
pnpm add @heroicons/react
pnpm add @remixicon/react
pnpm add sonner            # тосты
pnpm add tailwindcss       # CSS
pnpm add clsx tailwind-merge  # утилита cn()
```

## Утилита cn()

```ts
// lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return amount.toLocaleString("ru-RU") + " ₸";
}
```

## UI компоненты, которые нужно заменить или создать

Эти компоненты импортируются из `@/components/tremor/` и `@/components/ui/`:

| Импорт | Что это | Замена |
|--------|---------|--------|
| `Dialog, DialogContent, DialogTitle, DialogClose, DialogHeader, DialogFooter` | Модальное окно | Radix Dialog или shadcn/ui Dialog |
| `Button` | Кнопка с `variant`, `isLoading`, `loadingText` | shadcn/ui Button + Loader |
| `Textarea` | Текстовое поле | Обычный `<textarea>` |
| `Label` | Лейбл | Обычный `<label>` |
| `Callout` | Инфо-блок | Обычный `<div>` с фоном |
| `Select, SelectTrigger, SelectValue, SelectContent, SelectItem` | Выпадающий список | Radix Select или shadcn/ui Select |
| `Popover, PopoverTrigger, PopoverContent` | Попап | Radix Popover или shadcn/ui Popover |
| `Calendar` | Виджет календаря | react-day-picker или shadcn/ui Calendar |
| `ChronoSelect` | Кастомный date picker | Любой date picker |
| `PhoneInput` | Ввод телефона с маской | react-phone-input или кастомный |

## Хуки, которые нужно предоставить

Эти хуки используются внутри компонентов, но НЕ входят в экспорт:

```ts
// hooks/usePermissions.ts — роли и разрешения
export function usePermissions() {
  return {
    isSpecialist: false,
    canDeleteAppointments: true,
    role: "owner" as string,
    userId: "current-user-id",
  };
}

// hooks/useServices.ts — CRUD услуг
export interface ServiceWithCategory {
  id: string;
  name: string;
  price: string;
  cost: string;
  durationMin: number;
  isActive: boolean;
  categoryId: string | null;
  // ...
}
export interface BundleWithItems {
  id: string;
  name: string;
  price: string;
  durationMin: number;
  isActive: boolean;
  items: Array<{ serviceId: string; service: ServiceWithCategory | null }>;
}
export function useServices() { /* GET /api/services */ }
export function useServiceCategories() { /* GET /api/service-categories */ }
export function useBundles() { /* GET /api/bundles */ }

// hooks/useClients.ts — поиск клиентов
export interface ClientSearchResult {
  id: string;
  fullName: string;
  phone: string | null;
  status: string;
}
export function useClientSearch(query: string) { /* GET /api/clients?search=query */ }
export function useClient(id: string) { /* GET /api/clients/:id */ }
export function useUpdateClient() { /* PUT /api/clients/:id */ }

// hooks/usePayments.ts — оплата
export function useCreatePayments() { /* POST /api/payments */ }
export function useAppointmentPayments(appointmentId: string) { /* GET /api/payments?appointment_id=:id */ }
export function useDeletePayments() { /* DELETE /api/payments?appointment_id=:id */ }

// hooks/useKaspiPayment.ts — Kaspi Pay (можно убрать если не нужен)
export function useCreateKaspiInvoice() { /* POST /api/kaspi/invoices */ }
export function useKaspiInvoiceStatus(id?: string, enabled?: boolean) { /* GET /api/kaspi/invoices/:id */ }
export function useCancelKaspiInvoice() { /* DELETE /api/kaspi/invoices/:id */ }
```

## API контракт (эндпоинты)

### Календарь

```
GET /api/calendar/day?date=2024-01-15
Response:
{
  "calendarStep": 30,               // шаг сетки в минутах
  "workingHoursStart": 9,           // начало рабочего дня (час)
  "workingHoursEnd": 21,            // конец рабочего дня (час)
  "specialists": [
    {
      "id": "uuid",
      "fullName": "Иванов Иван",
      "position": "Стоматолог",
      "avatarUrl": null,
      "isWorking": true,
      "workStart": "09:00",
      "workEnd": "18:00",
      "breakStart": "13:00",        // перерыв (nullable)
      "breakEnd": "14:00",
      "role": "specialist"
    }
  ],
  "appointments": [
    {
      "id": "uuid",
      "tenantId": "uuid",
      "clientId": "uuid",
      "specialistId": "uuid",
      "date": "2024-01-15",
      "startTime": "10:00",
      "endTime": "11:00",
      "status": "scheduled",         // scheduled | completed | no_show | awaiting_payment
      "discountPercent": "0",
      "discountAmount": "0",
      "totalPrice": "15000",
      "prepaymentAmount": "0",
      "cancelReason": null,
      "notes": null,
      "kaspiPending": false,
      "client": {
        "id": "uuid",
        "fullName": "Петрова Мария",
        "phone": "+77001234567",
        "status": "regular"          // new | regular | sleeping | vip | blocked
      },
      "specialist": {
        "id": "uuid",
        "fullName": "Иванов Иван",
        "avatarUrl": null
      },
      "services": [
        {
          "id": "uuid",
          "appointmentId": "uuid",
          "serviceId": "uuid",
          "name": "Чистка зубов",
          "price": "15000",
          "cost": "5000",
          "durationMin": 60
        }
      ]
    }
  ],
  "breaks": [
    {
      "id": "uuid",
      "specialistId": "uuid",
      "date": "2024-01-15",
      "startTime": "12:00",
      "endTime": "13:00",
      "reason": "Обед",
      "createdBy": "uuid"
    }
  ]
}

GET /api/calendar/week?date=2024-01-15&specialist_id=uuid
Response:
{
  "weekStart": "2024-01-13",
  "weekEnd": "2024-01-19",
  "calendarStep": 30,
  "workingHoursStart": 9,
  "workingHoursEnd": 21,
  "specialist": { "id": "uuid", "fullName": "Иванов Иван", "avatarUrl": null },
  "specialists": [
    { "id": "uuid", "fullName": "Иванов Иван" },
    { "id": "uuid", "fullName": "Сидоров Петр" }
  ],
  "days": [
    {
      "date": "2024-01-13",
      "dayOfWeek": 1,
      "isWorking": true,
      "workStart": "09:00",
      "workEnd": "18:00",
      "breakStart": null,
      "breakEnd": null,
      "appointments": [ /* Appointment[] */ ],
      "breaks": [ /* BreakEntry[] */ ]
    }
    // ... 7 дней
  ]
}
```

### Записи (Appointments)

```
GET  /api/appointments?date=2024-01-15&specialist_id=uuid
GET  /api/appointments/availability?specialist_id=uuid&date=2024-01-15&duration=60&exclude_appointment_id=uuid
     Response: { "slots": ["09:00", "09:30", "10:00", ...] }
POST /api/appointments
     Body: { clientId?, clientName?, clientPhone?, specialistId, date, startTime, services: [...], discountPercent, notes? }
     Response: Appointment & { prepayment?: { required: boolean, amount: number } }
PUT  /api/appointments/:id
     Body: { status?, date?, startTime?, endTime?, specialistId?, clientId?, services?, discountPercent?, notes?, cancelReason? }
DELETE /api/appointments/:id
```

### Перерывы (Breaks)

```
POST   /api/breaks
       Body: { specialistId, date, startTime, endTime, reason? }
PATCH  /api/breaks/:id
       Body: { startTime?, endTime?, reason? }
DELETE /api/breaks/:id
```

### Услуги

```
GET /api/services
    Response: ServiceWithCategory[]
GET /api/service-categories
    Response: ServiceCategory[]
GET /api/bundles
    Response: BundleWithItems[]
```

### Клиенты

```
GET /api/clients?search=query
    Response: ClientSearchResult[]
GET /api/clients/:id
    Response: Client (с полями medicalCard, photos, etc.)
PUT /api/clients/:id
    Body: { gender?, birthDate?, allergies?, ... }
```

### Оплата

```
POST /api/payments
     Body: { appointmentId, payments: [{ method, amount }], markCompleted?, isPrepayment? }
GET  /api/payments?appointment_id=uuid
     Response: Payment[]
DELETE /api/payments?appointment_id=uuid
```

## Как подключить

### 1. Скопируй файлы

```
your-project/src/
  components/calendar/    ← все из components/calendar/
  hooks/                  ← все из hooks/
  types/                  ← calendar.ts
  lib/                    ← time.ts, pendingPrepayments.ts
  lib/validators/         ← appointment.ts, break.ts
```

### 2. Создай страницу

```tsx
// app/calendar/page.tsx
import { Suspense } from "react";
import { CalendarPage } from "@/components/calendar/CalendarPage";

export default function Page() {
  return (
    <Suspense>
      <CalendarPage />
    </Suspense>
  );
}
```

### 3. Настрой QueryClientProvider

```tsx
// app/layout.tsx или providers.tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

export function Providers({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

### 4. Реализуй API эндпоинты

Создай бэкенд или API routes в Next.js, отвечающие контракту выше.

### 5. Замени UI компоненты

Замени импорты из `@/components/tremor/` на свои компоненты (shadcn/ui или любые другие).

## Что можно убрать

- **PaymentDialog.tsx** + **useKaspiPayment** — если не нужна интеграция с Kaspi Pay
- **ClientMedicalCardTab.tsx** — если не нужна медкарта
- **AppointmentPhotosTab.tsx** — если не нужны фото
- **Kaspi-related код** в AppointmentSheet.tsx (prepayment flow)
- **3-day mode** в DayView.tsx (авто-включается когда 1 специалист)
