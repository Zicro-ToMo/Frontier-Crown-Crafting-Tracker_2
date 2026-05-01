import { Injectable, signal, computed, effect } from '@angular/core';
import { MaterialId, BASE_MATERIALS, INTERMEDIATE_MATERIALS } from './recipes';

const STORAGE_KEY = 'frontier-crown-tracker:droplog:v1';

/**
 * Map of `YYYY-MM-DD` -> per-material counts.
 * Only positive additions are recorded. Subtractions / corrections never
 * touch the log; the historical record is append-only by design.
 */
export type DropLog = Record<string, Partial<Record<MaterialId, number>>>;

export interface DailyEntry {
  date: string;             // YYYY-MM-DD (local)
  totals: Partial<Record<MaterialId, number>>;
  total: number;            // sum across all materials
}

/** Local-date key (NOT toISOString — that would shift the day in CR/UTC-6). */
export function localDateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

@Injectable({ providedIn: 'root' })
export class DropLogService {
  private _log = signal<DropLog>(this.load());
  log = this._log.asReadonly();

  /** Sorted list (oldest -> newest) of daily entries. */
  readonly entries = computed<DailyEntry[]>(() => {
    const log = this._log();
    const dates = Object.keys(log).sort();
    return dates.map((date) => {
      const totals = log[date] ?? {};
      const total = Object.values(totals).reduce<number>((a, b) => a + (b ?? 0), 0);
      return { date, totals, total };
    });
  });

  /** Today's entry (always returns an object, even if no drops yet). */
  readonly today = computed<DailyEntry>(() => {
    const date = localDateKey();
    const totals = this._log()[date] ?? {};
    const total = Object.values(totals).reduce<number>((a, b) => a + (b ?? 0), 0);
    return { date, totals, total };
  });

  /** Aggregate stats. */
  readonly stats = computed(() => {
    const list = this.entries();
    if (list.length === 0) {
      return { activeDays: 0, totalDrops: 0, average: 0, best: null as DailyEntry | null };
    }
    const totalDrops = list.reduce((a, e) => a + e.total, 0);
    const average = totalDrops / list.length;
    const best = list.reduce((best, cur) => (cur.total > best.total ? cur : best), list[0]);
    return { activeDays: list.length, totalDrops, average, best };
  });

  constructor() {
    effect(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this._log()));
      } catch {}
    });
    void BASE_MATERIALS; void INTERMEDIATE_MATERIALS;
  }

  /**
   * Record a positive drop of `qty` of `id` on today's date.
   * Negative or zero qty is ignored.
   */
  record(id: MaterialId, qty: number) {
    if (!Number.isFinite(qty) || qty <= 0) return;
    const key = localDateKey();
    this._log.update((log) => {
      const day = { ...(log[key] ?? {}) };
      day[id] = (day[id] ?? 0) + Math.floor(qty);
      return { ...log, [key]: day };
    });
  }

  /** Erase all daily history. */
  clearAll() {
    this._log.set({});
  }

  /** Average daily drop per material across the last `nDays` *active* days
   *  (i.e. days that have at least one drop). Days without drops are skipped
   *  so a 3-day vacation doesn't tank the projection. */
  avgPerActiveDay(nDays = 7): Partial<Record<MaterialId, number>> {
    const list = this.entries();
    if (list.length === 0) return {};
    const slice = list.slice(-nDays);
    const acc: Partial<Record<MaterialId, number>> = {};
    for (const day of slice) {
      for (const [k, v] of Object.entries(day.totals)) {
        const id = k as MaterialId;
        acc[id] = (acc[id] ?? 0) + (v ?? 0);
      }
    }
    const out: Partial<Record<MaterialId, number>> = {};
    for (const [k, v] of Object.entries(acc)) {
      out[k as MaterialId] = (v ?? 0) / slice.length;
    }
    return out;
  }

  private load(): DropLog {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return typeof parsed === 'object' && parsed !== null ? parsed : {};
    } catch {
      return {};
    }
  }
}
