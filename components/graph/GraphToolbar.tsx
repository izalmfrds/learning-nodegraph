'use client';

import { useState, useRef, useEffect } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  Search,
  X,
  Type,
  Filter,
  GitBranch,
} from 'lucide-react';
import type { GraphNodeType } from './GraphNode';
import { getNodeConfig } from './GraphNode';

interface GraphToolbarProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
  onResetLayout: () => void;
  onToggleLabels: () => void;
  onSearch: (query: string) => void;
  onFilterChange: (types: GraphNodeType[]) => void;
  showLabels: boolean;
  nodeCount: number;
  edgeCount: number;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

const ALL_TYPES: GraphNodeType[] = [
  'folder',
  'note',
  'workspace',
  'agent',
  'skill',
  'workflow',
  'document',
  'memory',
  'telegram_chat',
  'prompt',
  'file',
];

function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

export default function GraphToolbar({
  onZoomIn,
  onZoomOut,
  onFitView,
  onResetLayout,
  onToggleLabels,
  onSearch,
  onFilterChange,
  showLabels,
  nodeCount,
  edgeCount,
  isFullscreen,
  onToggleFullscreen,
}: GraphToolbarProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<GraphNodeType[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) searchInputRef.current.focus();
  }, [searchOpen]);

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    onSearch(q);
  };

  const toggleFilter = (type: GraphNodeType) => {
    const next = activeFilters.includes(type)
      ? activeFilters.filter((t) => t !== type)
      : [...activeFilters, type];
    setActiveFilters(next);
    onFilterChange(next);
  };

  const clearFilters = () => {
    setActiveFilters([]);
    onFilterChange([]);
  };

  return (
    <div className="flex items-center justify-between px-5 py-2.5 border-b border-[#ECECF3] bg-white/95 backdrop-blur-xl shrink-0 z-20">
      {/* Left: Title & Stats */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#6D4AFF]/10">
          <GitBranch className="w-4 h-4 text-[#6D4AFF]" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-[#171717]">Graph View</span>
          <span className="text-[11px] text-[#9CA3AF]">
            {nodeCount} nodes · {edgeCount} connections
          </span>
        </div>
      </div>

      {/* Center: Search */}
      <div className="flex-1 max-w-md mx-4">
        {searchOpen ? (
          <div className="flex items-center gap-2 bg-[#FAFAFC] rounded-xl border border-[#ECECF3] px-3 py-1.5">
            <Search className="w-4 h-4 text-[#9CA3AF] shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search nodes..."
              className="flex-1 bg-transparent text-sm text-[#171717] outline-none placeholder:text-[#9CA3AF]"
            />
            <button
              onClick={() => { setSearchOpen(false); handleSearch(''); }}
              className="text-[#9CA3AF] hover:text-[#171717] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 text-sm text-[#9CA3AF] hover:text-[#171717] transition-colors"
          >
            <Search className="w-4 h-4" />
            <span className="hidden sm:inline">Search nodes...</span>
          </button>
        )}
      </div>

      {/* Right: Controls */}
      <div className="flex items-center gap-1.5">
        {/* Filter */}
        <div className="relative">
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className={cn(
              'flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs font-medium transition-all duration-200',
              activeFilters.length > 0
                ? 'bg-[#6D4AFF]/10 text-[#6D4AFF]'
                : 'text-[#6B7280] hover:text-[#171717] hover:bg-[#FAFAFC]'
            )}
          >
            <Filter className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Filter</span>
            {activeFilters.length > 0 && (
              <span className="ml-0.5 text-[10px] bg-[#6D4AFF] text-white rounded-full px-1.5 py-0.5">
                {activeFilters.length}
              </span>
            )}
          </button>
          {filterOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setFilterOpen(false)} />
              <div className="absolute right-0 top-10 z-20 w-52 bg-white border border-[#ECECF3] rounded-2xl p-4 shadow-xl shadow-black/8 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#9CA3AF]">Node Types</span>
                  {activeFilters.length > 0 && (
                    <button onClick={clearFilters} className="text-[11px] text-[#6D4AFF] hover:underline">
                      Clear
                    </button>
                  )}
                </div>
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {ALL_TYPES.map((type) => {
                    const cfg = getNodeConfig(type);
                    const active = activeFilters.includes(type);
                    return (
                      <button
                        key={type}
                        onClick={() => toggleFilter(type)}
                        className={cn(
                          'flex items-center gap-2.5 w-full px-2.5 py-2 rounded-xl text-xs transition-all duration-200',
                          active ? 'bg-[#F4F1FF] text-[#6D4AFF]' : 'text-[#6B7280] hover:bg-[#FAFAFC] hover:text-[#171717]'
                        )}
                      >
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cfg.color }} />
                        <span className="capitalize flex-1 text-left">{type.replace('_', ' ')}</span>
                        {active && <div className="w-1.5 h-1.5 rounded-full bg-[#6D4AFF]" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="w-px h-5 bg-[#ECECF3] mx-1" />

        <button
          onClick={onToggleLabels}
          className={cn(
            'flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200',
            showLabels ? 'bg-[#6D4AFF]/10 text-[#6D4AFF]' : 'text-[#9CA3AF] hover:text-[#171717] hover:bg-[#FAFAFC]'
          )}
          title="Toggle labels"
        >
          <Type className="w-4 h-4" />
        </button>

        <button onClick={onZoomIn} className="flex items-center justify-center w-8 h-8 rounded-lg text-[#9CA3AF] hover:text-[#171717] hover:bg-[#FAFAFC] transition-all duration-200" title="Zoom in">
          <ZoomIn className="w-4 h-4" />
        </button>
        <button onClick={onZoomOut} className="flex items-center justify-center w-8 h-8 rounded-lg text-[#9CA3AF] hover:text-[#171717] hover:bg-[#FAFAFC] transition-all duration-200" title="Zoom out">
          <ZoomOut className="w-4 h-4" />
        </button>
        <button onClick={onFitView} className="flex items-center justify-center w-8 h-8 rounded-lg text-[#9CA3AF] hover:text-[#171717] hover:bg-[#FAFAFC] transition-all duration-200" title="Fit view">
          <Maximize2 className="w-4 h-4" />
        </button>
        <button onClick={onResetLayout} className="flex items-center justify-center w-8 h-8 rounded-lg text-[#9CA3AF] hover:text-[#171717] hover:bg-[#FAFAFC] transition-all duration-200" title="Reset layout">
          <RotateCcw className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-[#ECECF3] mx-1" />

        <button
          onClick={onToggleFullscreen}
          className="flex items-center justify-center w-8 h-8 rounded-lg text-[#9CA3AF] hover:text-[#171717] hover:bg-[#FAFAFC] transition-all duration-200"
          title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
