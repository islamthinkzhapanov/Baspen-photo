import { z } from "zod";

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const createBreakSchema = z
  .object({
    specialistId: z.string().uuid("Specialist is required"),
    date: z.string().regex(dateRegex, "Date must be YYYY-MM-DD"),
    startTime: z.string().regex(timeRegex, "Time must be HH:MM"),
    endTime: z.string().regex(timeRegex, "Time must be HH:MM"),
    reason: z.string().max(200).optional(),
  })
  .refine((data) => data.endTime > data.startTime, {
    message: "End time must be after start time",
    path: ["endTime"],
  });

export const updateBreakSchema = z
  .object({
    startTime: z.string().regex(timeRegex).optional(),
    endTime: z.string().regex(timeRegex).optional(),
    reason: z.string().max(200).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  })
  .refine(
    (data) => {
      if (data.startTime && data.endTime) return data.endTime > data.startTime;
      return true;
    },
    { message: "End time must be after start time", path: ["endTime"] }
  );

export type CreateBreakInput = z.infer<typeof createBreakSchema>;
export type UpdateBreakInput = z.infer<typeof updateBreakSchema>;
