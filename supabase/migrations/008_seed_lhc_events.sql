-- BRIEF-DB-003: Seed events for LHC
-- Kör manuellt efter migration 006 och 007

insert into public.events (club_id, created_by, title, description, location, starts_at, is_public)
select
  c.id,
  (select id from public.users where email ilike '%zivar%' limit 1),
  'Öppen träning — Hockeyskola',
  'Barn och ungdomar välkomna att prova på. Ingen förkunskap krävs, vi har utrustning att låna.',
  'Saab Arena, Linköping',
  now() + interval '5 days',
  true
from public.clubs c
where c.slug = 'linkopings-hc'
on conflict do nothing;

insert into public.events (club_id, created_by, title, description, location, starts_at, is_public)
select
  c.id,
  (select id from public.users where email ilike '%zivar%' limit 1),
  'Supporterträff inför VM',
  'Häng med oss och kolla öppningsmatchen i VM. Mat och dryck serveras.',
  'Saab Arena Lounge',
  now() + interval '10 days',
  true
from public.clubs c
where c.slug = 'linkopings-hc'
on conflict do nothing;
