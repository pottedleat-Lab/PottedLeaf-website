export const CATEGORIES = [
  'tools',
  'fruit-plants',
  'vegetable-plants',
  'flower-plants',
  'showcase-plants',
  'office-plants',
  'pots',
  'seeds',
] as const;
export type Category = (typeof CATEGORIES)[number];
