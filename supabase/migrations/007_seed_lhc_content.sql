-- BRIEF-DB-002: Seed LHC posts

-- Seed 3 posts for LHC
insert into public.club_posts (club_id, title, body, event_at, location)
select c.id, 'Hemmamatch mot Frölunda',
  'På lördag 19:00 tar vi emot Frölunda i Saab Arena. Biljetter via vår hemsida.',
  now() + interval '3 days', 'Saab Arena, Linköping'
from public.clubs c where c.slug = 'linkopings-hc'
on conflict do nothing;

insert into public.club_posts (club_id, title, body, event_at, location)
select c.id, 'Öppen träning på onsdag',
  'Nästa onsdag kl 17-18:30 har vi öppen träning. Kom och kolla in laget.',
  now() + interval '7 days', 'Saab Arena, Linköping'
from public.clubs c where c.slug = 'linkopings-hc'
on conflict do nothing;

insert into public.club_posts (club_id, title, body)
select c.id, 'Landslagsuttagning',
  'Vi gratulerar vår center som blev uttagen till Tre Kronor inför VM.'
from public.clubs c where c.slug = 'linkopings-hc'
on conflict do nothing;
