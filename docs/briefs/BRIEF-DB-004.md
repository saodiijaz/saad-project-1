# BRIEF-DB-004: Vänsystem — databas-schema

## Mål
Skapa `friendships`-tabellen som stödjer vänförfrågningar (pending → accepted/declined) och bidirectional vänskap.

## Kontext
- MVP: enkel vänförfrågan (requested by X → accepted/declined by Y)
- När accepterad = bilateral vänskap (båda ser varandra som vän)
- Senare briefs (UI-010) bygger UI ovanpå detta

## Berörda filer
- `supabase/migrations/009_friends_schema.sql` — ny

## Steg

Skapa `supabase/migrations/009_friends_schema.sql`:

```sql
-- BRIEF-DB-004: Friends schema

create table public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.users(id) on delete cascade,
  addressee_id uuid not null references public.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'blocked')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  constraint friendship_no_self check (requester_id != addressee_id),
  constraint friendship_unique unique (requester_id, addressee_id)
);

alter table public.friendships enable row level security;

create index friendships_requester_idx on public.friendships(requester_id);
create index friendships_addressee_idx on public.friendships(addressee_id);
create index friendships_status_idx on public.friendships(status);

-- Users can see friendships they're part of
create policy "Users see own friendships"
  on public.friendships for select
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- Users can send friend requests (as requester)
create policy "Users can send friend requests"
  on public.friendships for insert
  with check (auth.uid() = requester_id and status = 'pending');

-- Only addressee can update (accept/decline) their pending requests
create policy "Addressee can respond to requests"
  on public.friendships for update
  using (auth.uid() = addressee_id)
  with check (auth.uid() = addressee_id);

-- Either party can delete (unfriend / cancel request)
create policy "Users can delete own friendships"
  on public.friendships for delete
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- Helper: auto-fill responded_at
create or replace function public.friendship_respond_trigger()
returns trigger language plpgsql as $$
begin
  if new.status != old.status and new.status in ('accepted', 'declined') then
    new.responded_at := now();
  end if;
  return new;
end;
$$;

create trigger friendship_respond
  before update on public.friendships
  for each row execute function public.friendship_respond_trigger();
```

## Verifiering
- [ ] Fil finns som `supabase/migrations/009_friends_schema.sql`
- [ ] `pnpm typecheck` grönt (ingen TS-påverkan)

## Anti-patterns
- Spara INTE bilateral vänskap som två rader — använd en rad med requester/addressee
- Tillåt INTE att user skickar friend request till sig själv (constraint `friendship_no_self`)

## Commit
`BRIEF-DB-004: Friendships schema`

## Rollback
```bash
git rm supabase/migrations/009_friends_schema.sql
git commit -m "Rollback BRIEF-DB-004"
```
