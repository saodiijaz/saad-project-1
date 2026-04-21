export type Club = {
  id: string
  name: string
  slug: string
  description: string
  logo_url: string | null
  cover_url: string | null
  city: string
  website: string | null
  contact_email: string | null
  sports: string[]
  created_at: string
  /** populated by getClubs() so Discover can sort by popularity */
  follower_count?: number
}

export type ClubPost = {
  id: string
  club_id: string
  title: string
  body: string
  image_url: string | null
  event_at: string | null
  location: string | null
  created_at: string
}
