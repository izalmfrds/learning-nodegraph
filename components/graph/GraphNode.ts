export type GraphNodeType =
  | 'workspace'
  | 'agent'
  | 'skill'
  | 'workflow'
  | 'document'
  | 'memory'
  | 'telegram_chat'
  | 'prompt'
  | 'folder'
  | 'file'
  | 'note';

export interface GraphNodeData {
  id: string;
  label: string;
  type: GraphNodeType;
  description?: string;
  created_at?: string;
  updated_at?: string;
  word_count?: number;
  folder_id?: string | null;
  color?: string;
  icon?: string;
  // For notes from DB
  note?: {
    id: string;
    title: string;
    content: string;
    folder_id: string | null;
    word_count: number;
    created_at: string;
    updated_at: string;
    folder?: { name: string; color: string | null } | null;
    tags?: { name: string }[];
  };
}

export const NODE_TYPE_CONFIG: Record<
  GraphNodeType,
  { color: string; bg: string; border: string; icon: string }
> = {
  workspace: {
    color: '#6D4AFF',
    bg: '#6D4AFF',
    border: '#6D4AFF',
    icon: 'layers',
  },
  agent: {
    color: '#10B981',
    bg: '#10B981',
    border: '#10B981',
    icon: 'bot',
  },
  skill: {
    color: '#F59E0B',
    bg: '#F59E0B',
    border: '#F59E0B',
    icon: 'zap',
  },
  workflow: {
    color: '#3B82F6',
    bg: '#3B82F6',
    border: '#3B82F6',
    icon: 'git-branch',
  },
  document: {
    color: '#EC4899',
    bg: '#EC4899',
    border: '#EC4899',
    icon: 'file-text',
  },
  memory: {
    color: '#8B5CF6',
    bg: '#8B5CF6',
    border: '#8B5CF6',
    icon: 'brain',
  },
  telegram_chat: {
    color: '#06B6D4',
    bg: '#06B6D4',
    border: '#06B6D4',
    icon: 'message-circle',
  },
  prompt: {
    color: '#F43F5E',
    bg: '#F43F5E',
    border: '#F43F5E',
    icon: 'terminal',
  },
  folder: {
    color: '#6D4AFF',
    bg: '#6D4AFF',
    border: '#6D4AFF',
    icon: 'folder',
  },
  file: {
    color: '#9CA3AF',
    bg: '#9CA3AF',
    border: '#9CA3AF',
    icon: 'file',
  },
  note: {
    color: '#6D4AFF',
    bg: '#6D4AFF',
    border: '#6D4AFF',
    icon: 'file-text',
  },
};

export function getNodeConfig(type: GraphNodeType) {
  return NODE_TYPE_CONFIG[type] || NODE_TYPE_CONFIG.note;
}
