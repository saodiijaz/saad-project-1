-- BRIEF-UI-001: Make Zivar admin for Linköpings HC
-- Run this AFTER Zivar has signed in via magic link (so auth.users + public.users rows exist).
-- Replace 'DIN@EPOST.SE' with the email used to sign in.

insert into public.club_members (club_id, user_id, role)
select c.id, u.id, 'admin'
from public.clubs c, public.users u
where c.slug = 'linkopings-hc'
  and u.email = 'DIN@EPOST.SE'
on conflict (club_id, user_id) do update set role = 'admin';
