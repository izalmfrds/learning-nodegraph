'use client';

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from 'react';
import { Sidebar } from '@/components/sidebar';
import { Header } from '@/components/header';
import { cn } from '@/lib/utils';
import {
  getFolderTree,
  getNotes,
  getNoteById,
  createNote,
  createFolder,
  updateNote,
  updateFolder,
  deleteNote,
  deleteFolder,
  type Folder,
  type Note,
} from '@/lib/data';
import {
  FileText,
  Folder as FolderIcon,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Plus,
  FolderPlus,
  Pencil,
  Copy,
  Trash2,
  Search,
  Upload,
  Eye,
  Edit3,
  Save,
  X,
  FileQuestion,
  SortAsc,
  SortDesc,
  ArrowUpDown,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';

// ---------------------------------------------------------------------------
// Lightweight markdown renderer (no external deps)
// ---------------------------------------------------------------------------
function renderMarkdown(raw: string): string {
  let html = raw
    // Escape HTML entities first
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Fenced code blocks
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_m, lang, code) => {
    return `<pre class="md-pre"><code class="md-code lang-${lang}">${code}</code></pre>`;
  });

  // Headings
  html = html.replace(/^###### (.+)$/gm, '<h6 class="md-h6">$1</h6>');
  html = html.replace(/^##### (.+)$/gm, '<h5 class="md-h5">$1</h5>');
  html = html.replace(/^#### (.+)$/gm, '<h4 class="md-h4">$1</h4>');
  html = html.replace(/^### (.+)$/gm, '<h3 class="md-h3">$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2 class="md-h2">$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1 class="md-h1">$1</h1>');

  // Blockquote
  html = html.replace(/^&gt; (.+)$/gm, '<blockquote class="md-blockquote">$1</blockquote>');

  // Horizontal rule
  html = html.replace(/^---$/gm, '<hr class="md-hr" />');

  // Bold & italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="md-bold">$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em class="md-italic">$1</em>');
  html = html.replace(/_(.+?)_/g, '<em class="md-italic">$1</em>');
  html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code class="md-inline-code">$1</code>');

  // Images (before links)
  html = html.replace(
    /!\[([^\]]*)\]\(([^)]+)\)/g,
    '<img class="md-img" alt="$1" src="$2" />'
  );

  // Links
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a class="md-link" href="$2" target="_blank" rel="noopener">$1</a>'
  );

  // Tables — detect | rows
  html = html.replace(/((?:^(?:\|[^\n]+\|)\n)+)/gm, (block) => {
    const rows = block.trim().split('\n');
    if (rows.length < 2) return block;
    const makeRow = (row: string, tag: string) =>
      `<tr>${row
        .split('|')
        .filter((_, i, a) => i > 0 && i < a.length - 1)
        .map((cell) => `<${tag} class="md-td">${cell.trim()}</${tag}>`)
        .join('')}</tr>`;
    const header = makeRow(rows[0], 'th');
    const body = rows
      .slice(2)
      .map((r) => makeRow(r, 'td'))
      .join('');
    return `<table class="md-table"><thead>${header}</thead><tbody>${body}</tbody></table>`;
  });

  // Unordered lists
  html = html.replace(/((?:^[-*] .+\n?)+)/gm, (block) => {
    const items = block
      .trim()
      .split('\n')
      .map((line) => `<li class="md-li">${line.replace(/^[-*] /, '')}</li>`)
      .join('');
    return `<ul class="md-ul">${items}</ul>`;
  });

  // Ordered lists
  html = html.replace(/((?:^\d+\. .+\n?)+)/gm, (block) => {
    const items = block
      .trim()
      .split('\n')
      .map((line) => `<li class="md-li">${line.replace(/^\d+\. /, '')}</li>`)
      .join('');
    return `<ol class="md-ol">${items}</ol>`;
  });

  // Paragraphs — wrap bare lines not already wrapped in a block tag
  html = html
    .split('\n\n')
    .map((chunk) => {
      const t = chunk.trim();
      if (!t) return '';
      if (/^<(h[1-6]|ul|ol|pre|blockquote|table|hr|img)/.test(t)) return t;
      return `<p class="md-p">${t.replace(/\n/g, '<br />')}</p>`;
    })
    .join('\n');

  return html;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type SortKey = 'name' | 'updated';
type SortDir = 'asc' | 'desc';

interface TreeItem {
  kind: 'folder';
  folder: Folder;
  depth: number;
  children: TreeItem[];
  notes: Note[];
}

// ---------------------------------------------------------------------------
// Flatten the folder+note tree into a linear renderable list
// ---------------------------------------------------------------------------
function buildFlatTree(
  folders: Folder[],
  allNotes: Note[],
  expandedFolderIds: Set<string>,
  depth = 0
): Array<{ type: 'folder'; folder: Folder; depth: number } | { type: 'note'; note: Note; depth: number }> {
  const out: Array<{ type: 'folder'; folder: Folder; depth: number } | { type: 'note'; note: Note; depth: number }> = [];
  for (const folder of folders) {
    out.push({ type: 'folder', folder, depth });
    if (expandedFolderIds.has(folder.id)) {
      // notes in this folder
      const notes = allNotes.filter((n) => n.folder_id === folder.id);
      for (const note of notes) {
        out.push({ type: 'note', note, depth: depth + 1 });
      }
      // subfolders
      if (folder.children?.length) {
        out.push(...buildFlatTree(folder.children, allNotes, expandedFolderIds, depth + 1));
      }
    }
  }
  // Root-level notes (no folder)
  if (depth === 0) {
    const rootNotes = allNotes.filter((n) => !n.folder_id);
    for (const note of rootNotes) {
      out.push({ type: 'note', note, depth: 0 });
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function ExplorerPage() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [allNotes, setAllNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  // Tree state
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  // Rename state
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameType, setRenameType] = useState<'note' | 'folder'>('note');
  const [renameValue, setRenameValue] = useState('');

  // Search / sort
  const [filterQuery, setFilterQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  // Editor state
  const [editorMode, setEditorMode] = useState<'preview' | 'edit'>('preview');
  const [editContent, setEditContent] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ---------------------------------------------------------------------------
  // Data loaders
  // ---------------------------------------------------------------------------
  const loadFolders = useCallback(async () => {
    const data = await getFolderTree();
    setFolders(data);
  }, []);

  const loadAllNotes = useCallback(async () => {
    const data = await getNotes();
    setAllNotes(data);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await Promise.all([loadFolders(), loadAllNotes()]);
        // Expand all top-level folders by default
        const data = await getFolderTree();
        setExpandedIds(new Set(data.map((f: Folder) => f.id)));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [loadFolders, loadAllNotes]);

  // Load selected note content
  useEffect(() => {
    if (!selectedNoteId) {
      setSelectedNote(null);
      return;
    }
    getNoteById(selectedNoteId).then((note) => {
      if (note) {
        setSelectedNote(note);
        setEditContent(note.content || '');
        setIsDirty(false);
      }
    });
  }, [selectedNoteId]);

  // ---------------------------------------------------------------------------
  // Auto-save on edit
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!isDirty || !selectedNoteId) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      const words = editContent.trim().split(/\s+/).filter(Boolean).length;
      await updateNote(selectedNoteId, { content: editContent, word_count: words });
      setSelectedNote((prev) => prev ? { ...prev, content: editContent, word_count: words } : prev);
      setAllNotes((prev) => prev.map((n) => n.id === selectedNoteId ? { ...n, content: editContent, word_count: words } : n));
      setIsDirty(false);
    }, 800);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [editContent, isDirty, selectedNoteId]);

  // ---------------------------------------------------------------------------
  // CRUD handlers
  // ---------------------------------------------------------------------------
  const handleCreateNote = useCallback(async (folderId: string | null) => {
    const title = 'Untitled';
    const note = await createNote({ title, content: '', folder_id: folderId, word_count: 0 });
    await loadAllNotes();
    if (folderId) setExpandedIds((prev) => new Set(Array.from(prev).concat(folderId)));
    setSelectedNoteId(note.id);
    setEditorMode('edit');
    setTimeout(() => setRenamingId(note.id), 50);
    setRenameType('note');
    setRenameValue(title);
  }, [loadAllNotes]);

  const handleCreateFolder = useCallback(async (parentId: string | null) => {
    const folder = await createFolder({ name: 'New Folder', parent_id: parentId });
    await loadFolders();
    setExpandedIds((prev) => new Set(Array.from(prev).concat(folder.id)));
    setTimeout(() => { setRenamingId(folder.id); setRenameType('folder'); setRenameValue('New Folder'); }, 50);
  }, [loadFolders]);

  const handleRenameSubmit = useCallback(async (id: string, type: 'note' | 'folder', name: string) => {
    if (!name.trim()) { setRenamingId(null); return; }
    if (type === 'note') {
      await updateNote(id, { title: name });
      await loadAllNotes();
      setSelectedNote((prev) => prev?.id === id ? { ...prev, title: name } : prev);
    } else {
      await updateFolder(id, { name });
      await loadFolders();
    }
    setRenamingId(null);
  }, [loadAllNotes, loadFolders]);

  const handleDeleteNote = useCallback(async (id: string) => {
    await deleteNote(id);
    await loadAllNotes();
    if (selectedNoteId === id) { setSelectedNoteId(null); setSelectedNote(null); }
  }, [loadAllNotes, selectedNoteId]);

  const handleDeleteFolder = useCallback(async (id: string) => {
    await deleteFolder(id);
    await loadFolders();
    await loadAllNotes();
  }, [loadFolders, loadAllNotes]);

  const handleDuplicateNote = useCallback(async (note: Note) => {
    await createNote({ title: `${note.title} (copy)`, content: note.content, folder_id: note.folder_id, word_count: note.word_count });
    await loadAllNotes();
  }, [loadAllNotes]);

  // ---------------------------------------------------------------------------
  // Filtered + sorted flat tree
  // ---------------------------------------------------------------------------
  const filteredNotes = useMemo(() => {
    if (!filterQuery.trim()) return allNotes;
    const q = filterQuery.toLowerCase();
    return allNotes.filter((n) => n.title.toLowerCase().includes(q));
  }, [allNotes, filterQuery]);

  const flatTree = useMemo(() => buildFlatTree(folders, filteredNotes, expandedIds), [folders, filteredNotes, expandedIds]);

  // ---------------------------------------------------------------------------
  // Rendered markdown
  // ---------------------------------------------------------------------------
  const renderedHtml = useMemo(() => renderMarkdown(editContent), [editContent]);

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFC] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#6D4AFF]/30 border-t-[#6D4AFF] rounded-full animate-spin" />
          <p className="text-sm text-[#9CA3AF]">Loading explorer...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-[#FAFAFC]">
      <Sidebar folders={[]} isCollapsed={isCollapsed} onToggleCollapse={() => setIsCollapsed(!isCollapsed)} />
      <Header isCollapsed={isCollapsed} />

      <div
        className={cn(
          'flex flex-col h-full pt-16 transition-all duration-300 ease-out',
          isCollapsed ? 'pl-16' : 'pl-[280px]'
        )}
      >
        {/* ── Top Toolbar ── */}
        <div className="flex items-center justify-between h-12 px-4 border-b border-[#ECECF3] bg-white shrink-0">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCreateFolder(null)}
              className="h-8 gap-1.5 text-xs text-[#6B7280] hover:text-[#6D4AFF] hover:bg-[#F4F1FF]"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              New Folder
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCreateNote(null)}
              className="h-8 gap-1.5 text-xs text-[#6B7280] hover:text-[#6D4AFF] hover:bg-[#F4F1FF]"
            >
              <Plus className="w-3.5 h-3.5" />
              New File
            </Button>
            <div className="w-px h-5 bg-[#ECECF3] mx-1" />
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-xs text-[#6B7280] hover:text-[#6D4AFF] hover:bg-[#F4F1FF]"
            >
              <Upload className="w-3.5 h-3.5" />
              Upload
            </Button>
          </div>
          <div className="flex items-center gap-2">
            {/* Sort toggle */}
            <button
              onClick={() => {
                if (sortKey === 'name') { setSortDir((d) => d === 'asc' ? 'desc' : 'asc'); }
                else { setSortKey('name'); setSortDir('asc'); }
              }}
              className={cn(
                'flex items-center gap-1 h-8 px-2.5 rounded-lg text-xs transition-all duration-200',
                sortKey === 'name' ? 'bg-[#F4F1FF] text-[#6D4AFF]' : 'text-[#9CA3AF] hover:bg-[#FAFAFC]'
              )}
            >
              <SortAsc className="w-3.5 h-3.5" />
              Name
            </button>
            <button
              onClick={() => {
                if (sortKey === 'updated') { setSortDir((d) => d === 'asc' ? 'desc' : 'asc'); }
                else { setSortKey('updated'); setSortDir('desc'); }
              }}
              className={cn(
                'flex items-center gap-1 h-8 px-2.5 rounded-lg text-xs transition-all duration-200',
                sortKey === 'updated' ? 'bg-[#F4F1FF] text-[#6D4AFF]' : 'text-[#9CA3AF] hover:bg-[#FAFAFC]'
              )}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              Updated
            </button>
            <div className="w-px h-5 bg-[#ECECF3] mx-1" />
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9CA3AF]" />
              <Input
                type="text"
                placeholder="Filter..."
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                className="pl-8 h-8 w-44 bg-[#FAFAFC] border-[#ECECF3] text-xs"
              />
              {filterQuery && (
                <button
                  onClick={() => setFilterQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#171717]"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Two-panel body ── */}
        <div className="flex flex-1 overflow-hidden">

          {/* ── LEFT: File Tree ── */}
          <div className="w-64 shrink-0 border-r border-[#ECECF3] bg-white flex flex-col overflow-hidden">
            {/* Vault header */}
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[#ECECF3]">
              <button
                onClick={() => {
                  const allIds = folders.map((f) => f.id);
                  const allExpanded = allIds.every((id) => expandedIds.has(id));
                  setExpandedIds(allExpanded ? new Set<string>() : new Set(allIds));
                }}
                className="flex items-center gap-2 flex-1 min-w-0 text-left"
              >
                <FolderOpen className="w-4 h-4 text-[#6D4AFF] shrink-0" />
                <span className="text-xs font-semibold text-[#171717] truncate">Vault</span>
              </button>
              <button
                onClick={() => handleCreateNote(null)}
                title="New file"
                className="w-5 h-5 flex items-center justify-center rounded text-[#9CA3AF] hover:text-[#6D4AFF] hover:bg-[#F4F1FF] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleCreateFolder(null)}
                title="New folder"
                className="w-5 h-5 flex items-center justify-center rounded text-[#9CA3AF] hover:text-[#6D4AFF] hover:bg-[#F4F1FF] transition-colors"
              >
                <FolderPlus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Tree scroll area */}
            <div className="flex-1 overflow-y-auto py-1">
              {flatTree.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-[#9CA3AF]">
                  <FolderIcon className="w-8 h-8 mb-2 opacity-20" />
                  <p className="text-xs">No files yet</p>
                </div>
              )}
              {flatTree.map((item, idx) => {
                if (item.type === 'folder') {
                  const { folder, depth } = item;
                  const isExpanded = expandedIds.has(folder.id);
                  const hasChildren = (folder.children?.length ?? 0) > 0 || allNotes.some((n) => n.folder_id === folder.id);
                  const isRenaming = renamingId === folder.id;

                  return (
                    <ContextMenu key={`f-${folder.id}`}>
                      <ContextMenuTrigger asChild>
                        <div
                          className="group flex items-center gap-1 h-7 text-xs cursor-pointer select-none rounded-md mx-1 transition-all duration-150 hover:bg-[#F4F1FF]"
                          style={{ paddingLeft: `${8 + depth * 14}px`, paddingRight: '8px' }}
                          onClick={() => {
                            setExpandedIds((prev) => {
                              const arr = Array.from(prev);
                              if (prev.has(folder.id)) return new Set(arr.filter((id) => id !== folder.id));
                              return new Set(arr.concat(folder.id));
                            });
                          }}
                        >
                          <span className="w-4 shrink-0 flex items-center justify-center">
                            {hasChildren ? (
                              isExpanded
                                ? <ChevronDown className="w-3 h-3 text-[#9CA3AF]" />
                                : <ChevronRight className="w-3 h-3 text-[#9CA3AF]" />
                            ) : null}
                          </span>
                          {isExpanded
                            ? <FolderOpen className="w-3.5 h-3.5 text-[#6D4AFF]/80 shrink-0" />
                            : <FolderIcon className="w-3.5 h-3.5 text-[#6D4AFF]/60 shrink-0" />
                          }
                          {isRenaming ? (
                            <input
                              value={renameValue}
                              onChange={(e) => setRenameValue(e.target.value)}
                              onKeyDown={(e) => {
                                e.stopPropagation();
                                if (e.key === 'Enter') handleRenameSubmit(folder.id, 'folder', renameValue);
                                if (e.key === 'Escape') setRenamingId(null);
                              }}
                              onBlur={() => handleRenameSubmit(folder.id, 'folder', renameValue)}
                              onClick={(e) => e.stopPropagation()}
                              autoFocus
                              className="flex-1 ml-1.5 min-w-0 bg-white border border-[#6D4AFF] rounded px-1 py-0 text-xs outline-none"
                            />
                          ) : (
                            <span className="flex-1 ml-1.5 truncate text-[#374151] group-hover:text-[#171717]">
                              {folder.name}
                            </span>
                          )}
                        </div>
                      </ContextMenuTrigger>
                      <ContextMenuContent className="w-48 rounded-xl border-[#ECECF3] shadow-lg shadow-black/5">
                        <ContextMenuItem onClick={() => handleCreateNote(folder.id)} className="gap-2 cursor-pointer rounded-lg text-sm">
                          <Plus className="w-4 h-4 text-[#6D4AFF]" />
                          New File
                        </ContextMenuItem>
                        <ContextMenuItem onClick={() => handleCreateFolder(folder.id)} className="gap-2 cursor-pointer rounded-lg text-sm">
                          <FolderPlus className="w-4 h-4 text-[#6D4AFF]" />
                          New Subfolder
                        </ContextMenuItem>
                        <ContextMenuSeparator className="bg-[#ECECF3]" />
                        <ContextMenuItem
                          onClick={() => { setRenamingId(folder.id); setRenameType('folder'); setRenameValue(folder.name); }}
                          className="gap-2 cursor-pointer rounded-lg text-sm"
                        >
                          <Pencil className="w-4 h-4 text-[#6D4AFF]" />
                          Rename
                        </ContextMenuItem>
                        <ContextMenuSeparator className="bg-[#ECECF3]" />
                        <ContextMenuItem
                          onClick={() => handleDeleteFolder(folder.id)}
                          className="gap-2 cursor-pointer rounded-lg text-sm text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete Folder
                        </ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenu>
                  );
                } else {
                  const { note, depth } = item;
                  const isSelected = selectedNoteId === note.id;
                  const isRenaming = renamingId === note.id;

                  return (
                    <ContextMenu key={`n-${note.id}`}>
                      <ContextMenuTrigger asChild>
                        <div
                          className={cn(
                            'group flex items-center gap-1 h-7 text-xs cursor-pointer select-none rounded-md mx-1 transition-all duration-150',
                            isSelected
                              ? 'bg-[#6D4AFF]/10 text-[#6D4AFF]'
                              : 'hover:bg-[#F4F1FF] text-[#6B7280]'
                          )}
                          style={{ paddingLeft: `${8 + depth * 14}px`, paddingRight: '8px' }}
                          onClick={() => { setSelectedNoteId(note.id); setEditorMode('preview'); }}
                        >
                          <span className="w-4 shrink-0" />
                          <FileText className={cn('w-3.5 h-3.5 shrink-0', isSelected ? 'text-[#6D4AFF]' : 'text-[#9CA3AF]')} />
                          {isRenaming ? (
                            <input
                              value={renameValue}
                              onChange={(e) => setRenameValue(e.target.value)}
                              onKeyDown={(e) => {
                                e.stopPropagation();
                                if (e.key === 'Enter') handleRenameSubmit(note.id, 'note', renameValue);
                                if (e.key === 'Escape') setRenamingId(null);
                              }}
                              onBlur={() => handleRenameSubmit(note.id, 'note', renameValue)}
                              onClick={(e) => e.stopPropagation()}
                              autoFocus
                              className="flex-1 ml-1.5 min-w-0 bg-white border border-[#6D4AFF] rounded px-1 py-0 text-xs outline-none text-[#171717]"
                            />
                          ) : (
                            <span className={cn('flex-1 ml-1.5 truncate', isSelected ? 'font-medium' : 'group-hover:text-[#171717]')}>
                              {note.title}
                            </span>
                          )}
                        </div>
                      </ContextMenuTrigger>
                      <ContextMenuContent className="w-48 rounded-xl border-[#ECECF3] shadow-lg shadow-black/5">
                        <ContextMenuItem
                          onClick={() => { setRenamingId(note.id); setRenameType('note'); setRenameValue(note.title); }}
                          className="gap-2 cursor-pointer rounded-lg text-sm"
                        >
                          <Pencil className="w-4 h-4 text-[#6D4AFF]" />
                          Rename
                        </ContextMenuItem>
                        <ContextMenuItem
                          onClick={() => handleDuplicateNote(note)}
                          className="gap-2 cursor-pointer rounded-lg text-sm"
                        >
                          <Copy className="w-4 h-4 text-[#6D4AFF]" />
                          Duplicate
                        </ContextMenuItem>
                        <ContextMenuSeparator className="bg-[#ECECF3]" />
                        <ContextMenuItem
                          onClick={() => handleDeleteNote(note.id)}
                          className="gap-2 cursor-pointer rounded-lg text-sm text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenu>
                  );
                }
              })}
            </div>
          </div>

          {/* ── RIGHT: Preview / Editor ── */}
          <div className="flex-1 min-w-0 flex flex-col overflow-hidden bg-white">
            {selectedNote ? (
              <>
                {/* Note toolbar */}
                <div className="flex items-center justify-between h-12 px-6 border-b border-[#ECECF3] shrink-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-[#6D4AFF] shrink-0" />
                    <span className="text-sm font-semibold text-[#171717] truncate">{selectedNote.title}</span>
                    {isDirty && (
                      <span className="text-[10px] text-[#9CA3AF] shrink-0">Saving...</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setEditorMode('preview')}
                      className={cn(
                        'flex items-center gap-1.5 h-7 px-3 rounded-lg text-xs transition-all duration-200',
                        editorMode === 'preview'
                          ? 'bg-[#6D4AFF]/10 text-[#6D4AFF] font-medium'
                          : 'text-[#9CA3AF] hover:text-[#171717] hover:bg-[#FAFAFC]'
                      )}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Preview
                    </button>
                    <button
                      onClick={() => setEditorMode('edit')}
                      className={cn(
                        'flex items-center gap-1.5 h-7 px-3 rounded-lg text-xs transition-all duration-200',
                        editorMode === 'edit'
                          ? 'bg-[#6D4AFF]/10 text-[#6D4AFF] font-medium'
                          : 'text-[#9CA3AF] hover:text-[#171717] hover:bg-[#FAFAFC]'
                      )}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Edit
                    </button>
                  </div>
                </div>

                {/* Content area */}
                {editorMode === 'preview' ? (
                  <div className="flex-1 overflow-y-auto">
                    <div className="max-w-3xl mx-auto px-12 py-10">
                      {editContent.trim() ? (
                        <div
                          className="markdown-body"
                          dangerouslySetInnerHTML={{ __html: renderedHtml }}
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-[#9CA3AF]">
                          <FileQuestion className="w-12 h-12 mb-4 opacity-20" />
                          <p className="text-sm">This note is empty</p>
                          <button
                            onClick={() => setEditorMode('edit')}
                            className="mt-3 text-xs text-[#6D4AFF] hover:underline"
                          >
                            Start writing
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 overflow-hidden flex flex-col">
                    <textarea
                      value={editContent}
                      onChange={(e) => { setEditContent(e.target.value); setIsDirty(true); }}
                      className="flex-1 resize-none border-0 outline-none bg-white px-12 py-10 text-[14px] leading-7 text-[#374151] font-mono placeholder:text-[#D1D5DB] max-w-3xl w-full mx-auto block"
                      placeholder="Start writing in Markdown..."
                      spellCheck={false}
                    />
                  </div>
                )}
              </>
            ) : (
              /* Empty state */
              <div className="flex-1 flex flex-col items-center justify-center text-[#9CA3AF] select-none">
                <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-[#FAFAFC] border border-[#ECECF3] mb-5">
                  <FileText className="w-7 h-7 opacity-30" />
                </div>
                <p className="text-sm font-medium text-[#374151]">Select a file</p>
                <p className="text-xs text-[#9CA3AF] mt-1.5 text-center max-w-xs">
                  Choose a file from the Explorer to preview or edit its contents.
                </p>
                <button
                  onClick={() => handleCreateNote(null)}
                  className="mt-6 flex items-center gap-2 h-8 px-4 rounded-xl bg-[#6D4AFF] text-white text-xs font-medium hover:bg-[#5B3EF5] transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New File
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Markdown styles */}
      <style>{`
        .markdown-body { color: #374151; font-size: 15px; line-height: 1.75; }
        .md-h1 { font-size: 1.75rem; font-weight: 700; color: #111827; margin: 1.5rem 0 0.75rem; letter-spacing: -0.02em; }
        .md-h2 { font-size: 1.35rem; font-weight: 700; color: #111827; margin: 1.5rem 0 0.6rem; letter-spacing: -0.01em; padding-bottom: 0.4rem; border-bottom: 1px solid #F3F4F6; }
        .md-h3 { font-size: 1.1rem; font-weight: 600; color: #1F2937; margin: 1.25rem 0 0.5rem; }
        .md-h4, .md-h5, .md-h6 { font-size: 0.95rem; font-weight: 600; color: #374151; margin: 1rem 0 0.4rem; }
        .md-p { margin: 0.75rem 0; }
        .md-bold { font-weight: 700; color: #111827; }
        .md-italic { font-style: italic; }
        .md-link { color: #6D4AFF; text-decoration: underline; text-underline-offset: 2px; }
        .md-link:hover { color: #5B3EF5; }
        .md-inline-code { background: #F3F4F6; color: #6D4AFF; border-radius: 4px; padding: 1px 6px; font-size: 0.875em; font-family: ui-monospace, monospace; }
        .md-pre { background: #1E1E2E; border-radius: 10px; padding: 1.25rem 1.5rem; margin: 1rem 0; overflow-x: auto; }
        .md-code { color: #CDD6F4; font-size: 0.875rem; font-family: ui-monospace, SFMono-Regular, monospace; line-height: 1.6; white-space: pre; }
        .md-blockquote { border-left: 3px solid #6D4AFF; padding: 0.5rem 0 0.5rem 1rem; margin: 0.75rem 0; color: #6B7280; font-style: italic; background: #F9F8FF; border-radius: 0 8px 8px 0; }
        .md-hr { border: none; border-top: 1px solid #E5E7EB; margin: 1.5rem 0; }
        .md-ul, .md-ol { margin: 0.75rem 0; padding-left: 1.5rem; }
        .md-ul { list-style: disc; }
        .md-ol { list-style: decimal; }
        .md-li { margin: 0.3rem 0; }
        .md-table { width: 100%; border-collapse: collapse; margin: 1rem 0; font-size: 0.9rem; }
        .md-td { border: 1px solid #E5E7EB; padding: 0.5rem 0.75rem; text-align: left; }
        thead .md-td { background: #F9FAFB; font-weight: 600; color: #111827; }
        .md-img { max-width: 100%; border-radius: 8px; margin: 0.75rem 0; }
      `}</style>
    </div>
  );
}
