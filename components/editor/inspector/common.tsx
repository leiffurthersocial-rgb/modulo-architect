'use client';
import { Copy, EyeOff, Lock, LockOpen, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import * as A from '@/store/actions';
import { Section } from '@/components/ui/Section';
import { useDocument } from '@/store/document';

export function EntityActions({
  locked,
  duplicate = false,
  hideDelete = false,
}: {
  locked?: boolean;
  duplicate?: boolean;
  hideDelete?: boolean;
}) {
  const readOnly = useDocument((s) => s.readOnly);
  if (readOnly) return null;
  return (
    <Section>
      <div className="flex flex-wrap gap-1.5">
        {duplicate && (
          <Button
            size="sm"
            variant="ghost"
            icon={<Copy className="h-3.5 w-3.5" />}
            onClick={A.duplicateSelection}
          >
            Duplicate
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          icon={locked ? <LockOpen className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
          onClick={() => A.toggleFlag('locked')}
        >
          {locked ? 'Unlock' : 'Lock'}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          icon={<EyeOff className="h-3.5 w-3.5" />}
          onClick={() => A.toggleFlag('hidden')}
        >
          Hide
        </Button>
        {!hideDelete && (
          <Button
            size="sm"
            variant="danger"
            icon={<Trash2 className="h-3.5 w-3.5" />}
            onClick={A.deleteSelection}
            disabled={locked}
            data-testid="delete-selection"
          >
            Delete
          </Button>
        )}
      </div>
    </Section>
  );
}

export function Readout({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-[13px]">
      <span className="text-fg-muted">{label}</span>
      <span className="tnum text-fg">{value}</span>
    </div>
  );
}
