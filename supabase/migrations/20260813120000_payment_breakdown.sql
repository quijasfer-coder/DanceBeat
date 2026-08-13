-- Desglose del monto de un pago: precio base del plan vs. recargo por
-- pago tardío, capturado en el momento de renovar (servidor recalcula,
-- no confía en lo que mande el cliente) — para poder mostrarlo en el
-- recibo sin tener que adivinarlo después comparando contra el precio
-- actual del plan (que puede haber cambiado).

alter table public.payments
  add column base_amount_cents int,
  add column late_fee_cents int;

comment on column public.payments.base_amount_cents is
  'Precio del plan (o de la inscripción) sin recargo, al momento del pago.';
comment on column public.payments.late_fee_cents is
  'Recargo por pago tardío incluido en amount_cents, si aplicó. 0 o null si no hubo recargo.';
