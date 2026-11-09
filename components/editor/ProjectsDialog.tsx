'use client';
import { Copy, Download, FolderOpen, Plus, Trash2, Upload } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useEditor } from '@/store/editor';
import { useDocument } from '@/store/document';
import { Dialog } from '@/components/ui/Dialog';
import { Button, IconButton } from '@/components/ui/Button';
import { deleteProject, listProjects, loadProject, saveProject, type ProjectMeta } from '@/lib/persistence';
import {
  downloadProject,
  importProjectFile,
  newProjectFromTemplate,
  openProjectInEditor,
} from '@/features/project/io';
import { TEMPLATE_LIST } from '@/core/templates/meta';
import { createId } from '@/core/model/ids';
import { TextField } from '@/components/ui/TextField';

export function ProjectsDialog() {
  const open = useEditor((s) => s.projectsOpen);
  const currentId = useDocument((s) => s.project.id);
  const [list, setList] = useState<ProjectMeta[]>([]);
  const refresh = () => void listProjects().then(setList);
  useEffect(() => {
    if (open) refresh();
  }, [open]);
  const close = () => useEditor.getState().set({ projectsOpen: false });
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => useEditor.getState().set({ projectsOpen: o })}
      title="Projects"
      description="Stored in this browser. Export to keep a copy or move it to another device."
    >
      <div className="flex flex-wrap gap-1.5 border-b border-line px-5 py-3">
        {TEMPLATE_LIST.map((t) => (
          <Button
            key={t.id}
            size="sm"
            variant="secondary"
            icon={<Plus className="h-3.5 w-3.5" />}
            onClick={() => void newProjectFromTemplate(t.id).then(close)}
          >
            {t.name}
          </Button>
        ))}
        <Button
          size="sm"
          variant="ghost"
          icon={<Upload className="h-3.5 w-3.5" />}
          onClick={() => (close(), importProjectFile())}
        >
          Import
        </Button>
      </div>
      <ul className="scrollbar-thin min-h-[120px] overflow-y-auto p-2" data-testid="project-list">
        {list.length === 0 && (
          <li className="py-8 text-center text-[13px] text-fg-subtle">No saved projects yet.</li>
        )}
        {list.map((m) => (
          <li key={m.id} className="group flex items-center gap-2 rounded-[10px] px-3 py-2 hover:bg-hover">
            <div className="min-w-0 flex-1">
              {m.id === currentId ? (
                <TextField
                  label="Project name"
                  value={m.name}
                  className="h-7"
                  onChange={(v) => {
                    useDocument.getState().mutate('Rename project', (d) => void (d.name = v));
                    setTimeout(refresh, 700);
                  }}
                />
              ) : (
                <div className="truncate text-[13.5px] font-medium">{m.name}</div>
              )}
              <div className="text-xs text-fg-subtle">
                {m.id === currentId ? 'Open now · ' : ''}Edited {new Date(m.updatedAt).toLocaleString()}
              </div>
            </div>
            {m.id !== currentId && (
              <IconButton
                label="Open"
                size="sm"
                onClick={() => void loadProject(m.id).then((p) => p && openProjectInEditor(p).then(close))}
              >
                <FolderOpen />
              </IconButton>
            )}
            <IconButton
              label="Duplicate"
              size="sm"
              onClick={() =>
                void loadProject(m.id).then(async (p) => {
                  if (!p) return;
                  await saveProject({
                    ...p,
                    id: createId('project'),
                    name: `${p.name} copy`,
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                  });
                  refresh();
                })
              }
            >
              <Copy />
            </IconButton>
            <IconButton
              label="Export"
              size="sm"
              onClick={() => void loadProject(m.id).then((p) => p && downloadProject(p))}
            >
              <Download />
            </IconButton>
            {m.id !== currentId && (
              <IconButton
                label="Delete"
                size="sm"
                className="hover:text-danger"
                onClick={() => {
                  if (confirm(`Delete “${m.name}”? This cannot be undone.`))
                    void deleteProject(m.id).then(refresh);
                }}
              >
                <Trash2 />
              </IconButton>
            )}
          </li>
        ))}
      </ul>
    </Dialog>
  );
}
