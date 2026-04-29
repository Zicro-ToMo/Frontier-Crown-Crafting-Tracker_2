// Material identifiers
export type MaterialId =
  // Base materials (the ones you actually drop/farm)
  | 'green_illusion_fragment'
  | 'black_illusion_fragment'
  | 'frontier_magic_dust'
  | 'disparate_rune_ore'
  | 'frontier_magic_stone'   // also a base material per pdf page 2
  | 'golden_root_coin'
  // Crafted intermediates
  | 'green_illusion_stone'
  | 'black_illusion_stone'
  | 'disparate_rune'
  // Final goal materials
  | 'green_frontier_stone'
  | 'black_frontier_stone';

export interface MaterialDef {
  id: MaterialId;
  name: string;
  family: 'green' | 'black' | 'magic' | 'rune' | 'gold' | 'goal-green' | 'goal-black';
  tier: 'base' | 'intermediate' | 'goal';
  icon: string; // svg path key
}

export interface Recipe {
  output: MaterialId;
  inputs: { id: MaterialId; qty: number }[];
}

export const MATERIALS: Record<MaterialId, MaterialDef> = {
  green_illusion_fragment: { id: 'green_illusion_fragment', name: 'Green Illusion Fragment', family: 'green', tier: 'base', icon: 'leaf' },
  black_illusion_fragment: { id: 'black_illusion_fragment', name: 'Black Illusion Fragment', family: 'black', tier: 'base', icon: 'leaf-dark' },
  frontier_magic_dust:     { id: 'frontier_magic_dust',     name: 'Frontier Magic Dust',     family: 'magic', tier: 'base', icon: 'dust' },
  disparate_rune_ore:      { id: 'disparate_rune_ore',      name: 'Disparate Rune Ore',      family: 'rune',  tier: 'base', icon: 'ore' },
  frontier_magic_stone:    { id: 'frontier_magic_stone',    name: 'Frontier Magic Stone',    family: 'magic', tier: 'base', icon: 'crystal' },
  golden_root_coin:        { id: 'golden_root_coin',        name: 'Golden Root Coin',        family: 'gold',  tier: 'base', icon: 'coin' },

  green_illusion_stone:    { id: 'green_illusion_stone',    name: 'Green Illusion Stone',    family: 'green', tier: 'intermediate', icon: 'gem' },
  black_illusion_stone:    { id: 'black_illusion_stone',    name: 'Black Illusion Stone',    family: 'black', tier: 'intermediate', icon: 'gem-dark' },
  disparate_rune:          { id: 'disparate_rune',          name: 'Disparate Rune',          family: 'rune',  tier: 'intermediate', icon: 'rune' },

  green_frontier_stone:    { id: 'green_frontier_stone',    name: 'Green Frontier Stone',    family: 'goal-green', tier: 'goal', icon: 'crown-green' },
  black_frontier_stone:    { id: 'black_frontier_stone',    name: 'Black Frontier Stone',    family: 'goal-black', tier: 'goal', icon: 'crown-black' },
};

// Recipes per Frontier Crown 4 reference
export const RECIPES: Recipe[] = [
  {
    output: 'green_illusion_stone',
    inputs: [
      { id: 'green_illusion_fragment', qty: 7 },
      { id: 'frontier_magic_dust',     qty: 150 },
    ],
  },
  {
    output: 'black_illusion_stone',
    inputs: [
      { id: 'black_illusion_fragment', qty: 7 },
      { id: 'frontier_magic_dust',     qty: 175 },
    ],
  },
  {
    output: 'disparate_rune',
    inputs: [
      { id: 'disparate_rune_ore',   qty: 10 },
      { id: 'frontier_magic_stone', qty: 7 },
      { id: 'golden_root_coin',     qty: 10 },
    ],
  },
  {
    output: 'green_frontier_stone',
    inputs: [
      { id: 'green_illusion_stone',  qty: 7 },
      { id: 'frontier_magic_stone',  qty: 10 },
      { id: 'disparate_rune',        qty: 15 },
    ],
  },
  {
    output: 'black_frontier_stone',
    inputs: [
      { id: 'black_illusion_stone',  qty: 10 },
      { id: 'frontier_magic_stone',  qty: 15 },
      { id: 'disparate_rune',        qty: 15 },
    ],
  },
];

export const RECIPE_BY_OUTPUT: Record<string, Recipe> = RECIPES.reduce((acc, r) => {
  acc[r.output] = r;
  return acc;
}, {} as Record<string, Recipe>);

export const GOAL = {
  green_frontier_stone: 15,
  black_frontier_stone: 10,
} as const;

export const BASE_MATERIALS: MaterialId[] = [
  'green_illusion_fragment',
  'black_illusion_fragment',
  'frontier_magic_dust',
  'disparate_rune_ore',
  'frontier_magic_stone',
  'golden_root_coin',
];

export const INTERMEDIATE_MATERIALS: MaterialId[] = [
  'green_illusion_stone',
  'black_illusion_stone',
  'disparate_rune',
];
