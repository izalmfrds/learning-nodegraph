'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Sidebar } from '@/components/sidebar';
import { Header } from '@/components/header';
import { cn } from '@/lib/utils';
import { getFolderTree, getNotes, getNoteLinks, type Folder, type Note, type NoteLink } from '@/lib/data';
import GraphView from '@/components/graph/GraphView';
import GraphToolbar from '@/components/graph/GraphToolbar';
import GraphSidebar from '@/components/graph/GraphSidebar';
import GraphLegend from '@/components/graph/GraphLegend';
import GraphMiniMap from '@/components/graph/GraphMiniMap';
import type { GraphNodeData, GraphNodeType } from '@/components/graph/GraphNode';
import type { GraphEdgeData } from '@/components/graph/GraphEdge';
import { useRouter } from 'next/navigation';

function noteToGraphNode(note: Note): GraphNodeData {
  return {
    id: note.id,
    label: note.title,
    type: 'note',
    description: note.content.slice(0, 200),
    created_at: note.created_at,
    updated_at: note.updated_at,
    word_count: note.word_count,
    folder_id: note.folder_id,
    note: {
      id: note.id,
      title: note.title,
      content: note.content,
      folder_id: note.folder_id,
      word_count: note.word_count,
      created_at: note.created_at,
      updated_at: note.updated_at,
      folder: note.folder || null,
      tags: note.tags || [],
    },
  };
}

function folderToGraphNode(folder: Folder): GraphNodeData {
  return {
    id: folder.id,
    label: folder.name,
    type: 'folder',
    created_at: folder.created_at,
    updated_at: folder.updated_at,
    color: folder.color || undefined,
  };
}

function buildGraphData(notes: Note[], links: NoteLink[], folders: Folder[]) {
  const nodes: GraphNodeData[] = [];
  const edges: GraphEdgeData[] = [];
  const nodeIds = new Set<string>();

  for (const note of notes) {
    nodes.push(noteToGraphNode(note));
    nodeIds.add(note.id);
  }

  const allFolders = folders.flatMap((f) => [f, ...(f.children || [])]);
  for (const folder of allFolders) {
    if (!nodeIds.has(folder.id)) {
      nodes.push(folderToGraphNode(folder));
      nodeIds.add(folder.id);
    }
  }

  for (const note of notes) {
    if (note.folder_id && nodeIds.has(note.folder_id)) {
      edges.push({
        id: `folder-note-${note.id}`,
        source: note.folder_id,
        target: note.id,
        label: 'contains',
      });
    }
  }

  for (const link of links) {
    if (nodeIds.has(link.source_note_id) && nodeIds.has(link.target_note_id)) {
      edges.push({
        id: link.id,
        source: link.source_note_id,
        target: link.target_note_id,
        label: link.link_text || 'links',
      });
    }
  }

  for (const folder of allFolders) {
    if (folder.parent_id && nodeIds.has(folder.parent_id)) {
      edges.push({
        id: `folder-parent-${folder.id}`,
        source: folder.parent_id,
        target: folder.id,
        label: 'contains',
      });
    }
  }

  return { nodes, edges };
}

export default function GraphPage() {
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [links, setLinks] = useState<NoteLink[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedNode, setSelectedNode] = useState<GraphNodeData | null>(null);
  const [showLabels, setShowLabels] = useState(true);
  const [filterTypes, setFilterTypes] = useState<GraphNodeType[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const graphControlsRef = useRef<{ fitView: () => void; resetLayout: () => void; zoomIn: () => void; zoomOut: () => void } | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [foldersData, notesData, linksData] = await Promise.all([
          getFolderTree(),
          getNotes(),
          getNoteLinks(),
        ]);
        setFolders(foldersData);
        setNotes(notesData);
        setLinks(linksData);
      } catch (err) {
        console.error('Failed to load graph data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const { nodes, edges } = useMemo(() => {
    return buildGraphData(notes, links, folders);
  }, [notes, links, folders]);

  const handleNodeSelect = useCallback((node: GraphNodeData | null) => {
    setSelectedNode(node);
  }, []);

  const handleNodeDoubleClick = useCallback((node: GraphNodeData) => {
    if (node.note?.id) {
      router.push(`/notes/${node.note.id}`);
    } else if (node.type === 'folder') {
      router.push(`/folder/${node.id}`);
    }
  }, [router]);

  const handleFitView = useCallback(() => {
    graphControlsRef.current?.fitView();
  }, []);

  const handleResetLayout = useCallback(() => {
    graphControlsRef.current?.resetLayout();
  }, []);

  const handleZoomIn = useCallback(() => {
    graphControlsRef.current?.zoomIn();
  }, []);

  const handleZoomOut = useCallback(() => {
    graphControlsRef.current?.zoomOut();
  }, []);

  const relatedNodes = useMemo(() => {
    if (!selectedNode) return [];
    const connected = edges
      .filter((e) => e.source === selectedNode.id || e.target === selectedNode.id)
      .map((e) => {
        const otherId = e.source === selectedNode.id ? e.target : e.source;
        const other = nodes.find((n) => n.id === otherId);
        return other ? { id: other.id, label: other.label, type: other.type } : null;
      })
      .filter(Boolean) as { id: string; label: string; type: string }[];
    return connected;
  }, [selectedNode, edges, nodes]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F8FA]">
        <div className="flex items-center justify-center h-screen">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-[#6D4AFF]/30 border-t-[#6D4AFF] rounded-full animate-spin" />
            <p className="text-sm text-[#9CA3AF]">Loading graph...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('min-h-screen bg-[#F7F8FA]', isFullscreen && 'fixed inset-0 z-50')}>
      {!isFullscreen && (
        <>
          <Sidebar folders={folders} isCollapsed={isCollapsed} onToggleCollapse={() => setIsCollapsed(!isCollapsed)} />
          <Header isCollapsed={isCollapsed} />
        </>
      )}

      <main
        className={cn(
          'h-screen transition-all duration-300 ease-out flex flex-col',
          !isFullscreen && (isCollapsed ? 'pl-16 pt-16' : 'pl-[280px] pt-16')
        )}
      >
        <GraphToolbar
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onFitView={handleFitView}
          onResetLayout={handleResetLayout}
          onToggleLabels={() => setShowLabels((v) => !v)}
          onSearch={setSearchQuery}
          onFilterChange={setFilterTypes}
          showLabels={showLabels}
          nodeCount={nodes.length}
          edgeCount={edges.length}
          isFullscreen={isFullscreen}
          onToggleFullscreen={() => setIsFullscreen((v) => !v)}
        />

        <div className="flex-1 relative overflow-hidden">
          <GraphView
            nodes={nodes}
            edges={edges}
            onNodeSelect={handleNodeSelect}
            onNodeDoubleClick={handleNodeDoubleClick}
            showLabels={showLabels}
            filterTypes={filterTypes}
            searchQuery={searchQuery}
            onExposeControls={(api) => { graphControlsRef.current = api; }}
          />

          <GraphLegend />
          <GraphMiniMap nodes={nodes} edges={edges} />

          {selectedNode && (
            <GraphSidebar
              node={selectedNode}
              onClose={() => setSelectedNode(null)}
              relatedNodes={relatedNodes}
            />
          )}
        </div>
      </main>
    </div>
  );
}
