import { Mailbox } from 'lucide-react';
import { defineElement } from '../define';
import { slab } from '../parts';

export default defineElement({
  id: 'mailbox',
  name: 'Mailbox',
  kind: 'outdoor',
  category: 'Boundaries',
  icon: Mailbox,
  tags: ['letterbox', 'post'],
  size: { w: 0.4, d: 0.35, h: 1.2 },
  slots: {
    box: { label: 'Box', default: 'metal-anthracite', category: 'fixture' },
    post: { label: 'Post', default: 'timber-dark', category: 'facade' },
  },
  snap: 'ground',
  build: ({ size: { w, d, h } }) => [
    slab(0.08, h - 0.3, 0.08, 0, 0, 0, 'post'),
    slab(w, 0.3, d, 0, h - 0.3, 0, 'box', 0.04),
  ],
});
