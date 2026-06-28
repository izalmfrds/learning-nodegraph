'use client';

import { useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { Folder } from '@/lib/supabase';
import {
  ChevronRight,
  ChevronDown,
  FileText,
  LayoutDashboard,
  GitBranch,
  Search,
  Settings,
  ChevronLeft,
  Compass,
  type LucideIcon,
} from 'lucide-react';

interface SidebarProps {
  folders: Folder[];
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

interface NavItem {
  icon: LucideIcon;
  label: string;
  href: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
  defaultOpen?: boolean;
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Overview',
    items: [{ icon: LayoutDashboard, label: 'Dashboard', href: '/' }],
    defaultOpen: true,
  },
  {
    title: 'Knowledge',
    items: [
      { icon: Compass, label: 'Explorer', href: '/explorer' },
      { icon: GitBranch, label: 'Graph View', href: '/graph' },
      { icon: Search, label: 'Search', href: '/search' },
    ],
    defaultOpen: true,
  },
  {
    title: 'System',
    items: [{ icon: Settings, label: 'Settings', href: '/settings' }],
    defaultOpen: true,
  },
];

function NavSectionGroup({
  section,
  pathname,
}: {
  section: NavSection;
  pathname: string;
}) {
  const [open, setOpen] = useState(section.defaultOpen ?? true);

  const isActive = useCallback(
    (path: string) => {
      if (path === '/' && pathname === '/') return true;
      if (path !== '/' && pathname.startsWith(path)) return true;
      return false;
    },
    [pathname]
  );

  const hasActiveItem = section.items.some((item) => isActive(item.href));

  return (
    <div className="flex flex-col">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center justify-between px-5 py-2 text-[11px] font-semibold uppercase tracking-wider transition-colors',
          hasActiveItem ? 'text-[#6D4AFF]' : 'text-[#9CA3AF] hover:text-[#171717]'
        )}
      >
        <span>{section.title}</span>
        <ChevronDown
          className={cn(
            'w-3.5 h-3.5 transition-transform duration-300',
            open ? 'rotate-0' : '-rotate-90'
          )}
        />
      </button>
      <div
        className={cn(
          'grid transition-all duration-300 ease-out',
          open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        )}
      >
        <div className="overflow-hidden">
          <nav className="flex flex-col gap-0.5 px-3 pb-2">
            {section.items.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 text-sm rounded-xl transition-all duration-200',
                    active
                      ? 'bg-[#6D4AFF]/10 text-[#6D4AFF] font-medium'
                      : 'text-[#6B7280] hover:text-[#171717] hover:bg-[#F4F1FF]'
                  )}
                >
                  <item.icon className="w-[18px] h-[18px] shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}

export function Sidebar({ folders: _folders, isCollapsed, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();

  const allItems = useMemo(() => NAV_SECTIONS.flatMap((s) => s.items), []);

  const isActive = useCallback(
    (path: string) => {
      if (path === '/' && pathname === '/') return true;
      if (path !== '/' && pathname.startsWith(path)) return true;
      return false;
    },
    [pathname]
  );

  if (isCollapsed) {
    return (
      <aside className="fixed left-0 top-0 h-screen w-16 bg-[#FAFAFC] border-r border-[#ECECF3] flex flex-col items-center py-4 z-50 transition-all duration-300 ease-out">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#6D4AFF]/10 mb-8">
          <FileText className="w-4 h-4 text-[#6D4AFF]" />
        </div>
        <nav className="flex flex-col gap-1 w-full px-2">
          {allItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={cn(
                'flex items-center justify-center w-full h-10 rounded-xl transition-all duration-200',
                isActive(item.href)
                  ? 'bg-[#6D4AFF]/10 text-[#6D4AFF]'
                  : 'text-[#9CA3AF] hover:text-[#171717] hover:bg-[#F4F1FF]'
              )}
            >
              <item.icon className="w-[18px] h-[18px]" />
            </Link>
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-1 w-full px-2">
          <button
            onClick={onToggleCollapse}
            className="flex items-center justify-center w-full h-10 rounded-xl text-[#9CA3AF] hover:text-[#171717] hover:bg-[#F4F1FF] transition-all duration-200"
            title="Expand sidebar"
          >
            <ChevronRight className="w-[18px] h-[18px]" />
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-[280px] bg-[#FAFAFC] border-r border-[#ECECF3] flex flex-col z-50 transition-all duration-300 ease-out">
      <div className="flex items-center gap-3 px-5 py-4">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#6D4AFF]/10 shrink-0">
          <FileText className="w-4 h-4 text-[#6D4AFF]" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-semibold text-[#171717] truncate">AI Skill</h1>
          <p className="text-[11px] text-[#9CA3AF] truncate">Module Navigation</p>
        </div>
        <button
          onClick={onToggleCollapse}
          className="flex items-center justify-center w-7 h-7 rounded-lg text-[#9CA3AF] hover:text-[#171717] hover:bg-[#F4F1FF] transition-all duration-200 shrink-0"
          title="Collapse sidebar"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      <div className="mx-4 my-1 h-px bg-[#ECECF3]" />

      <div className="flex-1 overflow-y-auto scrollbar-thin py-2">
        {NAV_SECTIONS.map((section) => (
          <NavSectionGroup
            key={section.title}
            section={section}
            pathname={pathname}
          />
        ))}
      </div>

      <div className="px-5 py-3 border-t border-[#ECECF3]">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
          <span className="text-[11px] text-[#9CA3AF]">All systems operational</span>
        </div>
      </div>
    </aside>
  );
}
