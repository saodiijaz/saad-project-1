-- Migration 014 — private events support
-- Lägger till event_invites-tabell + uppdaterar RLS på events så att
-- creator + inbjudna kan läsa privata events. Publika events behåller
-- öppen läsbehörighet.
-- Idempotent.

create table if not exists event_invites (
  event_id uuid not null references public.events(id) on delete cascade,
  invitee_id uuid not null references auth.users(id) on delete cascade,
  invited_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  primary key (event_id, invitee_id)
);

create index if not exists event_invites_invitee_idx on event_invites(invitee_id);

alter table event_invites enable row level security;

drop policy if exists "event_invites_read" on event_invites;
create policy "event_invites_read" on event_invites for select
  using (
    invitee_id = auth.uid()
    or exists (
      select 1 from public.events
      where id = event_invites.event_id and created_by = auth.uid()
    )
  );

drop policy if exists "event_invites_insert" on event_invites;
create policy "event_invites_insert" on event_invites for insert
  with check (
    invited_by = auth.uid()
    and exists (
      select 1 from public.events
      where id = event_invites.event_id and created_by = auth.uid()
    )
  );

drop policy if exists "event_invites_delete" on event_invites;
create policy "event_invites_delete" on event_invites for delete
  using (
    exists (
      select 1 from public.events
      where id = event_invites.event_id and created_by = auth.uid()
    )
  );

-- Uppdatera events-läspolicy: publika events OCH creator/inbjudna
drop policy if exists "Anyone can read public events" on public.events;
drop policy if exists "events_read_policy" on public.events;
create policy "events_read_policy" on public.events for select
  using (
    is_public = true
    or created_by = auth.uid()
    or exists (
      select 1 from event_invites
      where event_id = events.id and invitee_id = auth.uid()
    )
  );

-- Uppdatera event_attendees-läspolicy: attendees av public + privata man är creator/inbjuden för
drop policy if exists "Anyone can read attendees of public events" on public.event_attendees;
drop policy if exists "event_attendees_read_policy" on public.event_attendees;
create policy "event_attendees_read_policy" on public.event_attendees for select
  using (
    exists (
      select 1 from public.events e
      where e.id = event_attendees.event_id
        and (
          e.is_public = true
          or e.created_by = auth.uid()
          or exists (
            select 1 from event_invites
            where event_id = e.id and invitee_id = auth.uid()
          )
        )
    )
  );
