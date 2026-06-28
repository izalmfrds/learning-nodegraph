'use client';

import { getNodeConfig, type GraphNodeType } from './GraphNode';

interface GraphLegendProps {
  visibleTypes?: GraphNodeType[];
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

export default function GraphLegend({ visibleTypes }: GraphLegendProps) {
  const types = visibleTypes && visibleTypes.length > 0 ? visibleTypes : ALL_TYPES;

  return (
    <div className="absolute bottom-5 left-5 bg-white/90 backdrop-blur-xl border border-[#ECECF3] rounded-2xl p-4 space-y-2 shadow-xl shadow-black/8 z-20 max-h-[50vh] overflow-y-auto">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF] mb-2">Node Types</p>
      <div className="space-y-1.5">
        {types.map((type) => {
          const cfg = getNodeConfig(type);
          return (
            <div key={type} className="flex items-center gap-2.5">
              <div
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: cfg.color }}
              />
              <span className="text-[11px] text-[#6B7280] capitalize">
                {type.replace('_', ' ')}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
