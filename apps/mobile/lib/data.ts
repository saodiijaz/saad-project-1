import { supabase, hasSupabaseConfig } from './supabase'
import { mockClubs } from './mock-data'
import { Club, ClubPost } from './types'
import { haversineKm } from './geo'

export type ClubSort = 'popular' | 'newest' | 'alpha' | 'nearby'

export async function getClubs(
  sort: ClubSort = 'alpha',
  userLat?: number,
  userLng?: number,
): Promise<Club[]> {
  if (!hasSupabaseConfig || !supabase) return mockClubs

  // Hämta klubbar + följar-rader. Vi aggregerar följarantalet i JS eftersom
  // Supabase REST inte stödjer GROUP BY direkt på joined tables.
  const [clubsRes, followsRes] = await Promise.all([
    supabase
      .from('clubs')
      .select(`
        id, name, slug, description, logo_url, cover_url,
        city, website, contact_email, created_at,
        cities ( latitude, longitude ),
        club_sports ( sports ( slug ) )
      `),
    supabase.from('follows').select('club_id'),
  ])

  if (clubsRes.error) throw clubsRes.error

  const followerCounts = new Map<string, number>()
  // any: follows-select returns minimal { club_id: string } rows
  for (const row of (followsRes.data ?? []) as any[]) {
    followerCounts.set(row.club_id, (followerCounts.get(row.club_id) ?? 0) + 1)
  }

  const clubs: Club[] = (clubsRes.data ?? []).map((c: any) => {
    const lat = c.cities?.latitude
    const lng = c.cities?.longitude
    let distance: number | undefined
    if (
      sort === 'nearby' &&
      typeof userLat === 'number' && typeof userLng === 'number' &&
      typeof lat === 'number' && typeof lng === 'number'
    ) {
      distance = haversineKm(userLat, userLng, lat, lng)
    }
    return {
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
      follower_count: followerCounts.get(c.id) ?? 0,
      distance_km: distance,
    }
  })

  if (sort === 'popular') {
    clubs.sort((a, b) => (b.follower_count ?? 0) - (a.follower_count ?? 0) || a.name.localeCompare(b.name))
  } else if (sort === 'newest') {
    clubs.sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))
  } else if (sort === 'nearby') {
    clubs.sort((a, b) => {
      const da = a.distance_km ?? Number.POSITIVE_INFINITY
      const db = b.distance_km ?? Number.POSITIVE_INFINITY
      return da - db
    })
  } else {
    clubs.sort((a, b) => a.name.localeCompare(b.name))
  }

  return clubs
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

// ---------- Club admin (update + assets) ----------

export async function updateClub(clubId: string, p: {
  name?: string; description?: string; website?: string;
  contact_email?: string; logo_url?: string; cover_url?: string;
}): Promise<void> {
  if (!supabase) throw new Error('Not connected')
  const { error } = await supabase.from('clubs').update(p).eq('id', clubId)
  if (error) throw error
}

export async function uploadClubAsset(
  clubId: string, kind: 'logo' | 'cover', uri: string
): Promise<string> {
  if (!supabase) throw new Error('Not connected')
  const response = await fetch(uri)
  const blob = await response.blob()
  const ext = uri.split('.').pop()?.toLowerCase() ?? 'jpg'
  const path = `${clubId}/${kind}.${ext}`
  const { error } = await supabase.storage
    .from('club-assets').upload(path, blob, { upsert: true, contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}` })
  if (error) throw error
  const { data } = supabase.storage.from('club-assets').getPublicUrl(path)
  return `${data.publicUrl}?t=${Date.now()}`
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
  isPublic?: boolean;
}): Promise<string> {
  if (!supabase) throw new Error('Not connected')
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Not logged in')
  const { data, error } = await supabase.from('events').insert({
    title: p.title, description: p.description,
    location: p.location ?? null, starts_at: p.startsAt,
    ends_at: p.endsAt ?? null, club_id: p.clubId ?? null,
    max_attendees: p.maxAttendees ?? null,
    created_by: session.user.id, is_public: p.isPublic ?? true,
  }).select('id').single()
  if (error) throw error
  return data.id
}

export async function isEventCreator(eventId: string): Promise<boolean> {
  if (!supabase) return false
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return false
  const { data } = await supabase
    .from('events').select('created_by').eq('id', eventId).maybeSingle()
  return !!data && (data as any).created_by === session.user.id
}

export async function inviteFriend(eventId: string, friendUserId: string): Promise<void> {
  if (!supabase) throw new Error('Not connected')
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Not logged in')
  const { error } = await supabase.from('event_invites').insert({
    event_id: eventId,
    invitee_id: friendUserId,
    invited_by: session.user.id,
  })
  if (error && error.code !== '23505') throw error
}

export async function uninviteFriend(eventId: string, friendUserId: string): Promise<void> {
  if (!supabase) return
  await supabase.from('event_invites').delete()
    .eq('event_id', eventId).eq('invitee_id', friendUserId)
}

export async function getEventInvitees(eventId: string): Promise<string[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('event_invites').select('invitee_id').eq('event_id', eventId)
  if (error) return []
  // any: minimal select returns { invitee_id: string }[]
  return (data ?? []).map((r: any) => r.invitee_id)
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

// ---------- Cities ----------

export type City = {
  id: string
  name: string
  region: string | null
  latitude: number
  longitude: number
}

export async function getCities(): Promise<City[]> {
  if (!supabase) return [
    { id: 'ljk', name: 'Linköping', region: 'Östergötland', latitude: 58.4108, longitude: 15.6214 }
  ]
  const { data, error } = await supabase
    .from('cities').select('*').order('name')
  if (error) throw error
  return (data ?? []) as City[]
}

// ---------- Map ----------

export type MapClub = {
  id: string
  name: string
  city: string
  latitude: number
  longitude: number
  sports: string[]
}

export async function getClubsForMap(): Promise<MapClub[]> {
  if (!hasSupabaseConfig || !supabase) return []
  const { data, error } = await supabase
    .from('clubs')
    .select(`
      id, name, city,
      cities ( latitude, longitude ),
      club_sports ( sports ( slug ) )
    `)
  if (error) throw error
  // any: Supabase nested-select response shape is not expressible in our
  // TS types — we map it manually below.
  return (data ?? [])
    .filter((c: any) => c.cities)
    .map((c: any) => ({
      id: c.id,
      name: c.name,
      city: c.city,
      latitude: c.cities.latitude,
      longitude: c.cities.longitude,
      sports: (c.club_sports ?? []).map((cs: any) => cs.sports?.slug).filter(Boolean),
    }))
}

// ---------- Friends ----------

export type FriendUser = {
  id: string
  display_name: string | null
  email: string
  avatar_url: string | null
  city: string | null
}

export type FriendRequest = {
  id: string
  from: FriendUser
  created_at: string
}

export async function searchUsers(query: string): Promise<FriendUser[]> {
  if (!supabase || query.trim().length < 2) return []
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return []
  const { data, error } = await supabase
    .from('users')
    .select('id, display_name, email, avatar_url, city')
    .or(`display_name.ilike.%${query}%,email.ilike.%${query}%`)
    .neq('id', session.user.id)
    .limit(20)
  if (error) throw error
  return (data ?? []) as FriendUser[]
}

export async function sendFriendRequest(addresseeId: string): Promise<void> {
  if (!supabase) throw new Error('Not connected')
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Not logged in')
  const { error } = await supabase.from('friendships').insert({
    requester_id: session.user.id,
    addressee_id: addresseeId,
    status: 'pending',
  })
  if (error && error.code !== '23505') throw error // ignore duplicate
}

export async function getFriends(): Promise<FriendUser[]> {
  if (!supabase) return []
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return []
  const uid = session.user.id

  const { data, error } = await supabase
    .from('friendships')
    .select('requester_id, addressee_id, requester:requester_id(id, display_name, email, avatar_url, city), addressee:addressee_id(id, display_name, email, avatar_url, city)')
    .eq('status', 'accepted')
    .or(`requester_id.eq.${uid},addressee_id.eq.${uid}`)
  if (error) throw error

  // any: Supabase select with nested joins returns a dynamic shape
  return (data ?? []).map((f: any) => (f.requester_id === uid ? f.addressee : f.requester))
}

export async function getPendingRequests(): Promise<FriendRequest[]> {
  if (!supabase) return []
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return []

  const { data, error } = await supabase
    .from('friendships')
    .select('id, created_at, requester:requester_id(id, display_name, email, avatar_url, city)')
    .eq('status', 'pending')
    .eq('addressee_id', session.user.id)
    .order('created_at', { ascending: false })
  if (error) throw error

  // any: Supabase select with nested joins returns a dynamic shape
  return (data ?? []).map((r: any) => ({ id: r.id, from: r.requester, created_at: r.created_at }))
}

export async function respondToFriendRequest(friendshipId: string, accept: boolean): Promise<void> {
  if (!supabase) return
  const { error } = await supabase
    .from('friendships')
    .update({ status: accept ? 'accepted' : 'declined' })
    .eq('id', friendshipId)
  if (error) throw error
}

export async function getClubFollowers(clubId: string): Promise<FriendUser[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('follows')
    .select('user:user_id(id, display_name, email, avatar_url, city)')
    .eq('club_id', clubId)
  if (error) throw error
  // any: Supabase nested select returns dynamic shape
  return (data ?? []).map((r: any) => r.user).filter(Boolean) as FriendUser[]
}

export type ClubStats = {
  followers: number
  posts: number
  likes: number
  comments: number
}

export async function getClubStats(clubId: string): Promise<ClubStats> {
  if (!supabase) return { followers: 0, posts: 0, likes: 0, comments: 0 }

  const [followersRes, postsRes] = await Promise.all([
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('club_id', clubId),
    supabase.from('club_posts').select('id').eq('club_id', clubId),
  ])

  // any: Supabase select returns minimal { id: string } rows
  const postIds = ((postsRes.data ?? []) as any[]).map(p => p.id)
  const postCount = postIds.length

  if (postCount === 0) {
    return {
      followers: followersRes.count ?? 0,
      posts: 0, likes: 0, comments: 0,
    }
  }

  const [likesRes, commentsRes] = await Promise.all([
    supabase.from('post_likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_type', 'club').in('post_id', postIds),
    supabase.from('post_comments')
      .select('*', { count: 'exact', head: true })
      .eq('post_type', 'club').in('post_id', postIds),
  ])

  return {
    followers: followersRes.count ?? 0,
    posts: postCount,
    likes: likesRes.count ?? 0,
    comments: commentsRes.count ?? 0,
  }
}

export async function getClubFollowerCount(clubId: string): Promise<number> {
  if (!supabase) return 0
  const { count } = await supabase
    .from('follows').select('*', { count: 'exact', head: true }).eq('club_id', clubId)
  return count ?? 0
}

export async function removeFriend(friendUserId: string): Promise<void> {
  if (!supabase) return
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return
  await supabase
    .from('friendships')
    .delete()
    .or(`and(requester_id.eq.${session.user.id},addressee_id.eq.${friendUserId}),and(requester_id.eq.${friendUserId},addressee_id.eq.${session.user.id})`)
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

// ---------- User posts ----------

export type UserPost = {
  id: string
  author_id: string
  body: string
  image_url: string | null
  created_at: string
  author?: { id: string; display_name: string | null; avatar_url: string | null; email: string }
}

// Unified feed item — diskrimineras på source
export type FeedItem =
  | { source: 'club'; post: FeedPost }
  | { source: 'user'; post: UserPost }

export async function uploadUserPostImage(uri: string): Promise<string> {
  if (!supabase) throw new Error('Not connected')
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Not logged in')
  const response = await fetch(uri)
  const blob = await response.blob()
  const ext = uri.split('.').pop()?.toLowerCase() ?? 'jpg'
  const path = `${session.user.id}/${Date.now()}.${ext}`
  const { error } = await supabase.storage
    .from('user-posts').upload(path, blob, { contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}` })
  if (error) throw error
  return supabase.storage.from('user-posts').getPublicUrl(path).data.publicUrl
}

export async function createUserPost(p: { body: string; imageUrl?: string }): Promise<void> {
  if (!supabase) throw new Error('Not connected')
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Not logged in')
  const { error } = await supabase.from('user_posts').insert({
    author_id: session.user.id,
    body: p.body,
    image_url: p.imageUrl ?? null,
  })
  if (error) throw error
}

export async function getUserPosts(limit = 50): Promise<UserPost[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('user_posts')
    .select('*, author:author_id(id, display_name, avatar_url, email)')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data ?? []) as UserPost[]
}

// ---------- Comments and likes ----------

export type PostType = 'club' | 'user'

export type Comment = {
  id: string
  post_type: PostType
  post_id: string
  author_id: string
  body: string
  created_at: string
  author?: { id: string; display_name: string | null; avatar_url: string | null; email: string }
}

export async function getComments(postType: PostType, postId: string): Promise<Comment[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('post_comments')
    .select('*, author:author_id(id, display_name, avatar_url, email)')
    .eq('post_type', postType).eq('post_id', postId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as Comment[]
}

export async function addComment(postType: PostType, postId: string, body: string): Promise<void> {
  if (!supabase) throw new Error('Not connected')
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Not logged in')
  const { error } = await supabase.from('post_comments').insert({
    post_type: postType, post_id: postId, author_id: session.user.id, body: body.trim(),
  })
  if (error) throw error
}

// ---------- Moderation ----------

export type ReportReason = 'spam' | 'harassment' | 'nudity' | 'violence' | 'other'

export async function reportPost(
  type: PostType, postId: string, reason: ReportReason, note?: string,
): Promise<void> {
  if (!supabase) throw new Error('Not connected')
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Not logged in')
  const { error } = await supabase.from('post_reports').insert({
    reporter_id: session.user.id,
    post_type: type,
    post_id: postId,
    reason,
    note: note ?? null,
  })
  // Tillåt re-rapport som "redan finns" — slussa det inte uppåt
  if (error && error.code !== '23505') throw error
}

export async function deleteComment(commentId: string): Promise<void> {
  if (!supabase) return
  await supabase.from('post_comments').delete().eq('id', commentId)
}

export async function getLikeState(postType: PostType, postId: string): Promise<{ liked: boolean; count: number }> {
  if (!supabase) return { liked: false, count: 0 }
  const { data: { session } } = await supabase.auth.getSession()
  const [likedRes, countRes] = await Promise.all([
    session
      ? supabase.from('post_likes').select('user_id').eq('post_type', postType).eq('post_id', postId).eq('user_id', session.user.id).maybeSingle()
      : Promise.resolve({ data: null } as { data: null }),
    supabase.from('post_likes').select('*', { count: 'exact', head: true }).eq('post_type', postType).eq('post_id', postId),
  ])
  return { liked: !!likedRes.data, count: countRes.count ?? 0 }
}

export async function toggleLike(postType: PostType, postId: string): Promise<boolean> {
  if (!supabase) throw new Error('Not connected')
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Not logged in')

  const { data: existing } = await supabase
    .from('post_likes').select('user_id')
    .eq('post_type', postType).eq('post_id', postId).eq('user_id', session.user.id).maybeSingle()

  if (existing) {
    await supabase.from('post_likes').delete()
      .eq('post_type', postType).eq('post_id', postId).eq('user_id', session.user.id)
    return false
  } else {
    await supabase.from('post_likes').insert({
      post_type: postType, post_id: postId, user_id: session.user.id,
    })
    return true
  }
}

export async function getCommentCount(postType: PostType, postId: string): Promise<number> {
  if (!supabase) return 0
  const { count } = await supabase.from('post_comments')
    .select('*', { count: 'exact', head: true })
    .eq('post_type', postType).eq('post_id', postId)
  return count ?? 0
}

// Blandad feed — club_posts (från följda) + user_posts (alla) — kronologiskt
export async function getMixedFeed(): Promise<FeedItem[]> {
  const [club, user] = await Promise.all([getFeed(), getUserPosts()])
  const items: FeedItem[] = [
    ...club.map(p => ({ source: 'club' as const, post: p })),
    ...user.map(p => ({ source: 'user' as const, post: p })),
  ]
  return items.sort((a, b) =>
    new Date(b.post.created_at).getTime() - new Date(a.post.created_at).getTime()
  )
}
