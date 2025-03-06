export const PREDEFINED_CATEGORIES = [
  'Frontend Development',
  'Backend Development',
  'DevOps',
  'Web Design',
  'Mobile Development',
  'Cloud Computing',
  'Database',
  'Security',
  'Best Practices',
  'Architecture',
] as const;

export type Category = (typeof PREDEFINED_CATEGORIES)[number];
