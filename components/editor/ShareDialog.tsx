'use client';
import { Check, Copy, Download, ExternalLink } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useEditor } from '@/store/editor';
import { useDocument } from '@/store/document';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { createShareLink, downloadProject } from '@/features/project/io';

export function ShareDialog() {
  const open = useEditor((s) => s.shareOpen);
  const project = useDocument((s) => s.project);
  const [link, setLink] = useState('');
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!open) return;
    setCopied(false);
    void createShareLink(project).then(setLink);
  }, [open, project]);
  const kb = Math.round(link.length / 1024);
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => useEditor.getState().set({ shareOpen: o })}
      title="Share a view-only walkthrough"
      description="Anyone with the link opens straight into Walk mode. The whole house is packed into the link itself: nothing is uploaded."
    >
      <div className="flex flex-col gap-3 px-5 py-4">
        <div className="flex gap-2">
          <input readOnly value={link} aria-label="Share link" onFocus={(e) => e.target.select()} className="tnum h-9 min-w-0 flex-1 rounded-[9px] border border-line bg-bg-elevated px-2.5 text-[12.5px] text-fg-muted outline-none" data-testid="share-link" />
          <Button
            variant="primary"
            icon={copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(link);
              } catch {
                /* clipboard blocked */
              }
              setCopied(true);
            }}
          >
            {copied ? 'Copied' : 'Copy'}
          </Button>
        </div>
        <p className="text-xs text-fg-subtle">
          Link size {kb} KB. Very large projects may exceed what some apps accept in a link; share the file instead.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" icon={<ExternalLink className="h-3.5 w-3.5" />} onClick={() => window.open(link, '_blank', 'noopener')} disabled={!link}>
            Open viewer
          </Button>
          <Button size="sm" variant="secondary" icon={<Download className="h-3.5 w-3.5" />} onClick={() => downloadProject(project)}>
            Download .modulo.json
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
