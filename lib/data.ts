import { supabase } from './supabase';
import type { Folder, Note, Tag, NoteLink, ActivityLog, Settings } from './supabase';

export type { Folder, Note, Tag, NoteLink, ActivityLog, Settings };

export async function getFolders(): Promise<Folder[]> {
  const { data, error } = await supabase.from('folders').select('*').order('name');
  if (error) throw error;
  return data || [];
}

export async function getFolderTree(): Promise<Folder[]> {
  const folders = await getFolders();
  const map = new Map<string, Folder & { children?: Folder[] }>();
  folders.forEach(f => map.set(f.id, { ...f, children: [] }));
  const roots: Folder[] = [];
  folders.forEach(f => {
    if (f.parent_id && map.has(f.parent_id)) {
      map.get(f.parent_id)!.children!.push(map.get(f.id)!);
    } else {
      roots.push(map.get(f.id)!);
    }
  });
  return roots;
}

export async function getNotes(): Promise<Note[]> {
  const { data, error } = await supabase.from('notes').select('*, folder:folders(*), tags:tags(*)').order('updated_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getRecentNotes(limit = 10): Promise<Note[]> {
  const { data, error } = await supabase
    .from('notes')
    .select('*, folder:folders(*)')
    .order('updated_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function getNoteById(id: string): Promise<Note | null> {
  const { data, error } = await supabase
    .from('notes')
    .select('*, folder:folders(*), tags:tags(*)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getNotesByFolder(folderId: string): Promise<Note[]> {
  const { data, error } = await supabase
    .from('notes')
    .select('*, folder:folders(*)')
    .eq('folder_id', folderId)
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function searchNotes(query: string): Promise<Note[]> {
  const { data, error } = await supabase
    .from('notes')
    .select('*, folder:folders(*)')
    .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getTags(): Promise<Tag[]> {
  const { data, error } = await supabase.from('tags').select('*').order('name');
  if (error) throw error;
  return data || [];
}

export async function getNoteLinks(): Promise<NoteLink[]> {
  const { data, error } = await supabase.from('note_links').select('*');
  if (error) throw error;
  return data || [];
}

export async function getActivityLogs(days = 90): Promise<ActivityLog[]> {
  const { data, error } = await supabase
    .from('activity_logs')
    .select('*')
    .order('date', { ascending: false })
    .limit(days);
  if (error) throw error;
  return data || [];
}

export async function getSettings(): Promise<Settings | null> {
  const { data, error } = await supabase.from('settings').select('*').maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateSettings(id: string, updates: Partial<Settings>) {
  const { error } = await supabase.from('settings').update(updates).eq('id', id);
  if (error) throw error;
}

export async function createNote(note: { title: string; content?: string; folder_id?: string | null; word_count?: number }) {
  const { data, error } = await supabase.from('notes').insert(note).select().single();
  if (error) throw error;
  return data;
}

export async function updateNote(id: string, updates: Partial<Note>) {
  const { error } = await supabase.from('notes').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deleteNote(id: string) {
  const { error } = await supabase.from('notes').delete().eq('id', id);
  if (error) throw error;
}

export async function createFolder(folder: { name: string; parent_id?: string | null; color?: string }) {
  const { data, error } = await supabase.from('folders').insert(folder).select().single();
  if (error) throw error;
  return data;
}

export async function updateFolder(id: string, updates: Partial<Folder>) {
  const { error } = await supabase.from('folders').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deleteFolder(id: string) {
  const { error } = await supabase.from('folders').delete().eq('id', id);
  if (error) throw error;
}

export async function getStats() {
  const [{ count: notesCount }, { count: foldersCount }, { count: tagsCount }, { count: linksCount }] = await Promise.all([
    supabase.from('notes').select('*', { count: 'exact', head: true }),
    supabase.from('folders').select('*', { count: 'exact', head: true }),
    supabase.from('tags').select('*', { count: 'exact', head: true }),
    supabase.from('note_links').select('*', { count: 'exact', head: true }),
  ]);
  return {
    notes: notesCount || 0,
    folders: foldersCount || 0,
    tags: tagsCount || 0,
    links: linksCount || 0,
  };
}
