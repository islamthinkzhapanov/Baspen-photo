import { z } from "zod";

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const appointmentServiceSchema = z.object({
  serviceId: z.string().min(1),
  name: z.string().min(1, "Service name is required"),
  price: z.number().min(0, "Price must be >= 0"),
  cost: z.number().min(0, "Cost must be >= 0"),
  durationMin: z.number().int().positive("Duration must be > 0"),
});

export const createAppointmentSchema = z.object({
  clientId: z.string().min(1).optional(),
  clientName: z.string().min(1).optional(),
  clientPhone: z.string().optional(),
  specialistId: z.string().uuid("Specialist is required"),
  date: z.string().regex(dateRegex, "Date must be YYYY-MM-DD"),
  startTime: z.string().regex(timeRegex, "Time must be HH:MM"),
  services: z
    .array(appointmentServiceSchema)
    .min(1, "At least one service is required"),
  discountPercent: z.number().min(0).max(100).optional().default(0),
  notes: z.string().optional(),
});

export const updateAppointmentSchema = z
  .object({
    status: z.enum(["scheduled", "completed", "no_show", "awaiting_payment"]).optional(),
    date: z.string().regex(dateRegex).optional(),
    startTime: z.string().regex(timeRegex).optional(),
    endTime: z.string().regex(timeRegex).optional(),
    specialistId: z.string().uuid().optional(),
    clientId: z.string().uuid().nullable().optional(),
    services: z.array(appointmentServiceSchema).min(1).optional(),
    discountPercent: z.number().min(0).max(100).optional(),
    notes: z.string().optional(),
    cancelReason: z.string().optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    { message: "At least one field must be provided" }
  );

export type AppointmentServiceInput = z.infer<typeof appointmentServiceSchema>;
export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>;
