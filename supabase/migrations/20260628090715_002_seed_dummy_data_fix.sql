/*
# Seed Dummy Data for Note Management System v1.0 (Fixed)
*/

DO $$
DECLARE
  v_vault uuid;
  v_projects uuid;
  v_docs uuid;
  v_archive uuid;
  v_sprint1 uuid;
  v_sprint2 uuid;
  v_research uuid;
  v_meeting uuid;
  v_ideas uuid;
  v_2024 uuid;
  v_2023 uuid;
  v_q1 uuid;
BEGIN
  SELECT id INTO v_vault FROM folders WHERE name = 'Vault';
  SELECT id INTO v_projects FROM folders WHERE name = 'Projects';
  SELECT id INTO v_docs FROM folders WHERE name = 'Docs';
  SELECT id INTO v_archive FROM folders WHERE name = 'Archive';
  SELECT id INTO v_sprint1 FROM folders WHERE name = 'Sprint 1';
  SELECT id INTO v_sprint2 FROM folders WHERE name = 'Sprint 2';
  SELECT id INTO v_research FROM folders WHERE name = 'Research';
  SELECT id INTO v_meeting FROM folders WHERE name = 'Meeting Notes';
  SELECT id INTO v_ideas FROM folders WHERE name = 'Ideas';
  SELECT id INTO v_2024 FROM folders WHERE name = '2024';
  SELECT id INTO v_2023 FROM folders WHERE name = '2023';
  SELECT id INTO v_q1 FROM folders WHERE name = 'Q1';

  IF v_vault IS NULL THEN
    -- Insert folders
    INSERT INTO folders (id, name, parent_id, color, created_at, updated_at) VALUES
      (gen_random_uuid(), 'Vault', NULL, '#3B82F6', now(), now()),
      (gen_random_uuid(), 'Projects', NULL, '#10B981', now(), now()),
      (gen_random_uuid(), 'Docs', NULL, '#F59E0B', now(), now()),
      (gen_random_uuid(), 'Archive', NULL, '#6B7280', now(), now()),
      (gen_random_uuid(), 'Sprint 1', NULL, '#8B5CF6', now(), now()),
      (gen_random_uuid(), 'Sprint 2', NULL, '#EC4899', now(), now()),
      (gen_random_uuid(), 'Research', NULL, '#06B6D4', now(), now()),
      (gen_random_uuid(), 'Meeting Notes', NULL, '#EF4444', now(), now()),
      (gen_random_uuid(), 'Ideas', NULL, '#84CC16', now(), now()),
      (gen_random_uuid(), '2024', NULL, '#6366F1', now(), now()),
      (gen_random_uuid(), '2023', NULL, '#14B8A6', now(), now()),
      (gen_random_uuid(), 'Q1', NULL, '#F97316', now(), now());

    SELECT id INTO v_vault FROM folders WHERE name = 'Vault';
    SELECT id INTO v_projects FROM folders WHERE name = 'Projects';
    SELECT id INTO v_docs FROM folders WHERE name = 'Docs';
    SELECT id INTO v_archive FROM folders WHERE name = 'Archive';
    SELECT id INTO v_sprint1 FROM folders WHERE name = 'Sprint 1';
    SELECT id INTO v_sprint2 FROM folders WHERE name = 'Sprint 2';
    SELECT id INTO v_research FROM folders WHERE name = 'Research';
    SELECT id INTO v_meeting FROM folders WHERE name = 'Meeting Notes';
    SELECT id INTO v_ideas FROM folders WHERE name = 'Ideas';
    SELECT id INTO v_2024 FROM folders WHERE name = '2024';
    SELECT id INTO v_2023 FROM folders WHERE name = '2023';
    SELECT id INTO v_q1 FROM folders WHERE name = 'Q1';

    UPDATE folders SET parent_id = v_vault WHERE name IN ('Projects', 'Docs', 'Archive');
    UPDATE folders SET parent_id = v_projects WHERE name IN ('Sprint 1', 'Sprint 2');
    UPDATE folders SET parent_id = v_docs WHERE name IN ('Research', 'Meeting Notes', 'Ideas');
    UPDATE folders SET parent_id = v_archive WHERE name IN ('2024', '2023');
    UPDATE folders SET parent_id = v_2024 WHERE name = 'Q1';
  END IF;

  -- Check if notes already exist
  IF (SELECT COUNT(*) FROM notes) = 0 THEN
    INSERT INTO notes (id, title, content, folder_id, word_count, created_at, updated_at) VALUES
      (gen_random_uuid(), 'Meeting Notes 28 Jun', E'# Meeting Notes 28 Jun\n\n## Agenda\n1. Sprint review\n2. Bug triage\n3. Next sprint planning\n\n## Decisions\n- Pilih React untuk frontend\n- Deadline 30 Jun\n\n[[Ideas Drafting]]', v_meeting, 45, now() - interval '1 day', now() - interval '1 day'),
      (gen_random_uuid(), 'Ideas Drafting', E'# Ideas Drafting\n\n## New Features\n- Graph view untuk visualisasi hubungan\n- Smart linking dengan autocomplete\n- Cloud sync engine\n\n## Tech Stack\n- Next.js 15\n- React 19\n- Tailwind CSS\n- Supabase\n\n[[Meeting Notes 28 Jun]]\n[[Research: Agile Methodology]]', v_ideas, 38, now() - interval '2 days', now() - interval '2 days'),
      (gen_random_uuid(), 'Research: Agile Methodology', E'# Research: Agile Methodology\n\n## Overview\nAgile adalah pendekatan iteratif untuk pengembangan software.\n\n## Key Principles\n1. Individual and interactions over processes\n2. Working software over documentation\n3. Customer collaboration over negotiation\n4. Responding to change over following a plan\n\n## Sprint Review Process\nSetiap akhir sprint, tim melakukan review untuk mengevaluasi hasil.\n\n[[Sprint Planning Notes]]', v_research, 62, now() - interval '5 days', now() - interval '3 days'),
      (gen_random_uuid(), 'Sprint Planning Notes', E'# Sprint Planning Notes\n\n## Goals\n- Complete user authentication\n- Implement folder tree\n- Build note editor\n\n## Tasks\n1. Setup database schema\n2. Create API endpoints\n3. Build UI components\n\n## Notes\nPersiapan sprint berikutnya dimulai minggu depan.\n\n[[Bug Triage Report]]', v_sprint1, 41, now() - interval '4 days', now() - interval '4 days'),
      (gen_random_uuid(), 'Bug Triage Report', E'# Bug Triage Report\n\n## Critical\n- Login failure on mobile\n- Data sync timeout\n\n## Medium\n- UI glitch in dark mode\n- Slow search response\n\n## Notes\nCatatan dari sprint review kemarin: ada 3 bug critical yang perlu diperbaiki.\n\n[[Meeting Notes 28 Jun]]', v_sprint2, 35, now() - interval '7 days', now() - interval '7 days'),
      (gen_random_uuid(), 'Daily Journal', E'# Daily Journal\n\n## Morning\n- Coffee and code review\n- Standup meeting\n\n## Afternoon\n- Feature implementation\n- Testing\n\n## Evening\n- Documentation\n- Planning for tomorrow\n\nReflection: Productive day with good progress on the graph view feature.', v_docs, 42, now() - interval '1 day', now() - interval '1 day'),
      (gen_random_uuid(), 'Project Plan', E'# Project Plan\n\n## Phase 1: Foundation\n- Database design\n- Authentication system\n- Basic CRUD operations\n\n## Phase 2: Core Features\n- Note editor\n- Folder management\n- Search functionality\n\n## Phase 3: Advanced\n- Graph visualization\n- Import/Export\n- Sync engine\n\nTimeline: 3 months\n\n[[Sprint Planning Notes]]', v_projects, 58, now() - interval '10 days', now() - interval '8 days'),
      (gen_random_uuid(), 'Book Summary', E'# Book Summary: Atomic Habits\n\n## Key Takeaways\n1. Small habits compound over time\n2. Focus on systems, not goals\n3. Make it obvious, attractive, easy, satisfying\n4. Track your progress\n5. Never miss twice\n\n## Application to NMS\n- Build daily writing habit\n- Small improvements to the app daily\n- Track metrics and iterate\n\n[[Daily Journal]]', v_research, 48, now() - interval '14 days', now() - interval '12 days'),
      (gen_random_uuid(), 'API Design Document', E'# API Design Document\n\n## Endpoints\n### Notes\n- GET /api/notes — List all notes\n- POST /api/notes — Create note\n- GET /api/notes/:id — Get note detail\n- PUT /api/notes/:id — Update note\n- DELETE /api/notes/:id — Delete note\n\n### Folders\n- GET /api/folders — List folder tree\n- POST /api/folders — Create folder\n- PUT /api/folders/:id — Update folder\n- DELETE /api/folders/:id — Delete folder\n\n### Search\n- GET /api/search?q=query — Full-text search\n\n## Authentication\nJWT-based auth with refresh tokens.', v_docs, 55, now() - interval '3 days', now() - interval '3 days'),
      (gen_random_uuid(), 'User Interview Notes', E'# User Interview Notes\n\n## Participant: Sarah\n- Role: Product Manager\n- Pain points: File overload, no visual connections\n- Wishes: Better search, graph view\n\n## Participant: Mike\n- Role: Developer\n- Pain points: No cloud sync\n- Wishes: API access, automation\n\n## Insights\nUsers want visual organization and seamless sync.', v_meeting, 40, now() - interval '6 days', now() - interval '6 days'),
      (gen_random_uuid(), 'Q1 Retrospective', E'# Q1 Retrospective\n\n## What Went Well\n- Launched MVP on time\n- Positive user feedback\n- Strong team collaboration\n\n## What Could Improve\n- Testing coverage\n- Documentation\n- Onboarding flow\n\n## Action Items\n1. Increase test coverage to 80%\n2. Rewrite documentation\n3. Redesign onboarding\n\n[[Project Plan]]', v_q1, 44, now() - interval '90 days', now() - interval '85 days'),
      (gen_random_uuid(), 'Architecture Decision Record', E'# Architecture Decision Record\n\n## ADR-001: Use Supabase for Backend\n### Context\nNeed real-time sync and auth.\n### Decision\nUse Supabase with PostgreSQL.\n### Consequences\n- Reduced devops overhead\n- Built-in auth and realtime\n- Vendor lock-in risk\n\n## ADR-002: Use Next.js App Router\n### Context\nModern React framework needed.\n### Decision\nNext.js 15 with App Router.\n### Consequences\n- Server components for performance\n- Streaming and suspense support', v_docs, 52, now() - interval '20 days', now() - interval '18 days');
  END IF;

  -- Insert tags if not exist
  IF (SELECT COUNT(*) FROM tags) = 0 THEN
    INSERT INTO tags (id, name, color, created_at) VALUES
      (gen_random_uuid(), 'meeting', '#EF4444', now()),
      (gen_random_uuid(), 'research', '#3B82F6', now()),
      (gen_random_uuid(), 'planning', '#10B981', now()),
      (gen_random_uuid(), 'bug', '#F59E0B', now()),
      (gen_random_uuid(), 'design', '#8B5CF6', now()),
      (gen_random_uuid(), 'review', '#EC4899', now()),
      (gen_random_uuid(), 'architecture', '#06B6D4', now()),
      (gen_random_uuid(), 'user-research', '#84CC16', now());
  END IF;

  -- Link notes to tags
  INSERT INTO note_tags (note_id, tag_id)
  SELECT n.id, t.id FROM notes n, tags t WHERE n.title = 'Meeting Notes 28 Jun' AND t.name = 'meeting'
  ON CONFLICT DO NOTHING;
  INSERT INTO note_tags (note_id, tag_id)
  SELECT n.id, t.id FROM notes n, tags t WHERE n.title = 'Ideas Drafting' AND t.name = 'design'
  ON CONFLICT DO NOTHING;
  INSERT INTO note_tags (note_id, tag_id)
  SELECT n.id, t.id FROM notes n, tags t WHERE n.title = 'Research: Agile Methodology' AND t.name = 'research'
  ON CONFLICT DO NOTHING;
  INSERT INTO note_tags (note_id, tag_id)
  SELECT n.id, t.id FROM notes n, tags t WHERE n.title = 'Sprint Planning Notes' AND t.name = 'planning'
  ON CONFLICT DO NOTHING;
  INSERT INTO note_tags (note_id, tag_id)
  SELECT n.id, t.id FROM notes n, tags t WHERE n.title = 'Bug Triage Report' AND t.name = 'bug'
  ON CONFLICT DO NOTHING;
  INSERT INTO note_tags (note_id, tag_id)
  SELECT n.id, t.id FROM notes n, tags t WHERE n.title = 'Project Plan' AND t.name = 'planning'
  ON CONFLICT DO NOTHING;
  INSERT INTO note_tags (note_id, tag_id)
  SELECT n.id, t.id FROM notes n, tags t WHERE n.title = 'Book Summary' AND t.name = 'research'
  ON CONFLICT DO NOTHING;
  INSERT INTO note_tags (note_id, tag_id)
  SELECT n.id, t.id FROM notes n, tags t WHERE n.title = 'User Interview Notes' AND t.name = 'user-research'
  ON CONFLICT DO NOTHING;

  -- Create note links
  INSERT INTO note_links (source_note_id, target_note_id, link_text, created_at)
  SELECT s.id, t.id, 'Ideas Drafting', now() FROM notes s, notes t WHERE s.title = 'Meeting Notes 28 Jun' AND t.title = 'Ideas Drafting'
  ON CONFLICT DO NOTHING;
  INSERT INTO note_links (source_note_id, target_note_id, link_text, created_at)
  SELECT s.id, t.id, 'Meeting Notes 28 Jun', now() FROM notes s, notes t WHERE s.title = 'Ideas Drafting' AND t.title = 'Meeting Notes 28 Jun'
  ON CONFLICT DO NOTHING;
  INSERT INTO note_links (source_note_id, target_note_id, link_text, created_at)
  SELECT s.id, t.id, 'Research: Agile Methodology', now() FROM notes s, notes t WHERE s.title = 'Ideas Drafting' AND t.title = 'Research: Agile Methodology'
  ON CONFLICT DO NOTHING;
  INSERT INTO note_links (source_note_id, target_note_id, link_text, created_at)
  SELECT s.id, t.id, 'Sprint Planning Notes', now() FROM notes s, notes t WHERE s.title = 'Research: Agile Methodology' AND t.title = 'Sprint Planning Notes'
  ON CONFLICT DO NOTHING;
  INSERT INTO note_links (source_note_id, target_note_id, link_text, created_at)
  SELECT s.id, t.id, 'Bug Triage Report', now() FROM notes s, notes t WHERE s.title = 'Sprint Planning Notes' AND t.title = 'Bug Triage Report'
  ON CONFLICT DO NOTHING;
  INSERT INTO note_links (source_note_id, target_note_id, link_text, created_at)
  SELECT s.id, t.id, 'Meeting Notes 28 Jun', now() FROM notes s, notes t WHERE s.title = 'Bug Triage Report' AND t.title = 'Meeting Notes 28 Jun'
  ON CONFLICT DO NOTHING;
  INSERT INTO note_links (source_note_id, target_note_id, link_text, created_at)
  SELECT s.id, t.id, 'Sprint Planning Notes', now() FROM notes s, notes t WHERE s.title = 'Project Plan' AND t.title = 'Sprint Planning Notes'
  ON CONFLICT DO NOTHING;
  INSERT INTO note_links (source_note_id, target_note_id, link_text, created_at)
  SELECT s.id, t.id, 'Daily Journal', now() FROM notes s, notes t WHERE s.title = 'Book Summary' AND t.title = 'Daily Journal'
  ON CONFLICT DO NOTHING;
  INSERT INTO note_links (source_note_id, target_note_id, link_text, created_at)
  SELECT s.id, t.id, 'Project Plan', now() FROM notes s, notes t WHERE s.title = 'Q1 Retrospective' AND t.title = 'Project Plan'
  ON CONFLICT DO NOTHING;

  -- Generate activity logs for last 90 days
  FOR i IN 0..89 LOOP
    INSERT INTO activity_logs (id, date, note_count, edit_count, created_at)
    VALUES (
      gen_random_uuid(),
      (CURRENT_DATE - i)::date,
      floor(random() * 15)::int,
      floor(random() * 25)::int,
      now()
    )
    ON CONFLICT (date) DO NOTHING;
  END LOOP;

  -- Insert default settings
  IF (SELECT COUNT(*) FROM settings) = 0 THEN
    INSERT INTO settings (id, theme, accent_color, created_at, updated_at)
    VALUES (gen_random_uuid(), 'dark', 'blue', now(), now());
  END IF;
END $$;
