// Keep in sync with the CHECK constraint in supabase/schema.sql and server/src/lib/categories.ts
export const CATEGORIES = [
  { slug: 'office-plants', name: 'Office Plants', blurb: 'Low-light heroes for desks and cabins', icon: '🪴' },
  { slug: 'showcase-plants', name: 'Showcase Plants', blurb: 'Statement greens for your living room', icon: '🌿' },
  { slug: 'flower-plants', name: 'Flower Plants', blurb: 'Colour that blooms season after season', icon: '🌺' },
  { slug: 'fruit-plants', name: 'Fruit Plants', blurb: 'Grafted trees that fruit in a pot', icon: '🍋' },
  { slug: 'vegetable-plants', name: 'Vegetable Plants', blurb: 'Grow your own kitchen garden', icon: '🍅' },
  { slug: 'pots', name: 'Pots & Planters', blurb: 'Clay, ceramic and more', icon: '🏺' },
  { slug: 'tools', name: 'Tools', blurb: 'Everything a plant parent needs', icon: '✂️' },
  { slug: 'seeds', name: 'Seeds', blurb: 'Start from scratch', icon: '🌱' },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]['slug'];

export function categoryName(slug: string) {
  return CATEGORIES.find((c) => c.slug === slug)?.name ?? slug;
}
