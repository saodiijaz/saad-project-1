import { supabase } from './supabase'

export type Badge = {
  id: string
  emoji: string
  label: string
  description: string
  earned: boolean
}

/**
 * Compute the set of badges for the current user from their
 * activity counts across friendships, likes, comments, follows,
 * and club admin roles. No new tables required.
 */
export async function getMyBadges(): Promise<Badge[]> {
  const base: Omit<Badge, 'earned'>[] = [
    { id: 'rookie', emoji: '🆕', label: 'Nykomling', description: 'Välkommen till SportMeet' },
    { id: 'social', emoji: '👋', label: 'Social', description: '3+ vänner' },
    { id: 'active', emoji: '❤️', label: 'Aktiv', description: '5+ likes givna' },
    { id: 'talker', emoji: '💬', label: 'Snackar', description: '3+ kommentarer' },
    { id: 'reader', emoji: '📣', label: 'Påläst', description: 'Följer 5+ föreningar' },
    { id: 'founder', emoji: '🏆', label: 'Grundare', description: 'Admin för en förening' },
  ]

  if (!supabase) {
    return base.map(b => ({ ...b, earned: false }))
  }
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return base.map(b => ({ ...b, earned: false }))
  }
  const uid = session.user.id

  const [
    friendsRes, likesRes, commentsRes, followsRes, adminRes,
  ] = await Promise.all([
    supabase.from('friendships')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'accepted')
      .or(`requester_id.eq.${uid},addressee_id.eq.${uid}`),
    supabase.from('post_likes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', uid),
    supabase.from('post_comments')
      .select('*', { count: 'exact', head: true })
      .eq('author_id', uid),
    supabase.from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', uid),
    supabase.from('club_members')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', uid)
      .in('role', ['admin', 'editor']),
  ])

  const friends = friendsRes.count ?? 0
  const likes = likesRes.count ?? 0
  const comments = commentsRes.count ?? 0
  const follows = followsRes.count ?? 0
  const admin = adminRes.count ?? 0

  const earnedMap: Record<string, boolean> = {
    rookie: true,
    social: friends >= 3,
    active: likes >= 5,
    talker: comments >= 3,
    reader: follows >= 5,
    founder: admin >= 1,
  }

  return base.map(b => ({ ...b, earned: earnedMap[b.id] ?? false }))
}
