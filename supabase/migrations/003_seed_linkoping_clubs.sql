-- BRIEF-DB-001: Seed 5 Linköpings-föreningar (matches mock-data.ts)

insert into public.clubs (name, slug, description, city, website, contact_email) values
  (
    'Linköpings HC',
    'linkopings-hc',
    'Hockeyklubb i SHL. Matcher på Saab Arena. Välkommen till en av Sveriges mest engagerade hockeyfamiljer.',
    'Linköping',
    'https://lhf.se',
    'info@lhf.se'
  ),
  (
    'Landeryds Golfklubb',
    'landeryds-gk',
    'En av Östergötlands största golfklubbar med två 18-hålsbanor strax utanför Linköping. Öppet för alla åldrar och nivåer.',
    'Linköping',
    'https://landerydsgk.se',
    'kansli@landerydsgk.se'
  ),
  (
    'IFK Linköping',
    'ifk-linkoping',
    'Fotbollsklubb med herr- och damlag från ungdom till senior. Hemmaplan Linköping Arena.',
    'Linköping',
    'https://ifklinkoping.se',
    null
  ),
  (
    'BK Derby',
    'bk-derby',
    'Basketklubb för alla åldrar. Träningar på Stångebro sporthall. Nybörjare välkomna.',
    'Linköping',
    null,
    'info@bkderby.se'
  ),
  (
    'Linköping Triathlon Club',
    'linkoping-tri',
    'Triathlonklubb med gemensamma träningar i simning, cykling och löpning. Från nybörjare till Ironman-nivå.',
    'Linköping',
    null,
    'kontakt@linkopingtri.se'
  )
on conflict (slug) do nothing;

-- Link clubs to sports
insert into public.club_sports (club_id, sport_id)
select c.id, s.id from public.clubs c, public.sports s
where (c.slug = 'linkopings-hc' and s.slug in ('hockey', 'ishockey'))
   or (c.slug = 'landeryds-gk' and s.slug = 'golf')
   or (c.slug = 'ifk-linkoping' and s.slug = 'fotboll')
   or (c.slug = 'bk-derby' and s.slug = 'basket')
   or (c.slug = 'linkoping-tri' and s.slug in ('triathlon', 'lopning', 'simning', 'cykling'))
on conflict do nothing;
