import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

export type Folder = {
  id: string;
  name: string;
  parent_id: string | null;
  color: string | null;
  created_at: string;
  updated_at: string;
  children?: Folder[];
};

export type Note = {
  id: string;
  title: string;
  content: string;
  folder_id: string | null;
  word_count: number;
  created_at: string;
  updated_at: string;
  folder?: Folder;
  tags?: Tag[];
};

export type Tag = {
  id: string;
  name: string;
  color: string | null;
  created_at: string;
};

export type NoteLink = {
  id: string;
  source_note_id: string;
  target_note_id: string;
  link_text: string | null;
  created_at: string;
};

export type ActivityLog = {
  id: string;
  date: string;
  note_count: number;
  edit_count: number;
  created_at: string;
};

export type Settings = {
  id: string;
  theme: string;
  accent_color: string;
  editor_font: string;
  editor_font_size: number;
  auto_save: boolean;
  auto_save_interval: number;
  line_numbers: boolean;
  word_wrap: boolean;
  sidebar_density: string;
  graph_layout: string;
  graph_node_size: string;
  graph_node_color: string;
  graph_show_labels: boolean;
  graph_edge_style: string;
  graph_animation: boolean;
  sync_provider: string;
  sync_interval: string;
  created_at: string;
  updated_at: string;
};
