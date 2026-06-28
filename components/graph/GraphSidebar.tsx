'use client';

import Link from 'next/link';
import { X, ExternalLink, Clock, FileText, Folder as FolderIcon, Tag, GitBranch } from 'lucide-react';
import type { GraphNodeData } from './GraphNode';
import { getNodeConfig } from './GraphNode';

interface GraphSidebarProps {
  node: GraphNodeData | null;
  onClose: () => void;
  relatedNodes?: { id: string; label: string; type: string }[];
}

export default function GraphSidebar({ node, onClose, relatedNodes }: GraphSidebarProps) {
  if (!node) return null;

  const cfg = getNodeConfig(node.type);
  const timeAgo = (date?: string) => {
    if (!date) return 'Unknown';
    const diff = Date.now() - new Date(date).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return `${Math.floor(days / 30)}mo ago`;
  };

  const noteUrl = node.note?.id ? `/notes/${node.note.id}` : undefined;

  return (
    <div className="absolute top-0 right-0 h-full w-[300px] bg-white/95 backdrop-blur-xl border-l border-[#ECECF3] z-30 flex flex-col shadow-2xl shadow-black/8 animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#ECECF3]">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF]">Node Details</span>
        <button
          onClick={onClose}
          className="flex items-center justify-center w-7 h-7 rounded-lg text-[#9CA3AF] hover:text-[#171717] hover:bg-[#FAFAFC] transition-all duration-200"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Type badge */}
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cfg.color }} />
          <span
            className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-lg"
            style={{ backgroundColor: `${cfg.color}15`, color: cfg.color }}
          >
            {node.type.replace('_', ' ')}
          </span>
        </div>

        {/* Title */}
        <div>
          <h2 className="text-lg font-bold text-[#171717] leading-tight">{node.label}</h2>
          {node.description && (
            <p className="text-sm text-[#6B7280] mt-2 leading-relaxed line-clamp-4">{node.description}</p>
          )}
        </div>

        {/* Properties */}
        <div className="space-y-2.5">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]">Properties</h3>
          <div className="bg-[#FAFAFC] rounded-xl border border-[#ECECF3] p-3 space-y-2.5">
            {node.created_at && (
              <div className="flex items-center gap-3 text-sm">
                <Clock className="w-3.5 h-3.5 text-[#9CA3AF] shrink-0" />
                <span className="text-[#9CA3AF]">Created</span>
                <span className="text-[#374151] ml-auto text-xs">{timeAgo(node.created_at)}</span>
              </div>
            )}
            {node.updated_at && (
              <div className="flex items-center gap-3 text-sm">
                <Clock className="w-3.5 h-3.5 text-[#9CA3AF] shrink-0" />
                <span className="text-[#9CA3AF]">Updated</span>
                <span className="text-[#374151] ml-auto text-xs">{timeAgo(node.updated_at)}</span>
              </div>
            )}
            {node.word_count !== undefined && (
              <div className="flex items-center gap-3 text-sm">
                <FileText className="w-3.5 h-3.5 text-[#9CA3AF] shrink-0" />
                <span className="text-[#9CA3AF]">Words</span>
                <span className="text-[#374151] ml-auto text-xs">{node.word_count}</span>
              </div>
            )}
            {node.folder_id && node.note?.folder && (
              <div className="flex items-center gap-3 text-sm">
                <FolderIcon className="w-3.5 h-3.5 text-[#9CA3AF] shrink-0" />
                <span className="text-[#9CA3AF]">Folder</span>
                <span className="text-[#374151] ml-auto text-xs truncate">{node.note.folder.name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Tags */}
        {node.note?.tags && node.note.tags.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]">Tags</h3>
            <div className="flex flex-wrap gap-1.5">
              {node.note.tags.map((tag) => (
                <span
                  key={tag.name}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-[#F4F1FF] text-[#6D4AFF] border border-[#6D4AFF]/15 font-medium"
                >
                  {tag.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Related */}
        {relatedNodes && relatedNodes.length > 0 && (
          <div className="space-y-2.5">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]">
              Connected ({relatedNodes.length})
            </h3>
            <div className="space-y-1.5">
              {relatedNodes.map((rel) => {
                const relCfg = getNodeConfig(rel.type as any);
                return (
                  <div
                    key={rel.id}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-[#FAFAFC] border border-[#ECECF3] hover:border-[#6D4AFF]/20 hover:bg-[#F4F1FF] transition-all duration-200"
                  >
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: relCfg.color }} />
                    <span className="text-xs text-[#374151] flex-1 truncate">{rel.label}</span>
                    <span
                      className="text-[10px] uppercase px-1.5 py-0.5 rounded-md shrink-0 font-medium"
                      style={{ backgroundColor: `${relCfg.color}15`, color: relCfg.color }}
                    >
                      {rel.type.replace('_', ' ')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      {noteUrl && (
        <div className="p-4 border-t border-[#ECECF3]">
          <Link href={noteUrl}>
            <button className="w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-[#6D4AFF] hover:bg-[#5B3EF5] text-white text-sm font-medium transition-all duration-200 shadow-lg shadow-[#6D4AFF]/20">
              <ExternalLink className="w-4 h-4" />
              Open Note
            </button>
          </Link>
        </div>
      )}
    </div>
  );
}
