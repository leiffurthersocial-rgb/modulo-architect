'use client';
import { ArrowRight, FolderOpen } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { parseProject } from '@/core/model/io';
import { saveProject } from '@/lib/persistence';

export function LandingActions() {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  async function onFile(file: File) {
    const res = parseProject(await file.text());
    if (!res.ok) {
      setError(res.error);
      return;
    }
    await saveProject(res.project);
    router.push(`/editor?project=${encodeURIComponent(res.project.id)}`);
  }

  return (
    <div className="flex flex-col items-start gap-3">
      <div className="flex flex-wrap items-center gap-2.5">
        <Button
          variant="primary"
          size="lg"
          onClick={() => router.push('/editor?template=empty')}
          data-testid="start-designing"
        >
          Start designing
          <ArrowRight className="h-4 w-4" />
        </Button>
        <Button
          size="lg"
          variant="secondary"
          icon={<FolderOpen className="h-4 w-4" />}
          onClick={() => input.current?.click()}
        >
          Open a project
        </Button>
        <input
          ref={input}
          type="file"
          accept=".json,.modulo.json,application/json"
          className="hidden"
          aria-label="Open a .modulo.json project file"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void onFile(f);
            e.target.value = '';
          }}
        />
      </div>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
