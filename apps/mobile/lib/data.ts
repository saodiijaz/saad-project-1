import { supabase, hasSupabaseConfig } from './supabase'
import { mockClubs } from './mock-data'
import { Club, ClubPost } from './types'

export async function getClubs(): Promise<Club[]> {
  if (!hasSupabaseConfig || !supabase) return mockClubs

  const { data, error } = await supabase
    .from('clubs')
    .select(`
      id, name, slug, description, logo_url, cover_url,
      city, website, contact_email, created_at,
      club_sports ( sports ( slug ) )
    `)
    .order('name')

  if (error) throw error

  return (data ?? []).map((c: any) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    logo_url: c.logo_url,
    cover_url: c.cover_url,
    city: c.city,
    website: c.website,
    contact_email: c.contact_email,
    created_at: c.created_at,
    sports: (c.club_sports ?? []).map((cs: any) => cs.sports?.slug).filter(Boolean),
  }))
}

export async function getClubById(id: string): Promise<Club | null> {
  if (!hasSupabaseConfig || !supabase) {
    return mockClubs.find(c => c.id === id) ?? null
  }

  const { data, error } = await supabase
    .from('clubs')
    .select(`
      id, name, slug, description, logo_url, cover_url,
      city, website, contact_email, created_at,
      club_sports ( sports ( slug ) )
    `)
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    description: data.description,
    logo_url: data.logo_url,
    cover_url: data.cover_url,
    city: data.city,
    website: data.website,
    contact_email: data.contact_email,
    created_at: data.created_at,
    sports: ((data as any).club_sports ?? []).map((cs: any) => cs.sports?.slug).filter(Boolean),
  }
}

// ---------- Follows ----------

export async function isFollowing(clubId: string): Promise<boolean> {
  if (!hasSupabaseConfig || !supabase) return false
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return false

  const { data } = await supabase
    .from('follows')
    .select('club_id')
    .eq('user_id', session.user.id)
    .eq('club_id', clubId)
    .maybeSingle()

  return !!data
}

export async function followClub(clubId: string): Promise<void> {
  if (!supabase) throw new Error('Not connected')
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Not logged in')

  const { error } = await supabase
    .from('follows')
    .insert({ user_id: session.user.id, club_id: clubId })

  if (error && error.code !== '23505') throw error
}

export async function unfollowClub(clubId: string): Promise<void> {
  if (!supabase) return
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return

  await supabase
    .from('follows')
    .delete()
    .eq('user_id', session.user.id)
    .eq('club_id', clubId)
}

export async function getFollowedClubs(): Promise<Club[]> {
  if (!hasSupabaseConfig || !supabase) return []
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return []

  const { data, error } = await supabase
    .from('follows')
    .select(`
      clubs (
        id, name, slug, description, logo_url, cover_url,
        city, website, contact_email, created_at,
        club_sports ( sports ( slug ) )
      )
    `)
    .eq('user_id', session.user.id)

  if (error) throw error
  return (data ?? []).map((row: any) => ({
    ...row.clubs,
    sports: (row.clubs.club_sports ?? []).map((cs: any) => cs.sports?.slug).filter(Boolean),
  }))
}

// ---------- Club posts ----------

export async function getClubPosts(clubId: string): Promise<ClubPost[]> {
  if (!hasSupabaseConfig || !supabase) return []
  const { data, error } = await supabase
    .from('club_posts').select('*').eq('club_id', clubId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as ClubPost[]
}

export async function isClubAdmin(clubId: string): Promise<boolean> {
  if (!supabase) return false
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return false
  const { data } = await supabase
    .from('club_members').select('role')
    .eq('user_id', session.user.id).eq('club_id', clubId).maybeSingle()
  return !!data
}

export async function createClubPost(p: {
  clubId: string; title: string; body: string;
  eventAt?: string; location?: string
}): Promise<void> {
  if (!supabase) throw new Error('Not connected')
  const { error } = await supabase.from('club_posts').insert({
    club_id: p.clubId, title: p.title, body: p.body,
    event_at: p.eventAt ?? null, location: p.location ?? null,
  })
  if (error) throw error
}

// ---------- Feed ----------

export type FeedPost = ClubPost & { club: { id: string; name: string; slug: string } }

// ---------- Events ----------

export type Event = {
  id: string
  club_id: string | null
  created_by: string
  title: string
  description: string
  location: string | null
  starts_at: string
  ends_at: string | null
  max_attendees: number | null
  is_public: boolean
  created_at: string
  club?: { id: string; name: string; slug: string }
}

export async function getUpcomingEvents(): Promise<Event[]> {
  if (!hasSupabaseConfig || !supabase) return []
  const { data, error } = await supabase
    .from('events')
    .select('*, clubs(id, name, slug)')
    .eq('is_public', true)
    .gte('starts_at', new Date().toISOString())
    .order('starts_at', { ascending: true })
    .limit(50)
  if (error) throw error
  return (data ?? []).map((e: any) => ({ ...e, club: e.clubs })) as Event[]
}

export async function getEventById(id: string): Promise<Event | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('events').select('*, clubs(id, name, slug)').eq('id', id).maybeSingle()
  if (error) throw error
  return data ? { ...data, club: (data as any).clubs } as Event : null
}

export async function isAttendingEvent(eventId: string): Promise<boolean> {
  if (!supabase) return false
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return false
  const { data } = await supabase
    .from('event_attendees').select('status')
    .eq('event_id', eventId).eq('user_id', session.user.id).maybeSingle()
  return !!data && data.status === 'going'
}

export async function joinEvent(eventId: string): Promise<void> {
  if (!supabase) throw new Error('Not connected')
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Not logged in')
  const { error } = await supabase
    .from('event_attendees')
    .upsert({ event_id: eventId, user_id: session.user.id, status: 'going' })
  if (error) throw error
}

export async function leaveEvent(eventId: string): Promise<void> {
  if (!supabase) return
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return
  await supabase.from('event_attendees').delete()
    .eq('event_id', eventId).eq('user_id', session.user.id)
}

export async function createEvent(p: {
  title: string; description: string; location?: string;
  startsAt: string; endsAt?: string; clubId?: string; maxAttendees?: number;
}): Promise<string> {
  if (!supabase) throw new Error('Not connected')
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Not logged in')
  const { data, error } = await supabase.from('events').insert({
    title: p.title, description: p.description,
    location: p.location ?? null, starts_at: p.startsAt,
    ends_at: p.endsAt ?? null, club_id: p.clubId ?? null,
    max_attendees: p.maxAttendees ?? null,
    created_by: session.user.id, is_public: true,
  }).select('id').single()
  if (error) throw error
  return data.id
}

export async function getMyAdminClubs(): Promise<Array<{id: string; name: string}>> {
  if (!supabase) return []
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return []
  const { data } = await supabase
    .from('club_members')
    .select('clubs(id, name)')
    .eq('user_id', session.user.id)
    .in('role', ['admin', 'editor'])
  return (data ?? []).map((r: any) => r.clubs)
}

// ---------- User profile ----------

export type UserProfile = {
  id: string
  email: string
  display_name: string | null
  avatar_url: string | null
  city: string | null
}

export async function getMyProfile(): Promise<UserProfile | null> {
  if (!supabase) return null
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null
  const { data, error } = await supabase
    .from('users').select('*').eq('id', session.user.id).maybeSingle()
  if (error) throw error
  return data as UserProfile
}

export async function updateMyProfile(p: { display_name?: string; city?: string }): Promise<void> {
  if (!supabase) return
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return
  const { error } = await supabase
    .from('users').update(p).eq('id', session.user.id)
  if (error) throw error
}

export async function uploadAvatar(uri: string): Promise<string> {
  if (!supabase) throw new Error('Not connected')
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Not logged in')

  const response = await fetch(uri)
  const blob = await response.blob()
  const ext = uri.split('.').pop()?.toLowerCase() ?? 'jpg'
  const path = `${session.user.id}/avatar.${ext}`

  const { error: uploadErr } = await supabase.storage
    .from('avatars')
    .upload(path, blob, { upsert: true, contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}` })
  if (uploadErr) throw uploadErr

  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  const publicUrl = `${data.publicUrl}?t=${Date.now()}` // cache-bust

  const { error: updErr } = await supabase
    .from('users').update({ avatar_url: publicUrl }).eq('id', session.user.id)
  if (updErr) throw updErr

  return publicUrl
}

export async function getFeed(): Promise<FeedPost[]> {
  if (!hasSupabaseConfig || !supabase) return []
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return []

  const { data: followData } = await supabase
    .from('follows').select('club_id').eq('user_id', session.user.id)
  const clubIds = (followData ?? []).map((f: any) => f.club_id)
  if (clubIds.length === 0) return []

  const { data, error } = await supabase
    .from('club_posts')
    .select('*, clubs(id, name, slug)')
    .in('club_id', clubIds)
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) throw error
  return (data ?? []).map((p: any) => ({ ...p, club: p.clubs })) as FeedPost[]
}
