-- events y event_assignments solo tenían grants para authenticated; igual que
-- audition_applications, gallery_albums y enrollment_types, service_role
-- también necesita GRANT explícito (RLS no basta) o la service key tira
-- "permission denied".
grant select, insert, update, delete on public.events            to service_role;
grant select, insert, update, delete on public.event_assignments to service_role;
