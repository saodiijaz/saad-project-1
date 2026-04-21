import { supabase, hasSupabaseConfig } from './supabase'
import { mockClubs } from './mock-data'
import { Club } from './types'

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
