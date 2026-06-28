/*
# Note Management System v1.0 — Initial Schema

1. New Tables
- `folders` — Hierarchical folder tree with parent-child relationships
  - `id` (uuid, primary key)
  - `name` (text, not null)
  - `parent_id` (uuid, self-referencing FK, nullable for root)
  - `color` (text, nullable — for graph coloring)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

- `notes` — Markdown notes belonging to folders
  - `id` (uuid, primary key)
  - `title` (text, not null)
  - `content` (text, default empty)
  - `folder_id` (uuid, FK to folders)
  - `word_count` (int, default 0)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

- `tags` — Tag definitions
  - `id` (uuid, primary key)
  - `name` (text, unique, not null)
  - `color` (text, nullable)
  - `created_at` (timestamptz)

- `note_tags` — Many-to-many join between notes and tags
  - `note_id` (uuid, FK to notes)
  - `tag_id` (uuid, FK to tags)
  - Primary key on (note_id, tag_id)

- `note_links` — Internal wiki-style links between notes
  - `id` (uuid, primary key)
  - `source_note_id` (uuid, FK to notes)
  - `target_note_id` (uuid, FK to notes)
  - `link_text` (text, nullable — display text override)
  - `created_at` (timestamptz)

- `activity_logs` — Daily activity for heatmap visualization
  - `id` (uuid, primary key)
  - `date` (date, not null, unique)
  - `note_count` (int, default 0)
  - `edit_count` (int, default 0)
  - `created_at` (timestamptz)

- `settings` — User application preferences (single-row table)
  - `id` (uuid, primary key, default single row)
  - `theme` (text, default 'dark')
  - `accent_color` (text, default 'blue')
  - `editor_font` (text, default 'Inter')
  - `editor_font_size` (int, default 14)
  - `auto_save` (boolean, default true)
  - `auto_save_interval` (int, default 5)
  - `line_numbers` (boolean, default true)
  - `word_wrap` (boolean, default true)
  - `sidebar_density` (text, default 'comfortable')
  - `graph_layout` (text, default 'force-directed')
  - `graph_node_size` (text, default 'by-connections')
  - `graph_node_color` (text, default 'by-folder')
  - `graph_show_labels` (boolean, default true)
  - `graph_edge_style` (text, default 'curved')
  - `graph_animation` (boolean, default true)
  - `sync_provider` (text, default 'none')
  - `sync_interval` (text, default 'manual')
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

2. Security
- Enable RLS on all tables.
- Single-tenant app (no sign-in screen), so policies allow anon + authenticated CRUD.
*/

-- Folders table
CREATE TABLE IF NOT EXISTS folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  parent_id uuid REFERENCES folders(id) ON DELETE CASCADE,
  color text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Notes table
CREATE TABLE IF NOT EXISTS notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  folder_id uuid REFERENCES folders(id) ON DELETE SET NULL,
  word_count int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tags table
CREATE TABLE IF NOT EXISTS tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  color text,
  created_at timestamptz DEFAULT now()
);

-- Note tags join table
CREATE TABLE IF NOT EXISTS note_tags (
  note_id uuid REFERENCES notes(id) ON DELETE CASCADE,
  tag_id uuid REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (note_id, tag_id)
);

-- Note links table
CREATE TABLE IF NOT EXISTS note_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_note_id uuid REFERENCES notes(id) ON DELETE CASCADE,
  target_note_id uuid REFERENCES notes(id) ON DELETE CASCADE,
  link_text text,
  created_at timestamptz DEFAULT now()
);

-- Activity logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL UNIQUE,
  note_count int NOT NULL DEFAULT 0,
  edit_count int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  theme text NOT NULL DEFAULT 'dark',
  accent_color text NOT NULL DEFAULT 'blue',
  editor_font text NOT NULL DEFAULT 'Inter',
  editor_font_size int NOT NULL DEFAULT 14,
  auto_save boolean NOT NULL DEFAULT true,
  auto_save_interval int NOT NULL DEFAULT 5,
  line_numbers boolean NOT NULL DEFAULT true,
  word_wrap boolean NOT NULL DEFAULT true,
  sidebar_density text NOT NULL DEFAULT 'comfortable',
  graph_layout text NOT NULL DEFAULT 'force-directed',
  graph_node_size text NOT NULL DEFAULT 'by-connections',
  graph_node_color text NOT NULL DEFAULT 'by-folder',
  graph_show_labels boolean NOT NULL DEFAULT true,
  graph_edge_style text NOT NULL DEFAULT 'curved',
  graph_animation boolean NOT NULL DEFAULT true,
  sync_provider text NOT NULL DEFAULT 'none',
  sync_interval text NOT NULL DEFAULT 'manual',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_folders_parent ON folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_notes_folder ON notes(folder_id);
CREATE INDEX IF NOT EXISTS idx_notes_updated ON notes(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_note_links_source ON note_links(source_note_id);
CREATE INDEX IF NOT EXISTS idx_note_links_target ON note_links(target_note_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_date ON activity_logs(date DESC);

-- Enable RLS
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Folders policies (single-tenant: anon + authenticated)
DROP POLICY IF EXISTS "anon_select_folders" ON folders;
CREATE POLICY "anon_select_folders" ON folders FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_folders" ON folders;
CREATE POLICY "anon_insert_folders" ON folders FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_folders" ON folders;
CREATE POLICY "anon_update_folders" ON folders FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_folders" ON folders;
CREATE POLICY "anon_delete_folders" ON folders FOR DELETE TO anon, authenticated USING (true);

-- Notes policies
DROP POLICY IF EXISTS "anon_select_notes" ON notes;
CREATE POLICY "anon_select_notes" ON notes FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_notes" ON notes;
CREATE POLICY "anon_insert_notes" ON notes FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_notes" ON notes;
CREATE POLICY "anon_update_notes" ON notes FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_notes" ON notes;
CREATE POLICY "anon_delete_notes" ON notes FOR DELETE TO anon, authenticated USING (true);

-- Tags policies
DROP POLICY IF EXISTS "anon_select_tags" ON tags;
CREATE POLICY "anon_select_tags" ON tags FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_tags" ON tags;
CREATE POLICY "anon_insert_tags" ON tags FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_tags" ON tags;
CREATE POLICY "anon_update_tags" ON tags FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_tags" ON tags;
CREATE POLICY "anon_delete_tags" ON tags FOR DELETE TO anon, authenticated USING (true);

-- Note tags policies
DROP POLICY IF EXISTS "anon_select_note_tags" ON note_tags;
CREATE POLICY "anon_select_note_tags" ON note_tags FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_note_tags" ON note_tags;
CREATE POLICY "anon_insert_note_tags" ON note_tags FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_note_tags" ON note_tags;
CREATE POLICY "anon_update_note_tags" ON note_tags FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_note_tags" ON note_tags;
CREATE POLICY "anon_delete_note_tags" ON note_tags FOR DELETE TO anon, authenticated USING (true);

-- Note links policies
DROP POLICY IF EXISTS "anon_select_note_links" ON note_links;
CREATE POLICY "anon_select_note_links" ON note_links FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_note_links" ON note_links;
CREATE POLICY "anon_insert_note_links" ON note_links FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_note_links" ON note_links;
CREATE POLICY "anon_update_note_links" ON note_links FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_note_links" ON note_links;
CREATE POLICY "anon_delete_note_links" ON note_links FOR DELETE TO anon, authenticated USING (true);

-- Activity logs policies
DROP POLICY IF EXISTS "anon_select_activity_logs" ON activity_logs;
CREATE POLICY "anon_select_activity_logs" ON activity_logs FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_activity_logs" ON activity_logs;
CREATE POLICY "anon_insert_activity_logs" ON activity_logs FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_activity_logs" ON activity_logs;
CREATE POLICY "anon_update_activity_logs" ON activity_logs FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_activity_logs" ON activity_logs;
CREATE POLICY "anon_delete_activity_logs" ON activity_logs FOR DELETE TO anon, authenticated USING (true);

-- Settings policies
DROP POLICY IF EXISTS "anon_select_settings" ON settings;
CREATE POLICY "anon_select_settings" ON settings FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_settings" ON settings;
CREATE POLICY "anon_insert_settings" ON settings FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_settings" ON settings;
CREATE POLICY "anon_update_settings" ON settings FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_settings" ON settings;
CREATE POLICY "anon_delete_settings" ON settings FOR DELETE TO anon, authenticated USING (true);
