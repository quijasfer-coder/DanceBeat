// Tipos compartidos del dominio.
// Conforme construyamos el modelo de BD en Supabase, generamos tipos
// con `supabase gen types typescript` y los importamos aquí.

export type DanceLevel = "principiante" | "intermedio" | "avanzado" | "abierto";

export type UserRole = "student" | "teacher" | "admin";

export type BookingStatus =
  | "confirmed"
  | "cancelled"
  | "cancelled_late"
  | "attended"
  | "no_show";

export type SubscriptionStatus =
  | "active"
  | "past_due"
  | "cancelled"
  | "paused";

export type PlanCode =
  | "single_beat"
  | "pulse"
  | "rhythm"
  | "groove"
  | "flow"
  | "stage";
