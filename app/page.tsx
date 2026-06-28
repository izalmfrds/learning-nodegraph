'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/sidebar';
import { Header } from '@/components/header';
import { cn } from '@/lib/utils';
import { getFolderTree, getRecentNotes, getStats, type Folder, type Note } from '@/lib/data';
import {
  FileText,
  Folder as FolderIcon,
  Tag,
  Link2,
  Clock,
  ArrowUpRight,
  Plus,
  TrendingUp,
  Compass,
  GitBranch,
  Search,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';

function StatCard({ icon: Icon, label, value, trend, color }: { icon: any; label: string; value: number; trend?: string; color: string }) {
  return (
    <div className="group relative bg-white border border-[#ECECF3] rounded-2xl p-6 hover:border-[#6D4AFF]/30 transition-all duration-300 ease-out hover:shadow-lg hover:shadow-[#6D4AFF]/5">
      <div className="flex items-start justify-between">
        <div className={cn('flex items-center justify-center w-11 h-11 rounded-xl', color)}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {trend && (
          <div className="flex items-center gap-1 text-xs text-emerald-500 font-semibold bg-emerald-50 px-2 py-1 rounded-lg">
            <TrendingUp className="w-3 h-3" />
            {trend}
          </div>
        )}
      </div>
      <div className="mt-5">
        <p className="text-3xl font-bold tracking-tight text-[#171717]">{value}</p>
        <p className="text-sm text-[#9CA3AF] mt-1">{label}</p>
      </div>
    </div>
  );
}

function QuickAction({ icon: Icon, label, description, href }: { icon: any; label: string; description: string; href: string }) {
  return (
    <Link href={href}>
      <div className="flex items-start gap-4 p-5 rounded-2xl bg-white border border-[#ECECF3] hover:border-[#6D4AFF]/30 hover:bg-[#FAFAFC] transition-all duration-300 ease-out cursor-pointer group">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#F4F1FF] text-[#6D4AFF] shrink-0 group-hover:bg-[#6D4AFF]/10 transition-colors duration-200">
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#171717]">{label}</p>
          <p className="text-xs text-[#9CA3AF] mt-1">{description}</p>
        </div>
      </div>
    </Link>
  );
}

function NoteCard({ note }: { note: Note }) {
  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return `${Math.floor(days / 30)}mo ago`;
  };

  return (
    <Link href={`/notes/${note.id}`}>
      <div className="group flex items-start gap-4 p-5 rounded-2xl bg-white border border-[#ECECF3] hover:border-[#6D4AFF]/30 hover:bg-[#FAFAFC] transition-all duration-300 ease-out cursor-pointer">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#FAFAFC] shrink-0 group-hover:bg-[#F4F1FF] transition-colors duration-200">
          <FileText className="w-5 h-5 text-[#9CA3AF] group-hover:text-[#6D4AFF] transition-colors duration-200" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-[#171717] truncate">{note.title}</h3>
            <ArrowUpRight className="w-4 h-4 text-[#9CA3AF] opacity-0 group-hover:opacity-100 transition-all duration-200 shrink-0" />
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-[#9CA3AF]">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {timeAgo(note.updated_at)}
            </span>
            {note.folder && (
              <>
                <span className="w-1 h-1 rounded-full bg-[#ECECF3]" />
                <span className="truncate">{note.folder.name}</span>
              </>
            )}
            <span className="w-1 h-1 rounded-full bg-[#ECECF3]" />
            <span>{note.word_count} words</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function DashboardPage() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [recentNotes, setRecentNotes] = useState<Note[]>([]);
  const [stats, setStats] = useState({ notes: 0, folders: 0, tags: 0, links: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [foldersData, notesData, statsData] = await Promise.all([
          getFolderTree(),
          getRecentNotes(8),
          getStats(),
        ]);
        setFolders(foldersData);
        setRecentNotes(notesData);
        setStats(statsData);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFC]">
        <div className="flex items-center justify-center h-screen">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-[#6D4AFF]/30 border-t-[#6D4AFF] rounded-full animate-spin" />
            <p className="text-sm text-[#9CA3AF]">Loading dashboard...</p>
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
        <div className="max-w-6xl mx-auto p-8 space-y-10">
          {/* Welcome */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#6D4AFF]" />
              <span className="text-xs font-semibold uppercase tracking-wider text-[#6D4AFF]">AI Skill</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-[#171717]">Dashboard</h1>
            <p className="text-sm text-[#9CA3AF]">Your knowledge workspace at a glance</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard icon={FileText} label="Total Notes" value={stats.notes} trend="+12%" color="bg-[#6D4AFF]" />
            <StatCard icon={FolderIcon} label="Folders" value={stats.folders} color="bg-emerald-500" />
            <StatCard icon={Tag} label="Tags" value={stats.tags} color="bg-amber-500" />
            <StatCard icon={Link2} label="Internal Links" value={stats.links} trend="+5" color="bg-[#8B5CF6]" />
          </div>

          {/* Quick Actions */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF] mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <QuickAction icon={Plus} label="Create Note" description="Start a new note" href="/notes/new" />
              <QuickAction icon={Compass} label="Open Explorer" description="Browse all files" href="/explorer" />
              <QuickAction icon={GitBranch} label="Graph View" description="Visualize connections" href="/graph" />
              <QuickAction icon={Search} label="Search" description="Find anything fast" href="/search" />
            </div>
          </section>

          {/* Recent Notes */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF]">Recent Files</h2>
              <Link href="/explorer" className="text-xs text-[#6D4AFF] hover:underline font-medium">View all</Link>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {recentNotes.map((note) => (
                <NoteCard key={note.id} note={note} />
              ))}
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}
