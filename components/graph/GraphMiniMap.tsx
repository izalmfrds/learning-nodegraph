'use client';

import { useEffect, useRef, useState } from 'react';
import type { GraphNodeData } from './GraphNode';
import type { GraphEdgeData } from './GraphEdge';

interface GraphMiniMapProps {
  nodes: GraphNodeData[];
  edges: GraphEdgeData[];
}

export default function GraphMiniMap({ nodes, edges }: GraphMiniMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || nodes.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = isExpanded ? 200 : 120;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Compute bounds
    const xs = nodes.map((n) => 0); // We don't have positions, use random for visual
    const ys = nodes.map((n) => 0);

    // Simple circular layout for minimap
    const cx = size / 2;
    const cy = size / 2;
    const radius = size * 0.35;

    ctx.clearRect(0, 0, size, size);

    // Background
    ctx.fillStyle = '#0B0C15';
    ctx.fillRect(0, 0, size, size);

    // Border
    ctx.strokeStyle = '#1E2030';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, size, size);

    // Draw edges
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.1)';
    ctx.lineWidth = 0.5;
    for (const edge of edges) {
      const sIdx = nodes.findIndex((n) => n.id === edge.source);
      const tIdx = nodes.findIndex((n) => n.id === edge.target);
      if (sIdx === -1 || tIdx === -1) continue;
      const sAngle = (sIdx / nodes.length) * Math.PI * 2;
      const tAngle = (tIdx / nodes.length) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(sAngle) * radius, cy + Math.sin(sAngle) * radius);
      ctx.lineTo(cx + Math.cos(tAngle) * radius, cy + Math.sin(tAngle) * radius);
      ctx.stroke();
    }

    // Draw nodes
    for (let i = 0; i < nodes.length; i++) {
      const angle = (i / nodes.length) * Math.PI * 2;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;
      const cfg = getNodeColor(nodes[i].type);

      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fillStyle = cfg;
      ctx.fill();
    }
  }, [nodes, edges, isExpanded]);

  return (
    <div className="absolute bottom-5 right-5 z-20">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="bg-[#0F111A]/95 backdrop-blur border border-[#1E2030] rounded-xl overflow-hidden shadow-xl shadow-black/30 transition-all duration-300 hover:border-[#6D4AFF]/30"
      >
        <canvas
          ref={canvasRef}
          style={{ width: isExpanded ? 200 : 120, height: isExpanded ? 200 : 120 }}
        />
      </button>
    </div>
  );
}

function getNodeColor(type: string): string {
  const map: Record<string, string> = {
    workspace: '#6D4AFF',
    agent: '#10B981',
    skill: '#F59E0B',
    workflow: '#3B82F6',
    document: '#EC4899',
    memory: '#8B5CF6',
    telegram_chat: '#06B6D4',
    prompt: '#F43F5E',
    folder: '#6D4AFF',
    file: '#9CA3AF',
    note: '#6D4AFF',
  };
  return map[type] || '#6D4AFF';
}
