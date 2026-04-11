/**
 * Типы для Calendar API ответов.
 * Ранее определялись в API route файлах — перенесены сюда после миграции на .NET бэкенд.
 */

export interface SpecialistDayInfo {
  id: string;
  fullName: string;
  position: string | null;
  avatarUrl: string | null;
  isWorking: boolean;
  workStart: string;
  workEnd: string;
  breakStart: string | null;
  breakEnd: string | null;
  role: string;
}

export interface CalendarDayResponse {
  date: string;
  calendarStep: number;
  workingHoursStart: number;
  workingHoursEnd: number;
  specialists: SpecialistDayInfo[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  appointments: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  breaks: any[];
}

export interface CalendarWeekDayInfo extends SpecialistDayInfo {
  date: string;
  dayOfWeek: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  appointments: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  breaks: any[];
}

export interface CalendarWeekResponse {
  weekStart: string;
  weekEnd: string;
  calendarStep: number;
  workingHoursStart: number;
  workingHoursEnd: number;
  specialist: { id: string; fullName: string; avatarUrl: string | null };
  specialists: Array<{ id: string; fullName: string }>;
  days: CalendarWeekDayInfo[];
}
