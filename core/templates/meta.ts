/** Lightweight template metadata (kept separate so the landing page doesn't import geometry). */
export const TEMPLATE_LIST = [
  { id: 'empty', name: 'Empty plot', description: 'A blank 30 × 30 m site' },
  { id: 'studio', name: 'Studio', description: 'One room, 32 m²' },
  { id: 'two-bedroom', name: 'Two-bedroom house', description: 'Single storey, 78 m²' },
  { id: 'two-storey', name: 'Two-storey house', description: 'Stairs, gable roof' },
] as const;

export type TemplateId = (typeof TEMPLATE_LIST)[number]['id'];
