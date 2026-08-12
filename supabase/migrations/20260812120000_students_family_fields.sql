-- Campos de familia/documentación para el onboarding de alumnos:
-- CURP (PDF), contacto de emergencia, datos de mamá/papá y consentimiento
-- de fotos/video en actividades de la academia.

alter table public.students
  add column if not exists curp_pdf_path text,
  add column if not exists emergency_contact_name text,
  add column if not exists emergency_contact_phone text,
  add column if not exists mother_name text,
  add column if not exists mother_phone text,
  add column if not exists father_name text,
  add column if not exists father_phone text,
  add column if not exists photo_video_consent boolean not null default false,
  add column if not exists photo_video_consent_at timestamptz;

comment on column public.students.curp_pdf_path is
  'Path del PDF de la CURP dentro del bucket privado student-documents (no es una URL pública — hay que generar un signed URL para verlo).';
comment on column public.students.photo_video_consent is
  'true si el tutor aceptó la leyenda de autorización de fotos/video de la academia, publicables en redes sociales y sitio web.';
comment on column public.students.photo_video_consent_at is
  'Cuándo se marcó el consentimiento de fotos/video, para tener registro de cuándo se aceptó.';
