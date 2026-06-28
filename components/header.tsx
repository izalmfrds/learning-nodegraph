'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Search, Command, Settings, Bell, Plus, FileText, FolderPlus, Upload, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface HeaderProps {
  isCollapsed: boolean;
}

export function Header({ isCollapsed }: HeaderProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (searchQuery.trim()) {
        router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      }
    },
    [searchQuery, router]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('global-search');
        searchInput?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header
      className={cn(
        'fixed top-0 right-0 h-16 bg-white/80 backdrop-blur-xl border-b border-[#ECECF3] z-40 flex items-center gap-6 px-6 transition-all duration-300 ease-out',
        isCollapsed ? 'left-16' : 'left-[280px]'
      )}
    >
      {/* Breadcrumb */}
      <nav className="hidden md:flex items-center gap-2 text-sm shrink-0">
        <Link href="/" className="text-[#9CA3AF] hover:text-[#171717] transition-colors duration-200">
          Dashboard
        </Link>
        <span className="text-[#ECECF3]">/</span>
        <span className="text-[#171717] font-medium">Overview</span>
      </nav>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex-1 max-w-lg">
        <div
          className={cn(
            'relative flex items-center transition-all duration-200',
            isSearchFocused && 'ring-2 ring-[#6D4AFF]/20 rounded-xl'
          )}
        >
          <Search className="absolute left-3 w-4 h-4 text-[#9CA3AF] pointer-events-none" />
          <Input
            id="global-search"
            type="text"
            placeholder="Search notes, tags, folders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            className="pl-10 pr-16 h-10 bg-[#FAFAFC] border-[#ECECF3] text-sm placeholder:text-[#9CA3AF]/70 focus-visible:ring-[#6D4AFF]/20 focus-visible:border-[#6D4AFF]/40"
          />
          <div className="absolute right-3 flex items-center gap-0.5">
            <kbd className="hidden sm:inline-flex h-5 items-center rounded-lg border border-[#ECECF3] bg-white px-1.5 text-[10px] font-mono text-[#9CA3AF]">
              <Command className="w-2.5 h-2.5 mr-0.5" />K
            </kbd>
          </div>
        </div>
      </form>

      {/* Actions */}
      <div className="flex items-center gap-2 ml-auto shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 h-9 px-4 rounded-xl bg-[#6D4AFF] text-white text-sm font-medium hover:bg-[#5B3EF5] transition-all duration-200 shadow-sm shadow-[#6D4AFF]/20">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-xl border-[#ECECF3] shadow-lg shadow-black/5">
            <DropdownMenuItem onClick={() => router.push('/notes/new')} className="gap-2 cursor-pointer rounded-lg">
              <FileText className="w-4 h-4 text-[#6D4AFF]" />
              New Note
              <span className="ml-auto text-xs text-[#9CA3AF]">Ctrl+N</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 cursor-pointer rounded-lg">
              <FolderPlus className="w-4 h-4 text-[#6D4AFF]" />
              New Folder
              <span className="ml-auto text-xs text-[#9CA3AF]">Ctrl+Shift+N</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-[#ECECF3]" />
            <DropdownMenuItem className="gap-2 cursor-pointer rounded-lg">
              <Upload className="w-4 h-4 text-[#6D4AFF]" />
              Import Markdown
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 cursor-pointer rounded-lg">
              <RefreshCw className="w-4 h-4 text-[#6D4AFF]" />
              Sync Now
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <button className="flex items-center justify-center w-9 h-9 rounded-xl text-[#9CA3AF] hover:text-[#171717] hover:bg-[#F4F1FF] transition-all duration-200">
          <Bell className="w-[18px] h-[18px]" />
        </button>

        <Link
          href="/settings"
          className="flex items-center justify-center w-9 h-9 rounded-xl text-[#9CA3AF] hover:text-[#171717] hover:bg-[#F4F1FF] transition-all duration-200"
        >
          <Settings className="w-[18px] h-[18px]" />
        </Link>
      </div>
    </header>
  );
}
