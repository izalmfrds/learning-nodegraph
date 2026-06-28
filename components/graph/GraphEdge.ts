export interface GraphEdgeData {
  id: string;
  source: string;
  target: string;
  label?: string;
  type?: string;
}

export const EDGE_RELATIONSHIPS = [
  { from: 'workspace', to: 'agent', label: 'contains' },
  { from: 'agent', to: 'skill', label: 'uses' },
  { from: 'skill', to: 'workflow', label: 'orchestrates' },
  { from: 'workflow', to: 'document', label: 'produces' },
  { from: 'document', to: 'memory', label: 'stores' },
  { from: 'memory', to: 'prompt', label: 'triggers' },
  { from: 'telegram_chat', to: 'memory', label: 'feeds' },
  { from: 'folder', to: 'file', label: 'contains' },
  { from: 'folder', to: 'note', label: 'contains' },
  { from: 'note', to: 'note', label: 'links' },
];
