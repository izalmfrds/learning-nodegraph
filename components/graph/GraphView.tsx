'use client';

import { useRef, useCallback, useEffect, useState, useMemo } from 'react';
import type { GraphNodeData, GraphNodeType } from './GraphNode';
import type { GraphEdgeData } from './GraphEdge';
import { getNodeConfig } from './GraphNode';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface SimNode {
  id: string;
  label: string;
  type: GraphNodeType;
  color: string;
  data: GraphNodeData;
  x: number;
  y: number;
  vx: number;
  vy: number;
  fx: number | null;
  fy: number | null;
}

interface SimLink {
  id: string;
  source: SimNode;
  target: SimNode;
  label?: string;
}

interface Transform {
  x: number;
  y: number;
  k: number;
}

interface GraphViewProps {
  nodes: GraphNodeData[];
  edges: GraphEdgeData[];
  onNodeSelect?: (node: GraphNodeData | null) => void;
  onNodeDoubleClick?: (node: GraphNodeData) => void;
  showLabels: boolean;
  filterTypes: GraphNodeType[];
  searchQuery: string;
  onExposeControls?: (api: {
    fitView: () => void;
    resetLayout: () => void;
    zoomIn: () => void;
    zoomOut: () => void;
  }) => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const NODE_RADIUS = 7;
const FOLDER_RADIUS = 10;
const DOT_SPACING = 24;
const PARTICLE_COUNT = 3;
const PARTICLE_SPEED = 0.004;
const MIN_ZOOM = 0.08;
const MAX_ZOOM = 4;
const LABEL_HIDE_SCALE = 0.55;

// Force simulation constants
const REPULSION = 6000;
const LINK_DISTANCE = 90;
const LINK_STRENGTH = 0.35;
const CENTER_STRENGTH = 0.03;
const VELOCITY_DECAY = 0.6;
const COLLIDE_RADIUS = 30;
const ALPHA_DECAY = 0.0228;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function nodeR(n: SimNode) {
  return n.type === 'folder' ? FOLDER_RADIUS : NODE_RADIUS;
}

function hitTest(n: SimNode, wx: number, wy: number): boolean {
  const r = nodeR(n) + 5;
  const dx = n.x - wx;
  const dy = n.y - wy;
  return dx * dx + dy * dy <= r * r;
}

// ---------------------------------------------------------------------------
// Minimal force simulation (replaces d3-force-3d)
// ---------------------------------------------------------------------------
class ForceSimulation {
  nodes: SimNode[] = [];
  links: SimLink[] = [];
  alpha = 1;
  private _timer: ReturnType<typeof setInterval> | null = null;
  private _onTick: (() => void) | null = null;
  private _onEnd: (() => void) | null = null;

  setNodes(nodes: SimNode[]) { this.nodes = nodes; return this; }
  setLinks(links: SimLink[]) { this.links = links; return this; }
  onTick(fn: () => void) { this._onTick = fn; return this; }
  onEnd(fn: () => void) { this._onEnd = fn; return this; }

  start() {
    this.stop();
    this._timer = setInterval(() => this._step(), 16);
    return this;
  }

  stop() {
    if (this._timer !== null) { clearInterval(this._timer); this._timer = null; }
    return this;
  }

  restart() { this.start(); return this; }

  alphaTarget(v: number) { this.alpha = Math.max(this.alpha, v); return this; }

  private _step() {
    if (this.alpha < 0.001) {
      this.stop();
      this._onEnd?.();
      return;
    }
    this._tick();
    this._onTick?.();
    this.alpha *= (1 - ALPHA_DECAY);
  }

  private _tick() {
    const ns = this.nodes;
    const ls = this.links;
    const n = ns.length;
    if (n === 0) return;

    // Center of mass
    let cx = 0, cy = 0;
    for (const node of ns) { cx += node.x; cy += node.y; }
    cx /= n; cy /= n;

    for (const node of ns) {
      if (node.fx !== null) { node.x = node.fx; node.vx = 0; continue; }
      // Center force
      node.vx += (-cx) * CENTER_STRENGTH;
      node.vy += (-cy) * CENTER_STRENGTH;
    }

    // Many-body repulsion (O(n^2) simplified)
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const a = ns[i], b = ns[j];
        let dx = b.x - a.x, dy = b.y - a.y;
        const dist2 = dx * dx + dy * dy || 1;
        const dist = Math.sqrt(dist2);
        const force = -REPULSION / dist2;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        if (a.fx === null) { a.vx += fx; a.vy += fy; }
        if (b.fx === null) { b.vx -= fx; b.vy -= fy; }
      }
    }

    // Link forces
    for (const l of ls) {
      const src = l.source, tgt = l.target;
      let dx = tgt.x - src.x, dy = tgt.y - src.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const force = (dist - LINK_DISTANCE) * LINK_STRENGTH;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      if (src.fx === null) { src.vx += fx; src.vy += fy; }
      if (tgt.fx === null) { tgt.vx -= fx; tgt.vy -= fy; }
    }

    // Collision
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const a = ns[i], b = ns[j];
        let dx = b.x - a.x, dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const minDist = COLLIDE_RADIUS;
        if (dist < minDist) {
          const force = (minDist - dist) / dist * 0.5;
          const fx = dx * force, fy = dy * force;
          if (a.fx === null) { a.vx -= fx; a.vy -= fy; }
          if (b.fx === null) { b.vx += fx; b.vy += fy; }
        }
      }
    }

    // Integrate
    for (const node of ns) {
      if (node.fx !== null) continue;
      node.vx *= VELOCITY_DECAY;
      node.vy *= VELOCITY_DECAY;
      node.x += node.vx;
      node.y += node.vy;
    }
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function GraphView({
  nodes,
  edges,
  onNodeSelect,
  onNodeDoubleClick,
  showLabels,
  filterTypes,
  searchQuery,
  onExposeControls,
}: GraphViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const transformRef = useRef<Transform>({ x: 0, y: 0, k: 1 });
  const simNodesRef = useRef<SimNode[]>([]);
  const simLinksRef = useRef<SimLink[]>([]);
  const selectedIdRef = useRef<string | null>(null);
  const hoveredIdRef = useRef<string | null>(null);
  const showLabelsRef = useRef(showLabels);
  const searchRef = useRef(searchQuery);
  const particlesRef = useRef<Map<string, { progress: number }[]>>(new Map());
  const rafRef = useRef<number>(0);
  const simRef = useRef<ForceSimulation | null>(null);
  const sizeRef = useRef({ w: 0, h: 0 });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => { showLabelsRef.current = showLabels; }, [showLabels]);
  useEffect(() => { searchRef.current = searchQuery; }, [searchQuery]);

  // ---------------------------------------------------------------------------
  // Filtered data
  // ---------------------------------------------------------------------------
  const { filteredNodes, filteredEdges } = useMemo(() => {
    const filtered =
      filterTypes.length === 0
        ? nodes
        : nodes.filter((n) => filterTypes.includes(n.type));
    const idSet = new Set(filtered.map((n) => n.id));
    return {
      filteredNodes: filtered,
      filteredEdges: edges.filter(
        (e) => idSet.has(e.source as string) && idSet.has(e.target as string)
      ),
    };
  }, [nodes, edges, filterTypes]);

  // ---------------------------------------------------------------------------
  // Simulation — re-runs when data changes
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const prevPos = new Map<string, { x: number; y: number }>();
    for (const n of simNodesRef.current) {
      prevPos.set(n.id, { x: n.x, y: n.y });
    }

    const newNodes: SimNode[] = filteredNodes.map((n) => {
      const prev = prevPos.get(n.id);
      const angle = Math.random() * Math.PI * 2;
      const dist = 50 + Math.random() * 150;
      return {
        id: n.id,
        label: n.label,
        type: n.type,
        color: getNodeConfig(n.type).color,
        data: n,
        x: prev?.x ?? Math.cos(angle) * dist,
        y: prev?.y ?? Math.sin(angle) * dist,
        vx: 0,
        vy: 0,
        fx: null,
        fy: null,
      };
    });

    const idToNode = new Map(newNodes.map((n) => [n.id, n]));

    const newLinks: SimLink[] = filteredEdges
      .map((e) => {
        const src = idToNode.get(e.source as string);
        const tgt = idToNode.get(e.target as string);
        if (!src || !tgt) return null;
        return { id: e.id, source: src, target: tgt, label: e.label };
      })
      .filter(Boolean) as SimLink[];

    simNodesRef.current = newNodes;
    simLinksRef.current = newLinks;

    // Particle trails
    const pmap = new Map<string, { progress: number }[]>();
    newLinks.forEach((l, i) => {
      pmap.set(l.id, Array.from({ length: PARTICLE_COUNT }, (_, j) => ({
        progress: j / PARTICLE_COUNT,
      })));
    });
    particlesRef.current = pmap;

    simRef.current?.stop();

    if (newNodes.length === 0) {
      setIsReady(true);
      return;
    }

    const sim = new ForceSimulation();
    sim.setNodes(newNodes).setLinks(newLinks);
    sim.onEnd(() => setIsReady(true));
    sim.start();
    simRef.current = sim;

    return () => { sim.stop(); };
  }, [filteredNodes, filteredEdges]);

  // ---------------------------------------------------------------------------
  // RAF render loop
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let alive = true;

    function frame() {
      if (!alive) return;
      rafRef.current = requestAnimationFrame(frame);

      const { w, h } = sizeRef.current;
      if (w === 0 || h === 0) return;

      const ctx = canvas!.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const t = transformRef.current;
      const simNodes = simNodesRef.current;
      const links = simLinksRef.current;
      const selId = selectedIdRef.current;
      const hovId = hoveredIdRef.current;
      const q = searchRef.current.toLowerCase().trim();
      const showLbl = showLabelsRef.current && t.k > LABEL_HIDE_SCALE;

      // Advance particles
      for (const l of links) {
        const ps = particlesRef.current.get(l.id);
        if (ps) { for (const p of ps) p.progress = (p.progress + PARTICLE_SPEED) % 1; }
      }

      // Background
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = '#F7F8FA';
      ctx.fillRect(0, 0, w * dpr, h * dpr);

      // Dot grid
      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const spacing = DOT_SPACING * t.k;
      const ox = ((t.x % spacing) + spacing) % spacing;
      const oy = ((t.y % spacing) + spacing) % spacing;
      const dotR = Math.max(0.4, Math.min(1.5, t.k));
      ctx.fillStyle = '#D0D5DD';
      for (let gx = ox - spacing; gx < w + spacing; gx += spacing) {
        for (let gy = oy - spacing; gy < h + spacing; gy += spacing) {
          ctx.beginPath();
          ctx.arc(gx, gy, dotR, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();

      // World transform
      ctx.setTransform(t.k * dpr, 0, 0, t.k * dpr, t.x * dpr, t.y * dpr);

      const hasSelection = selId !== null;
      const connectedIds = new Set<string>();
      if (hasSelection) {
        for (const l of links) {
          if (l.source.id === selId || l.target.id === selId) {
            connectedIds.add(l.source.id);
            connectedIds.add(l.target.id);
          }
        }
      }

      // Links
      for (const l of links) {
        const src = l.source, tgt = l.target;
        const connected = hasSelection && (src.id === selId || tgt.id === selId);
        ctx.globalAlpha = hasSelection ? (connected ? 1 : 0.07) : 0.8;
        ctx.beginPath();
        ctx.moveTo(src.x, src.y);
        ctx.lineTo(tgt.x, tgt.y);
        ctx.strokeStyle = connected ? '#6D4AFF' : '#CBD5E1';
        ctx.lineWidth = (connected ? 2.5 : 1.5) / t.k;
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // Particles
      for (const l of links) {
        const src = l.source, tgt = l.target;
        const connected = hasSelection && (src.id === selId || tgt.id === selId);
        if (hasSelection && !connected) continue;
        const ps = particlesRef.current.get(l.id);
        if (!ps) continue;
        const dx = tgt.x - src.x, dy = tgt.y - src.y;
        ctx.fillStyle = connected ? '#8B5CF6' : '#94A3B8';
        ctx.globalAlpha = connected ? 0.9 : 0.5;
        for (const p of ps) {
          ctx.beginPath();
          ctx.arc(src.x + dx * p.progress, src.y + dy * p.progress, 2.5 / t.k, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;

      // Nodes
      for (const n of simNodes) {
        const isSelected = n.id === selId;
        const isHovered = n.id === hovId;
        const isMatch = q.length > 0 && n.label.toLowerCase().includes(q);
        const isRelated = !hasSelection || connectedIds.has(n.id);
        const r = nodeR(n);
        const dr = isSelected ? r + 4 : isHovered ? r + 2 : r;

        ctx.globalAlpha = hasSelection && !isRelated ? 0.12 : 1;

        if (isSelected) {
          ctx.save();
          ctx.shadowColor = '#6D4AFF';
          ctx.shadowBlur = 24 / t.k;
          ctx.beginPath();
          ctx.arc(n.x, n.y, dr + 5, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(109,74,255,0.18)';
          ctx.fill();
          ctx.restore();
        } else if (isMatch) {
          ctx.save();
          ctx.shadowColor = '#F59E0B';
          ctx.shadowBlur = 18 / t.k;
          ctx.beginPath();
          ctx.arc(n.x, n.y, dr + 4, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(245,158,11,0.14)';
          ctx.fill();
          ctx.restore();
        }

        ctx.shadowColor = 'rgba(0,0,0,0.15)';
        ctx.shadowBlur = 8 / t.k;
        ctx.beginPath();
        ctx.arc(n.x, n.y, dr, 0, Math.PI * 2);
        ctx.fillStyle = n.color;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.lineWidth = (isSelected ? 3 : 2) / t.k;
        ctx.strokeStyle = isSelected ? '#6D4AFF' : '#ffffff';
        ctx.stroke();
        ctx.globalAlpha = 1;

        if (showLbl || isHovered || isSelected) {
          const fontSize = Math.max(8, 12 / t.k);
          ctx.font = `${isSelected ? '600' : '400'} ${fontSize}px Inter, ui-sans-serif, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const labelY = n.y - dr - fontSize * 0.9;
          const tw = ctx.measureText(n.label).width;
          const pad = 3 / t.k;

          ctx.globalAlpha = hasSelection && !isRelated ? 0.12 : 1;
          ctx.fillStyle = 'rgba(255,255,255,0.92)';
          const bw = tw + pad * 2, bh = fontSize + pad * 2;
          ctx.beginPath();
          if ((ctx as any).roundRect) {
            (ctx as any).roundRect(n.x - bw / 2, labelY - bh / 2, bw, bh, 4 / t.k);
          } else {
            ctx.rect(n.x - bw / 2, labelY - bh / 2, bw, bh);
          }
          ctx.fill();
          ctx.fillStyle = isSelected ? '#6D4AFF' : '#374151';
          ctx.fillText(n.label, n.x, labelY);
          ctx.globalAlpha = 1;
        }
      }
    }

    rafRef.current = requestAnimationFrame(frame);
    return () => {
      alive = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Canvas sizing
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const el = containerRef.current;
    const canvas = canvasRef.current;
    if (!el || !canvas) return;

    function applySize() {
      const w = el!.clientWidth || el!.offsetWidth;
      const h = el!.clientHeight || el!.offsetHeight;
      if (w === 0 || h === 0) return;
      const dpr = window.devicePixelRatio || 1;
      canvas!.width = Math.round(w * dpr);
      canvas!.height = Math.round(h * dpr);
      canvas!.style.width = `${w}px`;
      canvas!.style.height = `${h}px`;
      sizeRef.current = { w, h };
      if (transformRef.current.x === 0 && transformRef.current.y === 0) {
        transformRef.current = { k: 1, x: w / 2, y: h / 2 };
      }
    }

    const ro = new ResizeObserver(applySize);
    ro.observe(el);
    applySize();
    return () => ro.disconnect();
  }, []);

  // ---------------------------------------------------------------------------
  // Input helpers
  // ---------------------------------------------------------------------------
  const screenToWorld = useCallback((sx: number, sy: number) => {
    const t = transformRef.current;
    return { x: (sx - t.x) / t.k, y: (sy - t.y) / t.k };
  }, []);

  const canvasPos = useCallback((e: { clientX: number; clientY: number }) => {
    const r = canvasRef.current?.getBoundingClientRect();
    if (!r) return { sx: 0, sy: 0 };
    return { sx: e.clientX - r.left, sy: e.clientY - r.top };
  }, []);

  const findNode = useCallback((wx: number, wy: number): SimNode | null => {
    const ns = simNodesRef.current;
    for (let i = ns.length - 1; i >= 0; i--) {
      if (hitTest(ns[i], wx, wy)) return ns[i];
    }
    return null;
  }, []);

  // ---------------------------------------------------------------------------
  // Interaction
  // ---------------------------------------------------------------------------
  const panRef = useRef<{ sx: number; sy: number; tx: number; ty: number } | null>(null);
  const dragNodeRef = useRef<SimNode | null>(null);
  const lastClickRef = useRef<{ id: string; time: number } | null>(null);
  const movedRef = useRef(false);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    movedRef.current = false;
    const { sx, sy } = canvasPos(e);
    const { x: wx, y: wy } = screenToWorld(sx, sy);
    const hit = findNode(wx, wy);
    if (hit) {
      dragNodeRef.current = hit;
      hit.fx = hit.x;
      hit.fy = hit.y;
      simRef.current?.alphaTarget(0.2).restart();
    } else {
      const t = transformRef.current;
      panRef.current = { sx: e.clientX, sy: e.clientY, tx: t.x, ty: t.y };
    }
  }, [canvasPos, screenToWorld, findNode]);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const { sx, sy } = canvasPos(e);
    const { x: wx, y: wy } = screenToWorld(sx, sy);

    if (dragNodeRef.current) {
      movedRef.current = true;
      dragNodeRef.current.fx = wx;
      dragNodeRef.current.fy = wy;
      return;
    }

    if (panRef.current) {
      const dx = e.clientX - panRef.current.sx;
      const dy = e.clientY - panRef.current.sy;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) movedRef.current = true;
      transformRef.current = { ...transformRef.current, x: panRef.current.tx + dx, y: panRef.current.ty + dy };
      return;
    }

    const hit = findNode(wx, wy);
    const nid = hit?.id ?? null;
    if (nid !== hoveredIdRef.current) {
      hoveredIdRef.current = nid;
      if (canvasRef.current) canvasRef.current.style.cursor = nid ? 'pointer' : 'default';
    }
  }, [canvasPos, screenToWorld, findNode]);

  const onPointerUp = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const node = dragNodeRef.current;
    if (node) {
      node.fx = null;
      node.fy = null;
      if (simRef.current) { simRef.current.alpha = Math.max(simRef.current.alpha, 0); }
      dragNodeRef.current = null;
    }
    panRef.current = null;

    if (!movedRef.current) {
      const { sx, sy } = canvasPos(e);
      const { x: wx, y: wy } = screenToWorld(sx, sy);
      const hit = findNode(wx, wy);
      if (hit) {
        const now = Date.now();
        const last = lastClickRef.current;
        if (last && last.id === hit.id && now - last.time < 350) {
          lastClickRef.current = null;
          onNodeDoubleClick?.(hit.data);
          movedRef.current = false;
          return;
        }
        lastClickRef.current = { id: hit.id, time: now };
        if (selectedIdRef.current === hit.id) {
          selectedIdRef.current = null;
          setSelectedId(null);
          onNodeSelect?.(null);
        } else {
          selectedIdRef.current = hit.id;
          setSelectedId(hit.id);
          onNodeSelect?.(hit.data);
        }
      } else {
        selectedIdRef.current = null;
        setSelectedId(null);
        onNodeSelect?.(null);
      }
    }
    movedRef.current = false;
  }, [canvasPos, screenToWorld, findNode, onNodeSelect, onNodeDoubleClick]);

  const onWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const { sx, sy } = canvasPos(e);
    const t = transformRef.current;
    const delta = e.deltaMode === 1 ? e.deltaY * 33 : e.deltaY;
    const factor = Math.pow(0.9985, delta);
    const newK = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, t.k * factor));
    const ratio = newK / t.k;
    transformRef.current = { k: newK, x: sx - ratio * (sx - t.x), y: sy - ratio * (sy - t.y) };
  }, [canvasPos]);

  // ---------------------------------------------------------------------------
  // Controls API
  // ---------------------------------------------------------------------------
  const fitView = useCallback(() => {
    const ns = simNodesRef.current;
    const { w, h } = sizeRef.current;
    if (ns.length === 0 || w === 0) return;
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const n of ns) {
      if (n.x < x0) x0 = n.x; if (n.x > x1) x1 = n.x;
      if (n.y < y0) y0 = n.y; if (n.y > y1) y1 = n.y;
    }
    const pad = 80;
    const k = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.min(
      w / (x1 - x0 + pad * 2), h / (y1 - y0 + pad * 2)
    )));
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    transformRef.current = { k, x: w / 2 - cx * k, y: h / 2 - cy * k };
  }, []);

  const resetLayout = useCallback(() => {
    for (const n of simNodesRef.current) { n.fx = null; n.fy = null; }
    if (simRef.current) { simRef.current.alpha = 1; simRef.current.restart(); }
  }, []);

  const zoomIn = useCallback(() => {
    const { w, h } = sizeRef.current;
    const t = transformRef.current;
    const k2 = Math.min(MAX_ZOOM, t.k * 1.3);
    const r = k2 / t.k;
    transformRef.current = { k: k2, x: w / 2 - r * (w / 2 - t.x), y: h / 2 - r * (h / 2 - t.y) };
  }, []);

  const zoomOut = useCallback(() => {
    const { w, h } = sizeRef.current;
    const t = transformRef.current;
    const k2 = Math.max(MIN_ZOOM, t.k / 1.3);
    const r = k2 / t.k;
    transformRef.current = { k: k2, x: w / 2 - r * (w / 2 - t.x), y: h / 2 - r * (h / 2 - t.y) };
  }, []);

  useEffect(() => {
    onExposeControls?.({ fitView, resetLayout, zoomIn, zoomOut });
  }, [onExposeControls, fitView, resetLayout, zoomIn, zoomOut]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div ref={containerRef} className="relative w-full h-full" style={{ background: '#F7F8FA', minHeight: '400px' }}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 block touch-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
      />
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#F7F8FA] z-10 pointer-events-none">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-[#6D4AFF]/30 border-t-[#6D4AFF] rounded-full animate-spin" />
            <p className="text-sm text-[#9CA3AF]">Building graph...</p>
          </div>
        </div>
      )}
    </div>
  );
}
