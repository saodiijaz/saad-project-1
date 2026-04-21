-- BRIEF-DB-001: Seed sport categories

insert into public.sports (name, slug) values
  ('Fotboll', 'fotboll'),
  ('Hockey', 'hockey'),
  ('Golf', 'golf'),
  ('Basket', 'basket'),
  ('Handboll', 'handboll'),
  ('Innebandy', 'innebandy'),
  ('Tennis', 'tennis'),
  ('Padel', 'padel'),
  ('Simning', 'simning'),
  ('Löpning', 'lopning'),
  ('Cykling', 'cykling'),
  ('Triathlon', 'triathlon'),
  ('Ishockey', 'ishockey'),
  ('Volleyboll', 'volleyboll'),
  ('Beachvolleyboll', 'beachvolleyboll'),
  ('Muay Thai', 'muay-thai'),
  ('Boxning', 'boxning'),
  ('Kampsport', 'kampsport'),
  ('Gym', 'gym'),
  ('Crossfit', 'crossfit')
on conflict (slug) do nothing;
