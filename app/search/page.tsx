'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Sidebar } from '@/components/sidebar';
import { Header } from '@/components/header';
import { cn } from '@/lib/utils';
import { getFolderTree, searchNotes, getTags, type Folder, type Note, type Tag } from '@/lib/data';
import Link from 'next/link';
import { Search, FileText, Clock, Folder as FolderIcon, X, SlidersHorizontal, Tag as TagIcon, History, TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/input';

const RECENT_SEARCHES_KEY = 'ai-skill-recent-searches';

function loadRecentSearches(): string[] {
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveRecentSearch(query: string) {
  try {
    const recent = loadRecentSearches();
    const filtered = recent.filter((q) => q !== query);
    const updated = [query, ...filtered].slice(0, 8);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  } catch {}
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<'relevance' | 'updated' | 'created'>('relevance');
  const [filterFolder, setFilterFolder] = useState<string | null>(null);
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    getFolderTree().then(setFolders).catch(console.error);
    getTags().then(setTags).catch(console.error);
    setRecentSearches(loadRecentSearches());
  }, []);

  useEffect(() => {
    async function doSearch() {
      if (!query.trim()) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const data = await searchNotes(query);
        setResults(data);
        saveRecentSearch(query);
        setRecentSearches(loadRecentSearches());
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setLoading(false);
      }
    }
    const timeout = setTimeout(doSearch, 200);
    return () => clearTimeout(timeout);
  }, [query]);

  const filteredResults = useMemo(() => {
    let r = [...results];
    if (filterFolder) {
      r = r.filter((n) => n.folder_id === filterFolder);
    }
    if (filterTag) {
      r = r.filter((n) => n.tags?.some((t) => t.name === filterTag));
    }
    if (sortBy === 'updated') {
      r.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    } else if (sortBy === 'created') {
      r.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    return r;
  }, [results, filterFolder, filterTag, sortBy]);

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="bg-[#6D4AFF]/10 text-[#6D4AFF] rounded px-0.5 font-medium">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

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
    <div className="min-h-screen bg-[#FAFAFC]">
      <Sidebar folders={folders} isCollapsed={isCollapsed} onToggleCollapse={() => setIsCollapsed(!isCollapsed)} />
      <Header isCollapsed={isCollapsed} />

      <main
        className={cn(
          'pt-16 min-h-screen transition-all duration-300 ease-out',
          isCollapsed ? 'pl-16' : 'pl-[280px]'
        )}
      >
        <div className="max-w-4xl mx-auto p-8 space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-[#171717]">Search</h1>
            <p className="text-sm text-[#9CA3AF]">Find files, folders, tags, and content across your workspace</p>
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
            <Input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search your workspace..."
              className="pl-11 pr-20 h-12 bg-white border-[#ECECF3] text-base"
              autoFocus
            />
            {query ? (
              <button
                onClick={() => setQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#171717] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <kbd className="h-5 inline-flex items-center rounded-lg border border-[#ECECF3] bg-[#FAFAFC] px-1.5 text-[10px] font-mono text-[#9CA3AF]">
                  Cmd K
                </kbd>
              </div>
            )}
          </div>

          {/* Recent searches when no query */}
          {!query && recentSearches.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs text-[#9CA3AF]">
                <History className="w-3.5 h-3.5" />
                <span>Recent searches</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((term) => (
                  <button
                    key={term}
                    onClick={() => setQuery(term)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-[#ECECF3] text-xs text-[#6B7280] hover:text-[#171717] hover:border-[#6D4AFF]/30 transition-all duration-200"
                  >
                    <Clock className="w-3 h-3 text-[#9CA3AF]" />
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Filters */}
          {query && (
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2 text-xs text-[#9CA3AF] mr-2">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Filters:
              </div>
              <button
                onClick={() => setSortBy('relevance')}
                className={cn(
                  'h-8 px-3 rounded-xl text-xs font-medium transition-all duration-200',
                  sortBy === 'relevance' ? 'bg-[#F4F1FF] text-[#6D4AFF]' : 'bg-white text-[#9CA3AF] hover:bg-[#FAFAFC] border border-[#ECECF3]'
                )}
              >
                Relevance
              </button>
              <button
                onClick={() => setSortBy('updated')}
                className={cn(
                  'h-8 px-3 rounded-xl text-xs font-medium transition-all duration-200',
                  sortBy === 'updated' ? 'bg-[#F4F1FF] text-[#6D4AFF]' : 'bg-white text-[#9CA3AF] hover:bg-[#FAFAFC] border border-[#ECECF3]'
                )}
              >
                Recently Updated
              </button>
              <button
                onClick={() => setSortBy('created')}
                className={cn(
                  'h-8 px-3 rounded-xl text-xs font-medium transition-all duration-200',
                  sortBy === 'created' ? 'bg-[#F4F1FF] text-[#6D4AFF]' : 'bg-white text-[#9CA3AF] hover:bg-[#FAFAFC] border border-[#ECECF3]'
                )}
              >
                Recently Created
              </button>
              {filterFolder && (
                <button
                  onClick={() => setFilterFolder(null)}
                  className="h-8 px-3 rounded-xl text-xs font-medium bg-[#F4F1FF] text-[#6D4AFF] flex items-center gap-1.5"
                >
                  <FolderIcon className="w-3 h-3" />
                  {folders.flatMap((f) => [f, ...(f.children || [])]).find((f) => f.id === filterFolder)?.name}
                  <X className="w-3 h-3 ml-1" />
                </button>
              )}
              {filterTag && (
                <button
                  onClick={() => setFilterTag(null)}
                  className="h-8 px-3 rounded-xl text-xs font-medium bg-[#F4F1FF] text-[#6D4AFF] flex items-center gap-1.5"
                >
                  <TagIcon className="w-3 h-3" />
                  {filterTag}
                  <X className="w-3 h-3 ml-1" />
                </button>
              )}
            </div>
          )}

          {/* Tag filters */}
          {query && tags.length > 0 && !filterTag && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-[#9CA3AF]">Tags:</span>
              {tags.slice(0, 8).map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => setFilterTag(tag.name)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-[#ECECF3] text-xs text-[#6B7280] hover:text-[#6D4AFF] hover:border-[#6D4AFF]/30 transition-all duration-200"
                >
                  <TagIcon className="w-3 h-3" />
                  {tag.name}
                </button>
              ))}
            </div>
          )}

          {/* Results */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-[#6D4AFF]/30 border-t-[#6D4AFF] rounded-full animate-spin" />
            </div>
          ) : query ? (
            <div className="space-y-3">
              <p className="text-sm text-[#9CA3AF]">
                {filteredResults.length} result{filteredResults.length !== 1 ? 's' : ''} for &quot;{query}&quot;
              </p>
              {filteredResults.map((note) => (
                <Link key={note.id} href={`/notes/${note.id}`}>
                  <div className="group p-5 rounded-2xl bg-white border border-[#ECECF3] hover:border-[#6D4AFF]/30 hover:bg-[#FAFAFC] transition-all duration-300 ease-out">
                    <div className="flex items-start gap-4">
                      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#FAFAFC] shrink-0 group-hover:bg-[#F4F1FF] transition-colors duration-200">
                        <FileText className="w-5 h-5 text-[#9CA3AF] group-hover:text-[#6D4AFF] transition-colors duration-200" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-[#171717]">{highlightText(note.title, query)}</h3>
                        <p className="text-xs text-[#9CA3AF] mt-1.5 line-clamp-2">
                          {highlightText(note.content.slice(0, 200).replace(/[#*\[\]]/g, ''), query)}
                        </p>
                        <div className="flex items-center gap-2 mt-3 text-xs text-[#9CA3AF]">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {timeAgo(note.updated_at)}
                          </span>
                          {note.folder && (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                setFilterFolder(note.folder_id);
                              }}
                              className="flex items-center gap-1 hover:text-[#6D4AFF] transition-colors"
                            >
                              <FolderIcon className="w-3 h-3" />
                              {note.folder.name}
                            </button>
                          )}
                          <span>{note.word_count} words</span>
                          {note.tags && note.tags.length > 0 && (
                            <div className="flex items-center gap-1">
                              {note.tags.slice(0, 3).map((tag) => (
                                <span
                                  key={tag.id}
                                  className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-[#FAFAFC] text-[10px]"
                                >
                                  <TagIcon className="w-2.5 h-2.5" />
                                  {tag.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
              {filteredResults.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-[#9CA3AF]">
                  <Search className="w-12 h-12 mb-4 opacity-20" />
                  <p className="text-sm">No results found</p>
                  <p className="text-xs mt-1">Try a different search term</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-[#9CA3AF]">
              <Search className="w-14 h-14 mb-5 opacity-15" />
              <p className="text-sm">Type to search your workspace</p>
              <div className="flex gap-2 mt-5">
                {['meeting', 'sprint', 'research', 'design'].map((term) => (
                  <button
                    key={term}
                    onClick={() => setQuery(term)}
                    className="px-4 py-2 rounded-xl bg-white border border-[#ECECF3] text-xs text-[#9CA3AF] hover:text-[#171717] hover:border-[#6D4AFF]/30 transition-all duration-200"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
