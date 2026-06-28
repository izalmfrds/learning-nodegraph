'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/sidebar';
import { Header } from '@/components/header';
import { cn } from '@/lib/utils';
import { getFolderTree, getNotesByFolder, type Folder, type Note } from '@/lib/data';
import Link from 'next/link';
import { FileText, Clock, ArrowUpRight, Folder as FolderIcon, ArrowLeft, SortAsc, SortDesc } from 'lucide-react';

export default function FolderPage() {
  const params = useParams();
  const router = useRouter();
  const folderId = params.id as string;

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [folder, setFolder] = useState<Folder | null>(null);
  const [sortBy, setSortBy] = useState<'updated' | 'title'>('updated');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const foldersData = await getFolderTree();
        setFolders(foldersData);

        const allFolders = foldersData.flatMap((f) => [f, ...(f.children || [])]);
        const currentFolder = allFolders.find((f) => f.id === folderId);
        setFolder(currentFolder || null);

        const notesData = await getNotesByFolder(folderId);
        setNotes(notesData);
      } catch (err) {
        console.error('Failed to load folder:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [folderId]);

  const sortedNotes = [...notes].sort((a, b) => {
    let cmp = 0;
    if (sortBy === 'updated') cmp = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
    else cmp = a.title.localeCompare(b.title);
    return sortOrder === 'asc' ? cmp : -cmp;
  });

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return `${Math.floor(days / 30)}mo ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFC]">
        <div className="flex items-center justify-center h-screen">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-[#6D4AFF]/30 border-t-[#6D4AFF] rounded-full animate-spin" />
            <p className="text-sm text-[#9CA3AF]">Loading folder...</p>
          </div>
        </div>
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
        <div className="max-w-5xl mx-auto p-8 space-y-8">
          {/* Header */}
          <div className="flex items-start gap-4">
            <button
              onClick={() => router.push('/')}
              className="flex items-center justify-center w-9 h-9 rounded-xl text-[#9CA3AF] hover:text-[#171717] hover:bg-[#F4F1FF] transition-all duration-200 mt-1"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <FolderIcon className="w-5 h-5" style={{ color: folder?.color || '#6D4AFF' }} />
                <h1 className="text-3xl font-bold tracking-tight text-[#171717]">{folder?.name || 'Unknown Folder'}</h1>
              </div>
              <p className="text-sm text-[#9CA3AF] mt-2">{notes.length} notes</p>
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSortBy('updated')}
              className={cn(
                'flex items-center gap-2 h-9 px-3 rounded-xl text-xs font-medium transition-all duration-200',
                sortBy === 'updated' ? 'bg-[#F4F1FF] text-[#6D4AFF]' : 'text-[#9CA3AF] hover:bg-[#FAFAFC]'
              )}
            >
              <Clock className="w-3.5 h-3.5" />
              Updated
            </button>
            <button
              onClick={() => setSortBy('title')}
              className={cn(
                'flex items-center gap-2 h-9 px-3 rounded-xl text-xs font-medium transition-all duration-200',
                sortBy === 'title' ? 'bg-[#F4F1FF] text-[#6D4AFF]' : 'text-[#9CA3AF] hover:bg-[#FAFAFC]'
              )}
            >
              <SortAsc className="w-3.5 h-3.5" />
              Title
            </button>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="flex items-center justify-center w-9 h-9 rounded-xl text-[#9CA3AF] hover:bg-[#FAFAFC] transition-all duration-200"
            >
              {sortOrder === 'asc' ? <SortAsc className="w-3.5 h-3.5" /> : <SortDesc className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Notes */}
          <div className="grid grid-cols-1 gap-3">
            {sortedNotes.map((note) => (
              <Link key={note.id} href={`/notes/${note.id}`}>
                <div className="group flex items-center gap-4 p-5 rounded-2xl bg-white border border-[#ECECF3] hover:border-[#6D4AFF]/30 hover:bg-[#FAFAFC] transition-all duration-300 ease-out cursor-pointer">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#FAFAFC] shrink-0 group-hover:bg-[#F4F1FF] transition-colors duration-200">
                    <FileText className="w-5 h-5 text-[#9CA3AF] group-hover:text-[#6D4AFF] transition-colors duration-200" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-[#171717] truncate">{note.title}</h3>
                      <ArrowUpRight className="w-4 h-4 text-[#9CA3AF] opacity-0 group-hover:opacity-100 transition-all duration-200 shrink-0" />
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-xs text-[#9CA3AF]">
                      <span>{timeAgo(note.updated_at)}</span>
                      <span className="w-1 h-1 rounded-full bg-[#ECECF3]" />
                      <span>{note.word_count} words</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
            {sortedNotes.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-[#9CA3AF]">
                <FileText className="w-12 h-12 mb-4 opacity-20" />
                <p className="text-sm">No notes in this folder</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
