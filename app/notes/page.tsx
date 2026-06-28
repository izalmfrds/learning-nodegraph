'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/sidebar';
import { Header } from '@/components/header';
import { cn } from '@/lib/utils';
import { getFolderTree, getNotes, type Folder, type Note } from '@/lib/data';
import Link from 'next/link';
import { FileText, Clock, ArrowUpRight, Filter, SortAsc, SortDesc, Folder as FolderIcon, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function NotesPage() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [sortBy, setSortBy] = useState<'updated' | 'created' | 'title'>('updated');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [foldersData, notesData] = await Promise.all([getFolderTree(), getNotes()]);
        setFolders(foldersData);
        setNotes(notesData);
        setFilteredNotes(notesData);
      } catch (err) {
        console.error('Failed to load notes:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    let result = [...notes];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (n) => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'updated') cmp = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
      else if (sortBy === 'created') cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      else cmp = a.title.localeCompare(b.title);
      return sortOrder === 'asc' ? cmp : -cmp;
    });

    setFilteredNotes(result);
  }, [notes, searchQuery, sortBy, sortOrder]);

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
            <p className="text-sm text-[#9CA3AF]">Loading notes...</p>
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
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-[#171717]">All Notes</h1>
            <p className="text-sm text-[#9CA3AF]">{filteredNotes.length} notes in your vault</p>
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-4">
            <div className="flex-1 max-w-sm relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
              <Input
                type="text"
                placeholder="Filter notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 bg-white border-[#ECECF3] text-sm"
              />
            </div>
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
                onClick={() => setSortBy('created')}
                className={cn(
                  'flex items-center gap-2 h-9 px-3 rounded-xl text-xs font-medium transition-all duration-200',
                  sortBy === 'created' ? 'bg-[#F4F1FF] text-[#6D4AFF]' : 'text-[#9CA3AF] hover:bg-[#FAFAFC]'
                )}
              >
                <Filter className="w-3.5 h-3.5" />
                Created
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
          </div>

          {/* Notes Grid */}
          <div className="grid grid-cols-1 gap-3">
            {filteredNotes.map((note) => (
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
                      {note.folder && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-[#ECECF3]" />
                          <span className="flex items-center gap-1">
                            <FolderIcon className="w-3 h-3" />
                            {note.folder.name}
                          </span>
                        </>
                      )}
                      <span className="w-1 h-1 rounded-full bg-[#ECECF3]" />
                      <span>{note.word_count} words</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
            {filteredNotes.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-[#9CA3AF]">
                <FileText className="w-12 h-12 mb-4 opacity-20" />
                <p className="text-sm">No notes found</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
