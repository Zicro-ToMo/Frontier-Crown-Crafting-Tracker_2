import { Injectable, signal, computed, effect, inject } from '@angular/core';
import {
  MaterialId, BASE_MATERIALS, INTERMEDIATE_MATERIALS,
  RECIPE_BY_OUTPUT, GOAL, MATERIALS,
} from './recipes';
import { DropLogService } from './drop-log.service';

const STORAGE_KEY = 'frontier-crown-tracker:v1';

type Inventory = Record<MaterialId, number>;

function emptyInventory(): Inventory {
  const inv = {} as Inventory;
  (Object.keys(MATERIALS) as MaterialId[]).forEach((id) => (inv[id] = 0));
  return inv;
}

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private dropLog = inject(DropLogService);

  // Raw drops the user has registered
  private _inv = signal<Inventory>(this.load());

  inv = this._inv.asReadonly();

  /**
   * Total raw base materials required to complete the goal from scratch
   * (15 Green Frontier Stone + 10 Black Frontier Stone).
   */
  readonly totalRequired = computed<Inventory>(() => {
    const req = emptyInventory();
    this.accumulate(req, 'green_frontier_stone', GOAL.green_frontier_stone);
    this.accumulate(req, 'black_frontier_stone', GOAL.black_frontier_stone);
    return req;
  });

  /**
   * Required intermediates (illusion stones + runes) for the full goal.
   */
  readonly intermediateRequired = computed<Inventory>(() => {
    const req = emptyInventory();
    // Green path
    const greenStone = RECIPE_BY_OUTPUT['green_frontier_stone'];
    if (greenStone) {
      for (const i of greenStone.inputs) req[i.id] += i.qty * GOAL.green_frontier_stone;
    }
    // Black path
    const blackStone = RECIPE_BY_OUTPUT['black_frontier_stone'];
    if (blackStone) {
      for (const i of blackStone.inputs) req[i.id] += i.qty * GOAL.black_frontier_stone;
    }
    return req;
  });

  /**
   * For each intermediate, how many you could craft RIGHT NOW with the
   * current BASE inventory alone (ignoring already-crafted intermediates).
   * Bottleneck = min(have / qty) across the recipe inputs.
   * Note: this is the per-recipe potential in isolation. If two recipes
   * share an input (e.g. frontier_magic_stone is in disparate_rune AND in
   * the frontier stones), you can't actually craft the sum of these
   * numbers — they compete for the same pool. But for a "what can I make
   * with what I have" indicator it's the right answer per item.
   */
  readonly craftableFromBase = computed<Partial<Record<MaterialId, number>>>(() => {
    const inv = this._inv();
    const out: Partial<Record<MaterialId, number>> = {};
    for (const id of INTERMEDIATE_MATERIALS) {
      const recipe = RECIPE_BY_OUTPUT[id];
      if (!recipe) continue;
      let n = Infinity;
      for (const inp of recipe.inputs) {
        const have = inv[inp.id] ?? 0;
        const possible = Math.floor(have / inp.qty);
        if (possible < n) n = possible;
      }
      out[id] = Number.isFinite(n) ? n : 0;
    }
    return out;
  });

  /**
   * Goal progress: how many final stones you can craft RIGHT NOW with current
   * raw inventory. Calculated by simulating crafting greedily, prioritizing
   * the goal stones based on shared resources (rune & magic stone).
   */
  readonly progress = computed(() => {
    const inv = { ...this._inv() };

    // Try to craft as many of each goal as possible, sharing resources.
    // Strategy: craft up to the goal target, no more. Prefer crafting whichever
    // final stone the user has more raw progress toward.

    const craftable = (output: MaterialId, available: Inventory, max: number): number => {
      const recipe = RECIPE_BY_OUTPUT[output];
      if (!recipe) return 0;
      let n = max;
      for (const inp of recipe.inputs) {
        const have = available[inp.id] ?? 0;
        const possibleFromHere = Math.floor(have / inp.qty);
        if (possibleFromHere < n) n = possibleFromHere;
      }
      return Math.max(0, n);
    };

    // Recursively figure out how many of `output` we can craft (up to maxNeeded)
    // by also crafting subcomponents on the fly.
    const craftRecursive = (
      output: MaterialId,
      maxNeeded: number,
      available: Inventory,
    ): number => {
      if (maxNeeded <= 0) return 0;
      const recipe = RECIPE_BY_OUTPUT[output];
      // Direct stockpile
      let direct = available[output] ?? 0;
      if (!recipe) return Math.min(direct, maxNeeded);

      let crafted = Math.min(direct, maxNeeded);
      // Try to craft more from sub-resources
      while (crafted < maxNeeded) {
        // Check if we have enough for one more
        let canMakeOne = true;
        for (const inp of recipe.inputs) {
          const subRecipe = RECIPE_BY_OUTPUT[inp.id];
          let have = available[inp.id] ?? 0;
          if (have < inp.qty && subRecipe) {
            // Try to craft enough of inp.id
            const need = inp.qty - have;
            const made = craftRecursive(inp.id, need, available);
            // craftRecursive doesn't deduct; we re-check available
            have = available[inp.id] ?? 0;
            if (have < inp.qty) { canMakeOne = false; break; }
          } else if (have < inp.qty) {
            canMakeOne = false; break;
          }
        }
        if (!canMakeOne) break;
        // Deduct inputs
        for (const inp of recipe.inputs) {
          available[inp.id] -= inp.qty;
        }
        crafted++;
      }
      return crafted;
    };

    // We need a smarter shared-resource simulation. Make a working copy and
    // alternate crafting Green & Black until neither can advance.
    const work = { ...inv };
    let green = 0;
    let black = 0;

    // Helper that attempts to craft 1 unit of a goal (recursively crafting
    // intermediates), deducting from `work`. Returns true on success.
    const tryCraftOne = (output: MaterialId): boolean => {
      const recipe = RECIPE_BY_OUTPUT[output];
      if (!recipe) {
        if ((work[output] ?? 0) >= 1) { work[output]--; return true; }
        return false;
      }
      // Snapshot in case of rollback
      const snapshot = { ...work };
      // Use existing stockpile of `output` first
      if ((work[output] ?? 0) >= 1) { work[output]--; return true; }

      for (const inp of recipe.inputs) {
        let need = inp.qty;
        // Use any stockpile of inp first
        const stock = work[inp.id] ?? 0;
        const useFromStock = Math.min(stock, need);
        work[inp.id] -= useFromStock;
        need -= useFromStock;
        // Craft remaining recursively
        while (need > 0) {
          const ok = tryCraftOne(inp.id);
          if (!ok) {
            // rollback
            Object.assign(work, snapshot);
            return false;
          }
          need--;
        }
      }
      return true;
    };

    // Alternate to spread shared resources (frontier_magic_stone, disparate_rune)
    // fairly. Cap at goal targets.
    while (green < GOAL.green_frontier_stone || black < GOAL.black_frontier_stone) {
      let progressed = false;
      if (green < GOAL.green_frontier_stone && tryCraftOne('green_frontier_stone')) {
        green++; progressed = true;
      }
      if (black < GOAL.black_frontier_stone && tryCraftOne('black_frontier_stone')) {
        black++; progressed = true;
      }
      if (!progressed) break;
    }

    return {
      green_frontier_stone: green,
      black_frontier_stone: black,
      goal_green: GOAL.green_frontier_stone,
      goal_black: GOAL.black_frontier_stone,
      complete: green >= GOAL.green_frontier_stone && black >= GOAL.black_frontier_stone,
    };
  });

  constructor() {
    effect(() => {
      const data = this._inv();
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch {}
    });
    // Suppress unused import warning
    void BASE_MATERIALS; void INTERMEDIATE_MATERIALS;
  }

  setQty(id: MaterialId, qty: number) {
    const safe = Math.max(0, Math.floor(qty || 0));
    const prev = this._inv()[id] ?? 0;
    if (safe > prev) this.dropLog.record(id, safe - prev);
    this._inv.update((inv) => ({ ...inv, [id]: safe }));
  }

  add(id: MaterialId, delta: number) {
    if (delta > 0) this.dropLog.record(id, delta);
    this._inv.update((inv) => ({ ...inv, [id]: Math.max(0, (inv[id] ?? 0) + delta) }));
  }

  resetAll() {
    this._inv.set(emptyInventory());
  }

  /**
   * Recursively accumulate base materials needed to craft `qty` of `output`.
   */
  private accumulate(req: Inventory, output: MaterialId, qty: number) {
    const recipe = RECIPE_BY_OUTPUT[output];
    if (!recipe) {
      req[output] += qty;
      return;
    }
    for (const inp of recipe.inputs) {
      this.accumulate(req, inp.id, inp.qty * qty);
    }
  }

  private load(): Inventory {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return emptyInventory();
      const parsed = JSON.parse(raw);
      const base = emptyInventory();
      for (const k of Object.keys(base) as MaterialId[]) {
        if (typeof parsed[k] === 'number') base[k] = parsed[k];
      }
      return base;
    } catch {
      return emptyInventory();
    }
  }
}
