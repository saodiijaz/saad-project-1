import { supabase, hasSupabaseConfig } from './supabase'
import { mockClubs } from './mock-data'
import { Club } from './types'

export async function getClubs(): Promise<Club[]> {
  if (!hasSupabaseConfig || !supabase) return mockClubs
  const { data, error } = await supabase.from('clubs').select('*').order('name')
  if (error) throw error
  return (data ?? []) as Club[]
}

export async function getClubById(id: string): Promise<Club | null> {
  if (!hasSupabaseConfig || !supabase) {
    return mockClubs.find(c => c.id === id) ?? null
  }
  const { data, error } = await supabase.from('clubs').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return (data as Club) ?? null
}
