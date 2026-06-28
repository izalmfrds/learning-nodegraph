'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/sidebar';
import { Header } from '@/components/header';
import { cn } from '@/lib/utils';
import { getFolderTree, createNote, type Folder } from '@/lib/data';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save } from 'lucide-react';

export default function NewNotePage() {
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getFolderTree().then(setFolders).catch(console.error);
  }, []);

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const note = await createNote({
        title: title.trim(),
        content,
        word_count: content.split(/\s+/).filter(Boolean).length,
      });
      router.push(`/notes/${note.id}`);
    } catch (err) {
      console.error('Failed to create note:', err);
      setSaving(false);
    }
  };

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
        <div className="sticky top-16 z-30 bg-white/80 backdrop-blur-xl border-b border-[#ECECF3]">
          <div className="flex items-center justify-between px-6 py-3">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => router.push('/notes')} className="h-9 text-[#9CA3AF] hover:text-[#171717]">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Cancel
              </Button>
            </div>
            <Button size="sm" onClick={handleSave} disabled={saving || !title.trim()} className="h-9 bg-[#6D4AFF] hover:bg-[#5B3EF5]">
              <Save className="w-4 h-4 mr-1" />
              {saving ? 'Creating...' : 'Create Note'}
            </Button>
          </div>
        </div>

        <div className="p-8 max-w-3xl mx-auto">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-3xl font-bold bg-transparent border-0 outline-none placeholder:text-[#9CA3AF]/40 mb-6 text-[#171717]"
            placeholder="Note title..."
            autoFocus
          />
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full min-h-[60vh] bg-transparent border-0 resize-none outline-none focus-visible:ring-0 focus-visible:ring-offset-0 text-sm leading-relaxed font-mono text-[#171717] placeholder:text-[#9CA3AF]/40"
            placeholder="Start writing..."
          />
        </div>
      </main>
    </div>
  );
}
