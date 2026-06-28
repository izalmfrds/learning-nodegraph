'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/sidebar';
import { Header } from '@/components/header';
import { cn } from '@/lib/utils';
import { getFolderTree, getSettings, updateSettings, type Folder, type Settings as SettingsType } from '@/lib/data';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Palette,
  GitBranch,
  Bot,
  Plug,
  Search,
  Building2,
  Moon,
  Sun,
  Monitor,
  Check,
  Save,
  Cpu,
  Zap,
  Sliders,
} from 'lucide-react';

export default function SettingsPage() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [settings, setSettings] = useState<SettingsType | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [foldersData, settingsData] = await Promise.all([getFolderTree(), getSettings()]);
        setFolders(foldersData);
        setSettings(settingsData);
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleUpdate = async (updates: Partial<SettingsType>) => {
    if (!settings) return;
    const updated = { ...settings, ...updates };
    setSettings(updated);
    setSaving(true);
    setSaved(false);
    try {
      await updateSettings(settings.id, updates);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFC]">
        <div className="flex items-center justify-center h-screen">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-[#6D4AFF]/30 border-t-[#6D4AFF] rounded-full animate-spin" />
            <p className="text-sm text-[#9CA3AF]">Loading settings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFC]">
      <Sidebar folders={folders} isCollapsed={isCollapsed} onToggleCollapse={() => setIsCollapsed(!isCollapsed)} />
      <Header isCollapsed={isCollapsed} />

      <main
        className={cn(
          'pt-16 min-h-screen transition-all duration-300 ease-out',
          isCollapsed ? 'pl-16' : 'pl-[280px]'
        )}
      >
        <div className="max-w-3xl mx-auto p-8 space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-[#171717]">Settings</h1>
            <p className="text-sm text-[#9CA3AF]">Configure your AI Skill module preferences</p>
          </div>

          <Tabs defaultValue="workspace" className="w-full">
            <TabsList className="grid w-full grid-cols-6 h-11 bg-[#FAFAFC] p-1 rounded-xl">
              <TabsTrigger value="workspace" className="gap-2 text-xs rounded-lg">
                <Building2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Workspace</span>
              </TabsTrigger>
              <TabsTrigger value="theme" className="gap-2 text-xs rounded-lg">
                <Palette className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Theme</span>
              </TabsTrigger>
              <TabsTrigger value="ai" className="gap-2 text-xs rounded-lg">
                <Bot className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">AI Model</span>
              </TabsTrigger>
              <TabsTrigger value="integrations" className="gap-2 text-xs rounded-lg">
                <Plug className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Integrations</span>
              </TabsTrigger>
              <TabsTrigger value="graph" className="gap-2 text-xs rounded-lg">
                <GitBranch className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Graph</span>
              </TabsTrigger>
              <TabsTrigger value="search" className="gap-2 text-xs rounded-lg">
                <Search className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Search</span>
              </TabsTrigger>
            </TabsList>

            {/* Workspace */}
            <TabsContent value="workspace" className="space-y-6 mt-8">
              <div className="bg-white border border-[#ECECF3] rounded-2xl p-8 space-y-8">
                <div>
                  <h3 className="text-lg font-semibold text-[#171717] mb-1">Workspace</h3>
                  <p className="text-sm text-[#9CA3AF] mb-5">Configure your AI Skill workspace</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2.5">
                      <Label className="text-sm text-[#171717]">Workspace Name</Label>
                      <Input placeholder="My AI Skill Workspace" defaultValue="AI Skill" />
                    </div>
                    <div className="space-y-2.5">
                      <Label className="text-sm text-[#171717]">Default Folder</Label>
                      <Input placeholder="Select default folder" />
                    </div>
                  </div>
                </div>
                <div className="h-px bg-[#ECECF3]" />
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Save className="w-4 h-4 text-[#9CA3AF]" />
                      <span className="text-sm text-[#171717]">Auto Save</span>
                    </div>
                    <Switch
                      checked={settings?.auto_save ?? true}
                      onCheckedChange={(v) => handleUpdate({ auto_save: v })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Sliders className="w-4 h-4 text-[#9CA3AF]" />
                      <span className="text-sm text-[#171717]">Word Wrap</span>
                    </div>
                    <Switch
                      checked={settings?.word_wrap ?? true}
                      onCheckedChange={(v) => handleUpdate({ word_wrap: v })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Cpu className="w-4 h-4 text-[#9CA3AF]" />
                      <span className="text-sm text-[#171717]">Line Numbers</span>
                    </div>
                    <Switch
                      checked={settings?.line_numbers ?? true}
                      onCheckedChange={(v) => handleUpdate({ line_numbers: v })}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Theme */}
            <TabsContent value="theme" className="space-y-6 mt-8">
              <div className="bg-white border border-[#ECECF3] rounded-2xl p-8 space-y-8">
                <div>
                  <h3 className="text-lg font-semibold text-[#171717] mb-1">Theme</h3>
                  <p className="text-sm text-[#9CA3AF] mb-5">Choose your preferred color scheme</p>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { value: 'light', icon: Sun, label: 'Light' },
                      { value: 'dark', icon: Moon, label: 'Dark' },
                      { value: 'system', icon: Monitor, label: 'System' },
                    ].map((theme) => (
                      <button
                        key={theme.value}
                        onClick={() => handleUpdate({ theme: theme.value })}
                        className={cn(
                          'flex flex-col items-center gap-3 p-5 rounded-2xl border transition-all duration-300 ease-out',
                          settings?.theme === theme.value
                            ? 'border-[#6D4AFF] bg-[#F4F1FF]'
                            : 'border-[#ECECF3] hover:border-[#6D4AFF]/30'
                        )}
                      >
                        <theme.icon className="w-5 h-5 text-[#171717]" />
                        <span className="text-sm font-medium text-[#171717]">{theme.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="h-px bg-[#ECECF3]" />
                <div>
                  <h3 className="text-lg font-semibold text-[#171717] mb-1">Accent Color</h3>
                  <p className="text-sm text-[#9CA3AF] mb-5">Pick your favorite accent color</p>
                  <div className="flex flex-wrap gap-3">
                    {[
                      { value: 'blue', color: '#3B82F6' },
                      { value: 'emerald', color: '#10B981' },
                      { value: 'amber', color: '#F59E0B' },
                      { value: 'rose', color: '#F43F5E' },
                      { value: 'violet', color: '#8B5CF6' },
                      { value: 'cyan', color: '#06B6D4' },
                    ].map((accent) => (
                      <button
                        key={accent.value}
                        onClick={() => handleUpdate({ accent_color: accent.value })}
                        className={cn(
                          'w-11 h-11 rounded-full transition-all duration-300 ease-out flex items-center justify-center',
                          settings?.accent_color === accent.value ? 'ring-2 ring-offset-2 ring-offset-white ring-[#6D4AFF] scale-110' : 'hover:scale-105'
                        )}
                        style={{ backgroundColor: accent.color }}
                      >
                        {settings?.accent_color === accent.value && <Check className="w-4 h-4 text-white" />}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="h-px bg-[#ECECF3]" />
                <div>
                  <h3 className="text-lg font-semibold text-[#171717] mb-1">Editor Font Size</h3>
                  <div className="flex items-center gap-3 mt-4">
                    <Input
                      type="number"
                      value={settings?.editor_font_size || 14}
                      onChange={(e) => handleUpdate({ editor_font_size: parseInt(e.target.value) || 14 })}
                      className="w-24 h-9"
                    />
                    <span className="text-sm text-[#9CA3AF]">px</span>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* AI Model */}
            <TabsContent value="ai" className="space-y-6 mt-8">
              <div className="bg-white border border-[#ECECF3] rounded-2xl p-8 space-y-8">
                <div>
                  <h3 className="text-lg font-semibold text-[#171717] mb-1">AI Model</h3>
                  <p className="text-sm text-[#9CA3AF] mb-5">Select the AI model for content generation</p>
                  <div className="grid grid-cols-1 gap-3">
                    {[
                      { value: 'gpt-4', label: 'GPT-4 Turbo', desc: 'Most capable, slower', icon: Bot },
                      { value: 'gpt-3.5', label: 'GPT-3.5 Turbo', desc: 'Fast and efficient', icon: Zap },
                      { value: 'claude-3', label: 'Claude 3 Opus', desc: 'Excellent for long-form', icon: Bot },
                      { value: 'local', label: 'Local Model', desc: 'Run on your machine', icon: Cpu },
                    ].map((model) => (
                      <button
                        key={model.value}
                        className="flex items-center gap-4 p-4 rounded-2xl border border-[#ECECF3] hover:border-[#6D4AFF]/30 hover:bg-[#FAFAFC] transition-all duration-300 text-left"
                      >
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#F4F1FF] shrink-0">
                          <model.icon className="w-5 h-5 text-[#6D4AFF]" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-[#171717]">{model.label}</p>
                          <p className="text-xs text-[#9CA3AF]">{model.desc}</p>
                        </div>
                        {model.value === 'gpt-4' && (
                          <div className="w-5 h-5 rounded-full bg-[#6D4AFF] flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="h-px bg-[#ECECF3]" />
                <div>
                  <h3 className="text-lg font-semibold text-[#171717] mb-1">Generation Settings</h3>
                  <div className="space-y-5 mt-5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#171717]">Auto-generate tags</span>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#171717]">Auto-generate summaries</span>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#171717]">Auto-create backlinks</span>
                      <Switch />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Integrations */}
            <TabsContent value="integrations" className="space-y-6 mt-8">
              <div className="bg-white border border-[#ECECF3] rounded-2xl p-8 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-[#171717] mb-1">Integrations</h3>
                  <p className="text-sm text-[#9CA3AF] mb-5">Connect external services to your AI Skill module</p>
                </div>
                <div className="space-y-3">
                  {[
                    { name: 'Telegram', desc: 'Connect Telegram chats to memory', connected: true, color: '#06B6D4' },
                    { name: 'GitHub', desc: 'Sync repositories as knowledge sources', connected: false, color: '#171717' },
                    { name: 'Notion', desc: 'Import and sync Notion pages', connected: false, color: '#171717' },
                    { name: 'OpenAI', desc: 'Power AI generation with GPT models', connected: true, color: '#10B981' },
                  ].map((integration) => (
                    <div
                      key={integration.name}
                      className="flex items-center justify-between p-5 rounded-2xl bg-[#FAFAFC] border border-transparent hover:border-[#6D4AFF]/20 transition-all duration-300"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0"
                          style={{ backgroundColor: `${integration.color}15` }}
                        >
                          <Plug className="w-5 h-5" style={{ color: integration.color }} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#171717]">{integration.name}</p>
                          <p className="text-xs text-[#9CA3AF]">{integration.desc}</p>
                        </div>
                      </div>
                      <Button
                        variant={integration.connected ? 'outline' : 'default'}
                        size="sm"
                        className={cn(
                          integration.connected
                            ? 'border-[#ECECF3] text-[#9CA3AF]'
                            : 'bg-[#6D4AFF] hover:bg-[#5B3EF5]'
                        )}
                      >
                        {integration.connected ? 'Connected' : 'Connect'}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Graph */}
            <TabsContent value="graph" className="space-y-6 mt-8">
              <div className="bg-white border border-[#ECECF3] rounded-2xl p-8 space-y-8">
                <div>
                  <h3 className="text-lg font-semibold text-[#171717] mb-1">Graph Layout</h3>
                  <p className="text-sm text-[#9CA3AF] mb-5">Configure how your knowledge graph is displayed</p>
                  <div className="grid grid-cols-2 gap-4">
                    {['force-directed', 'hierarchical', 'circular', 'grid'].map((layout) => (
                      <button
                        key={layout}
                        onClick={() => handleUpdate({ graph_layout: layout })}
                        className={cn(
                          'flex items-center gap-3 p-4 rounded-2xl border text-sm transition-all duration-300 ease-out',
                          settings?.graph_layout === layout
                            ? 'border-[#6D4AFF] bg-[#F4F1FF] text-[#6D4AFF]'
                            : 'border-[#ECECF3] hover:border-[#6D4AFF]/30 text-[#171717]'
                        )}
                      >
                        <GitBranch className="w-4 h-4" />
                        <span className="capitalize">{layout.replace('-', ' ')}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#171717]">Show Labels</span>
                    <Switch
                      checked={settings?.graph_show_labels ?? true}
                      onCheckedChange={(v) => handleUpdate({ graph_show_labels: v })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#171717]">Animation</span>
                    <Switch
                      checked={settings?.graph_animation ?? true}
                      onCheckedChange={(v) => handleUpdate({ graph_animation: v })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#171717]">Node Size</span>
                    <div className="flex gap-2">
                      {['uniform', 'by-connections', 'by-word-count'].map((size) => (
                        <button
                          key={size}
                          onClick={() => handleUpdate({ graph_node_size: size })}
                          className={cn(
                            'px-3 py-1.5 rounded-xl text-xs transition-all duration-200',
                            settings?.graph_node_size === size ? 'bg-[#F4F1FF] text-[#6D4AFF]' : 'bg-[#FAFAFC] text-[#9CA3AF]'
                          )}
                        >
                          {size.replace(/-/g, ' ')}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#171717]">Node Color</span>
                    <div className="flex gap-2">
                      {['by-folder', 'uniform', 'by-activity'].map((color) => (
                        <button
                          key={color}
                          onClick={() => handleUpdate({ graph_node_color: color })}
                          className={cn(
                            'px-3 py-1.5 rounded-xl text-xs transition-all duration-200',
                            settings?.graph_node_color === color ? 'bg-[#F4F1FF] text-[#6D4AFF]' : 'bg-[#FAFAFC] text-[#9CA3AF]'
                          )}
                        >
                          {color.replace(/-/g, ' ')}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Search */}
            <TabsContent value="search" className="space-y-6 mt-8">
              <div className="bg-white border border-[#ECECF3] rounded-2xl p-8 space-y-8">
                <div>
                  <h3 className="text-lg font-semibold text-[#171717] mb-1">Search Preferences</h3>
                  <p className="text-sm text-[#9CA3AF] mb-5">Customize how search works in your workspace</p>
                </div>
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-[#171717]">Instant Search</p>
                      <p className="text-xs text-[#9CA3AF] mt-0.5">Show results as you type</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-[#171717]">Search in content</p>
                      <p className="text-xs text-[#9CA3AF] mt-0.5">Include file contents in search</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-[#171717]">Search in tags</p>
                      <p className="text-xs text-[#9CA3AF] mt-0.5">Include tags in search results</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-[#171717]">Search in metadata</p>
                      <p className="text-xs text-[#9CA3AF] mt-0.5">Include file metadata in search</p>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-[#171717]">Save recent searches</p>
                      <p className="text-xs text-[#9CA3AF] mt-0.5">Keep a history of your searches</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
                <div className="h-px bg-[#ECECF3]" />
                <div>
                  <h3 className="text-lg font-semibold text-[#171717] mb-1">Keyboard Shortcut</h3>
                  <p className="text-sm text-[#9CA3AF] mb-4">Open search with a keyboard shortcut</p>
                  <div className="flex items-center gap-3">
                    <kbd className="h-9 px-3 inline-flex items-center rounded-xl border border-[#ECECF3] bg-[#FAFAFC] text-sm font-mono text-[#171717]">
                      Cmd / Ctrl + K
                    </kbd>
                    <span className="text-sm text-[#9CA3AF]">Press anywhere to open search</span>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
