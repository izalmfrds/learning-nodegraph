'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/sidebar';
import { Header } from '@/components/header';
import { cn } from '@/lib/utils';
import { getFolderTree, getNoteById, updateNote, deleteNote, type Folder, type Note } from '@/lib/data';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  FileText,
  Save,
  Trash2,
  Eye,
  EyeOff,
  Clock,
  Folder as FolderIcon,
  ArrowLeft,
  MoreHorizontal,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';

function MarkdownPreview({ content }: { content: string }) {
  const renderMarkdown = (text: string) => {
    let html = text
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-4 mb-2 text-[#171717]">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-5 mb-3 text-[#171717]">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-6 mb-4 text-[#171717]">$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-[#171717]">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded-lg bg-[#FAFAFC] text-sm font-mono text-[#6D4AFF]">$1</code>')
      .replace(/^\- (.*$)/gim, '<li class="ml-4 list-disc text-[#171717]">$1</li>')
      .replace(/^\d+\. (.*$)/gim, '<li class="ml-4 list-decimal text-[#171717]">$1</li>')
      .replace(/\[\[(.*?)\]\]/g, '<span class="text-[#6D4AFF] underline cursor-pointer">[[$1]]</span>')
      .replace(/\n/g, '<br />');
    return html;
  };

  return (
    <div
      className="prose prose-sm max-w-none prose-headings:font-semibold prose-p:my-1.5 prose-li:my-0.5"
      dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
    />
  );
}

export default function NoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const noteId = params.id as string;

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [note, setNote] = useState<Note | null>(null);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [showPreview, setShowPreview] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [foldersData, noteData] = await Promise.all([getFolderTree(), getNoteById(noteId)]);
        setFolders(foldersData);
        if (noteData) {
          setNote(noteData);
          setTitle(noteData.title);
          setContent(noteData.content);
        }
      } catch (err) {
        console.error('Failed to load note:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [noteId]);

  const handleSave = useCallback(async () => {
    if (!note) return;
    setSaving(true);
    try {
      await updateNote(note.id, { title, content, word_count: content.split(/\s+/).filter(Boolean).length });
      setLastSaved(new Date());
    } catch (err) {
      console.error('Failed to save:', err);
    } finally {
      setSaving(false);
    }
  }, [note, title, content]);

  const handleDelete = async () => {
    if (!note) return;
    if (confirm('Are you sure you want to delete this note?')) {
      try {
        await deleteNote(note.id);
        router.push('/notes');
      } catch (err) {
        console.error('Failed to delete:', err);
      }
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (note && (title !== note.title || content !== note.content)) {
        handleSave();
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [title, content, note, handleSave]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFC]">
        <div className="flex items-center justify-center h-screen">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-[#6D4AFF]/30 border-t-[#6D4AFF] rounded-full animate-spin" />
            <p className="text-sm text-[#9CA3AF]">Loading note...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="min-h-screen bg-[#FAFAFC]">
        <Sidebar folders={folders} isCollapsed={isCollapsed} onToggleCollapse={() => setIsCollapsed(!isCollapsed)} />
        <Header isCollapsed={isCollapsed} />
        <main className={cn('pt-16 min-h-screen flex items-center justify-center', isCollapsed ? 'pl-16' : 'pl-[280px]')}>
          <div className="text-center">
            <FileText className="w-12 h-12 mx-auto mb-4 text-[#9CA3AF]/30" />
            <p className="text-lg font-semibold text-[#171717]">Note not found</p>
            <Button variant="outline" className="mt-4" onClick={() => router.push('/notes')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Notes
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFC]">
      <Sidebar folders={folders} isCollapsed={isCollapsed} onToggleCollapse={() => setIsCollapsed(!isCollapsed)} />
      <Header isCollapsed={isCollapsed} />

      <main
        className={cn(
          'pt-16 min-h-screen transition-all duration-300 ease-out',
          isCollapsed ? 'pl-16' : 'pl-[280px]'
        )}
      >
        {/* Note Toolbar */}
        <div className="sticky top-16 z-30 bg-white/80 backdrop-blur-xl border-b border-[#ECECF3]">
          <div className="flex items-center justify-between px-6 py-3">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => router.push('/notes')} className="h-9 text-[#9CA3AF] hover:text-[#171717]">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
              <div className="h-4 w-px bg-[#ECECF3]" />
              <span className="text-sm text-[#9CA3AF]">
                {saving ? 'Saving...' : lastSaved ? `Saved ${lastSaved.toLocaleTimeString()}` : 'Unsaved'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
                className="h-9 text-[#9CA3AF] hover:text-[#171717]"
              >
                {showPreview ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                {showPreview ? 'Hide Preview' : 'Show Preview'}
              </Button>
              <Button variant="ghost" size="sm" onClick={handleSave} className="h-9 text-[#9CA3AF] hover:text-[#171717]">
                <Save className="w-4 h-4 mr-1" />
                Save
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-[#9CA3AF] hover:text-[#171717]">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-xl border-[#ECECF3]">
                  <DropdownMenuItem onClick={handleDelete} className="text-red-500 cursor-pointer rounded-lg">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Note
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        <div className="flex">
          {/* Editor */}
          <div className={cn('flex-1 min-h-[calc(100vh-8rem)]', showPreview ? 'w-1/2' : 'w-full')}>
            <div className="p-8 max-w-3xl mx-auto">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-3xl font-bold bg-transparent border-0 outline-none placeholder:text-[#9CA3AF]/40 mb-6 text-[#171717]"
                placeholder="Note title..."
              />
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full min-h-[60vh] bg-transparent border-0 resize-none outline-none focus-visible:ring-0 focus-visible:ring-offset-0 text-sm leading-relaxed font-mono text-[#171717] placeholder:text-[#9CA3AF]/40"
                placeholder="Start writing..."
              />
            </div>
          </div>

          {/* Preview */}
          {showPreview && (
            <div className="w-1/2 border-l border-[#ECECF3] min-h-[calc(100vh-8rem)] bg-white">
              <div className="p-8 max-w-3xl">
                <h1 className="text-3xl font-bold mb-6 text-[#171717]">{title || 'Untitled'}</h1>
                <MarkdownPreview content={content} />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
