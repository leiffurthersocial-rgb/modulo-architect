import { describe, expect, it } from 'vitest';
import { begin, cancel, commit, createHistory, mutate, redo, undo } from './history';

type Doc = { a: number; list: string[] };

describe('history', () => {
  it('undoes and redoes single commands', () => {
    let h = createHistory<Doc>({ a: 1, list: [] });
    h = mutate(h, 'set a', (d) => {
      d.a = 2;
    });
    h = mutate(h, 'push', (d) => {
      d.list.push('x');
    });
    expect(h.past).toHaveLength(2);
    h = undo(h);
    expect(h.present).toEqual({ a: 2, list: [] });
    h = undo(h);
    expect(h.present).toEqual({ a: 1, list: [] });
    h = redo(h);
    h = redo(h);
    expect(h.present).toEqual({ a: 2, list: ['x'] });
  });

  it('ignores no-op mutations', () => {
    let h = createHistory<Doc>({ a: 1, list: [] });
    h = mutate(h, 'noop', () => {});
    expect(h.past).toHaveLength(0);
  });

  it('groups a transaction (drag) into one undo step', () => {
    let h = createHistory<Doc>({ a: 0, list: [] });
    h = begin(h, 'drag');
    for (let i = 1; i <= 20; i++)
      h = mutate(h, 'move', (d) => {
        d.a = i;
      });
    h = commit(h);
    expect(h.past).toHaveLength(1);
    expect(h.present.a).toBe(20);
    h = undo(h);
    expect(h.present.a).toBe(0);
    h = redo(h);
    expect(h.present.a).toBe(20);
  });

  it('cancels a transaction back to the start', () => {
    let h = createHistory<Doc>({ a: 0, list: [] });
    h = begin(h, 'drag');
    h = mutate(h, 'move', (d) => {
      d.a = 5;
    });
    h = cancel(h);
    expect(h.present.a).toBe(0);
    expect(h.past).toHaveLength(0);
  });

  it('merges consecutive commands with the same merge key', () => {
    let h = createHistory<Doc>({ a: 0, list: [] });
    h = mutate(h, 'nudge', (d) => void (d.a += 1), { mergeKey: 'a', now: 1000 });
    h = mutate(h, 'nudge', (d) => void (d.a += 1), { mergeKey: 'a', now: 1500 });
    h = mutate(h, 'nudge', (d) => void (d.a += 1), { mergeKey: 'a', now: 5000 });
    expect(h.past).toHaveLength(2);
    h = undo(h);
    expect(h.present.a).toBe(2);
    h = undo(h);
    expect(h.present.a).toBe(0);
  });

  it('clears redo stack on new change', () => {
    let h = createHistory<Doc>({ a: 0, list: [] });
    h = mutate(h, 'a', (d) => void (d.a = 1));
    h = undo(h);
    h = mutate(h, 'b', (d) => void (d.a = 3));
    expect(h.future).toHaveLength(0);
    expect(redo(h).present.a).toBe(3);
  });
});
