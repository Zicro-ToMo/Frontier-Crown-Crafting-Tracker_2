import { Component, ChangeDetectionStrategy, computed, inject, signal } from '@angular/core';
import { DropLogService, localDateKey } from './drop-log.service';
import { InventoryService } from './inventory.service';
import {
  MaterialId, MATERIALS, BASE_MATERIALS, INTERMEDIATE_MATERIALS, GOAL,
} from './recipes';

interface CalendarCell {
  date: string | null;       // YYYY-MM-DD or null for blank cells
  total: number;
  intensity: number;         // 0..4 for heatmap shading
  isToday: boolean;
}

@Component({
  selector: 'app-stats',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="stats-root">
      <!-- Aggregate stats -->
      <section class="cards">
        <div class="card">
          <div class="card-label">Active days</div>
          <div class="card-value">{{ stats().activeDays }}</div>
        </div>
        <div class="card">
          <div class="card-label">Total drops logged</div>
          <div class="card-value">{{ formatNum(stats().totalDrops) }}</div>
        </div>
        <div class="card">
          <div class="card-label">Daily average</div>
          <div class="card-value">{{ formatNum(stats().average, 1) }}</div>
        </div>
        <div class="card">
          <div class="card-label">Best day</div>
          @if (stats().best) {
            <div class="card-value">{{ formatNum(stats().best!.total) }}</div>
            <div class="card-sub">{{ stats().best!.date }}</div>
          } @else {
            <div class="card-value muted">—</div>
          }
        </div>
      </section>

      <!-- Projection -->
      <section class="projection">
        <div class="projection-title">Crown completion projection</div>
        @if (projection().status === 'no-data') {
          <div class="projection-body muted">
            Log at least one day of drops to see a projection.
          </div>
        } @else if (projection().status === 'complete') {
          <div class="projection-body done">
            ✓ You already have everything needed for the Frontier Crown.
          </div>
        } @else if (projection().status === 'stalled') {
          <div class="projection-body warn">
            No recent drops for the bottleneck material — projection unavailable.
          </div>
        } @else {
          <div class="projection-body">
            At your current pace
            (<span class="mono">{{ formatNum(projection().avgPerDay!, 1) }}</span> {{ projection().bottleneckName }}/day),
            you'll finish the crown in
            <strong>~{{ projection().daysRemaining }} day{{ projection().daysRemaining === 1 ? '' : 's' }}</strong>.
            <div class="projection-meta">
              Bottleneck: <strong>{{ projection().bottleneckName }}</strong>
              · need {{ formatNum(projection().missing!) }} more
              · ETA: <span class="mono">{{ projection().etaDate }}</span>
            </div>
          </div>
        }
      </section>

      <!-- Bar chart: last 30 days -->
      <section class="panel">
        <div class="panel-head">
          <h3>Last 30 days</h3>
          <span class="panel-sub">{{ chartTotal() }} drops total</span>
        </div>
        @if (chartData().length === 0) {
          <div class="empty">No drops logged in the last 30 days.</div>
        } @else {
          <div class="chart" [style.--max-bar]="chartMax()">
            @for (d of chartData(); track d.date) {
              <div class="bar-col" [title]="d.date + ': ' + d.total + ' drops'">
                <div class="bar" [style.height.%]="(d.total / chartMax()) * 100"></div>
              </div>
            }
          </div>
          <div class="chart-axis">
            <span>{{ chartData()[0].date.slice(5) }}</span>
            <span>{{ chartData()[chartData().length - 1].date.slice(5) }}</span>
          </div>
        }
      </section>

      <!-- Calendar heatmap -->
      <section class="panel">
        <div class="panel-head">
          <h3>{{ monthLabel() }}</h3>
          <div class="month-nav">
            <button class="btn-nav" (click)="prevMonth()" aria-label="Previous month">‹</button>
            <button class="btn-nav" (click)="thisMonth()" type="button">Today</button>
            <button class="btn-nav" (click)="nextMonth()" aria-label="Next month">›</button>
          </div>
        </div>

        <div class="calendar">
          @for (label of weekdayLabels; track label) {
            <div class="cal-head">{{ label }}</div>
          }
          @for (cell of calendar(); track $index) {
            @if (cell.date) {
              <div class="cal-cell"
                   [class.today]="cell.isToday"
                   [attr.data-intensity]="cell.intensity"
                   [title]="cell.date + ': ' + cell.total + ' drops'">
                <span class="day-num">{{ cell.date.slice(8) }}</span>
                @if (cell.total > 0) {
                  <span class="day-total">{{ formatNum(cell.total) }}</span>
                }
              </div>
            } @else {
              <div class="cal-cell empty"></div>
            }
          }
        </div>

        <div class="legend">
          <span class="legend-label">Less</span>
          @for (i of [0,1,2,3,4]; track i) {
            <span class="legend-swatch" [attr.data-intensity]="i"></span>
          }
          <span class="legend-label">More</span>
        </div>
      </section>

      <!-- Chronological table -->
      <section class="panel">
        <div class="panel-head">
          <h3>Drop history</h3>
          @if (entries().length > 0) {
            <button class="btn-clear" (click)="confirmClear()" type="button">
              @if (clearConfirm()) { Confirm? } @else { Clear log }
            </button>
          }
        </div>
        @if (entries().length === 0) {
          <div class="empty">No drops logged yet. Add some drops in the Base or Intermediates tab and they'll appear here.</div>
        } @else {
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th class="num">Total</th>
                  <th>Materials</th>
                </tr>
              </thead>
              <tbody>
                @for (e of reverseEntries(); track e.date) {
                  <tr [class.today-row]="e.date === todayKey">
                    <td class="mono">{{ e.date }}</td>
                    <td class="num strong">{{ formatNum(e.total) }}</td>
                    <td class="materials">
                      @for (m of materialBreakdown(e); track m.id) {
                        <span class="chip" [attr.data-family]="m.family">
                          {{ m.name }}: <strong>{{ formatNum(m.qty) }}</strong>
                        </span>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </section>
    </div>
  `,
  styles: [`
    .stats-root { display: flex; flex-direction: column; gap: 18px; }

    /* Cards */
    .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; }
    .card {
      background: var(--bg-elev-1);
      border: 1px solid var(--line-soft);
      border-radius: var(--radius);
      padding: 14px 16px;
    }
    .card-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-muted); }
    .card-value { font-family: var(--font-mono); font-size: 24px; font-weight: 700; color: var(--text-primary); margin-top: 4px; }
    .card-value.muted { color: var(--text-dim); }
    .card-sub { font-family: var(--font-mono); font-size: 11px; color: var(--text-muted); margin-top: 2px; }

    /* Projection */
    .projection {
      background: var(--bg-elev-1);
      border: 1px solid var(--line-soft);
      border-radius: var(--radius);
      padding: 14px 18px;
    }
    .projection-title {
      font-family: var(--font-display);
      font-size: 13px;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--text-secondary);
      margin-bottom: 8px;
    }
    .projection-body { font-size: 14px; line-height: 1.5; color: var(--text-primary); }
    .projection-body.muted { color: var(--text-muted); }
    .projection-body.done { color: var(--done); }
    .projection-body.warn { color: var(--warn); }
    .projection-body strong { color: var(--text-primary); }
    .projection-meta { font-size: 12px; color: var(--text-secondary); margin-top: 6px; }
    .mono { font-family: var(--font-mono); }

    /* Panels */
    .panel {
      background: var(--bg-elev-1);
      border: 1px solid var(--line-soft);
      border-radius: var(--radius);
      padding: 16px 18px;
    }
    .panel-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 14px;
      flex-wrap: wrap;
      gap: 8px;
    }
    .panel-head h3 {
      margin: 0;
      font-family: var(--font-display);
      font-size: 14px;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--text-secondary);
      font-weight: 600;
    }
    .panel-sub { font-family: var(--font-mono); font-size: 12px; color: var(--text-muted); }
    .empty { font-size: 13px; color: var(--text-muted); padding: 20px 0; text-align: center; }

    /* Bar chart */
    .chart {
      display: grid;
      grid-template-columns: repeat(30, 1fr);
      gap: 2px;
      height: 120px;
      align-items: flex-end;
      padding: 4px 0;
    }
    .bar-col {
      height: 100%;
      display: flex;
      align-items: flex-end;
      transition: opacity 120ms ease;
    }
    .bar-col:hover { opacity: 0.7; }
    .bar {
      width: 100%;
      background: var(--green);
      border-radius: 2px 2px 0 0;
      min-height: 2px;
      transition: height 240ms cubic-bezier(0.2, 0.8, 0.2, 1);
    }
    .chart-axis {
      display: flex;
      justify-content: space-between;
      font-family: var(--font-mono);
      font-size: 10px;
      color: var(--text-muted);
      margin-top: 4px;
    }

    /* Calendar */
    .month-nav { display: flex; gap: 4px; }
    .btn-nav {
      background: var(--bg-elev-2);
      color: var(--text-secondary);
      border-radius: 6px;
      padding: 4px 10px;
      font-size: 12px;
      font-weight: 600;
      transition: background 120ms ease, color 120ms ease;
    }
    .btn-nav:hover { background: var(--bg-elev-3); color: var(--text-primary); }

    .calendar {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 4px;
    }
    .cal-head {
      text-align: center;
      font-size: 10px;
      font-weight: 600;
      color: var(--text-muted);
      padding: 4px 0;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .cal-cell {
      aspect-ratio: 1;
      background: var(--bg-deep);
      border: 1px solid var(--line-soft);
      border-radius: 6px;
      padding: 4px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      font-size: 10px;
      transition: border-color 120ms ease, background 120ms ease;
    }
    .cal-cell.empty { background: transparent; border: none; }
    .cal-cell:not(.empty):hover { border-color: var(--line); }
    .cal-cell.today { border-color: var(--green); box-shadow: 0 0 0 1px var(--green); }
    .day-num { color: var(--text-muted); font-weight: 600; font-size: 10px; }
    .day-total {
      font-family: var(--font-mono);
      color: var(--text-primary);
      font-weight: 700;
      font-size: 11px;
      align-self: flex-end;
    }
    .cal-cell[data-intensity="0"] { background: var(--bg-deep); }
    .cal-cell[data-intensity="1"] { background: color-mix(in srgb, var(--green) 12%, var(--bg-deep)); }
    .cal-cell[data-intensity="2"] { background: color-mix(in srgb, var(--green) 25%, var(--bg-deep)); }
    .cal-cell[data-intensity="3"] { background: color-mix(in srgb, var(--green) 45%, var(--bg-deep)); }
    .cal-cell[data-intensity="4"] { background: color-mix(in srgb, var(--green) 65%, var(--bg-deep)); }

    .legend {
      display: flex;
      align-items: center;
      gap: 4px;
      justify-content: flex-end;
      margin-top: 10px;
    }
    .legend-label { font-size: 10px; color: var(--text-muted); }
    .legend-swatch {
      width: 12px; height: 12px; border-radius: 3px;
      border: 1px solid var(--line-soft);
    }
    .legend-swatch[data-intensity="0"] { background: var(--bg-deep); }
    .legend-swatch[data-intensity="1"] { background: color-mix(in srgb, var(--green) 12%, var(--bg-deep)); }
    .legend-swatch[data-intensity="2"] { background: color-mix(in srgb, var(--green) 25%, var(--bg-deep)); }
    .legend-swatch[data-intensity="3"] { background: color-mix(in srgb, var(--green) 45%, var(--bg-deep)); }
    .legend-swatch[data-intensity="4"] { background: color-mix(in srgb, var(--green) 65%, var(--bg-deep)); }

    /* Table */
    .table-wrap { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    thead th {
      text-align: left;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--text-muted);
      font-weight: 600;
      padding: 8px 10px;
      border-bottom: 1px solid var(--line-soft);
    }
    th.num, td.num { text-align: right; }
    tbody tr { border-bottom: 1px solid var(--line-soft); }
    tbody tr:last-child { border-bottom: none; }
    tbody tr:hover { background: var(--bg-elev-2); }
    tbody tr.today-row { background: color-mix(in srgb, var(--green-soft) 50%, transparent); }
    td { padding: 10px; vertical-align: top; color: var(--text-primary); }
    td.mono { font-family: var(--font-mono); color: var(--text-secondary); white-space: nowrap; }
    td.strong { font-weight: 700; }
    .materials { display: flex; flex-wrap: wrap; gap: 4px; }
    .chip {
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 10px;
      background: var(--bg-elev-2);
      color: var(--text-secondary);
      white-space: nowrap;
    }
    .chip[data-family="green"] { color: var(--green); }
    .chip[data-family="black"] { color: var(--black-mat); }
    .chip[data-family="magic"] { color: var(--magic); }
    .chip[data-family="rune"] { color: var(--rune); }
    .chip[data-family="gold"] { color: var(--gold); }

    .btn-clear {
      background: var(--bg-elev-2);
      color: var(--text-secondary);
      border-radius: 6px;
      padding: 4px 10px;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      transition: background 120ms ease, color 120ms ease;
    }
    .btn-clear:hover { background: var(--rune-soft); color: var(--rune); }

    @media (max-width: 540px) {
      .chart { grid-template-columns: repeat(30, 1fr); }
      .day-total { font-size: 10px; }
      .day-num { font-size: 9px; }
    }
  `],
})
export class StatsComponent {
  private dropLog = inject(DropLogService);
  private inventory = inject(InventoryService);

  readonly weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  readonly todayKey = localDateKey();

  // Calendar navigation state
  private viewYear = signal(new Date().getFullYear());
  private viewMonth = signal(new Date().getMonth()); // 0-indexed

  entries = this.dropLog.entries;
  stats = this.dropLog.stats;
  clearConfirm = signal(false);
  private clearTimer?: ReturnType<typeof setTimeout>;

  reverseEntries = computed(() => [...this.entries()].reverse());

  /** Bar chart: last 30 days, including days with 0 drops, sorted oldest -> newest. */
  chartData = computed(() => {
    const map = new Map<string, number>();
    for (const e of this.entries()) map.set(e.date, e.total);
    const days: { date: string; total: number }[] = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = localDateKey(d);
      days.push({ date: key, total: map.get(key) ?? 0 });
    }
    return days;
  });

  chartMax = computed(() => Math.max(1, ...this.chartData().map((d) => d.total)));
  chartTotal = computed(() => this.chartData().reduce((a, d) => a + d.total, 0));

  monthLabel = computed(() => {
    const d = new Date(this.viewYear(), this.viewMonth(), 1);
    return d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  });

  /** 6-row x 7-col grid (42 cells), aligned Sun-Sat. */
  calendar = computed<CalendarCell[]>(() => {
    const year = this.viewYear();
    const month = this.viewMonth();
    const firstDow = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const map = new Map<string, number>();
    for (const e of this.entries()) map.set(e.date, e.total);

    const max = Math.max(0, ...this.entries().map((e) => e.total));

    const cells: CalendarCell[] = [];
    for (let i = 0; i < firstDow; i++) {
      cells.push({ date: null, total: 0, intensity: 0, isToday: false });
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const m = String(month + 1).padStart(2, '0');
      const d = String(day).padStart(2, '0');
      const key = `${year}-${m}-${d}`;
      const total = map.get(key) ?? 0;
      let intensity = 0;
      if (total > 0 && max > 0) {
        const ratio = total / max;
        if (ratio > 0.75) intensity = 4;
        else if (ratio > 0.5) intensity = 3;
        else if (ratio > 0.25) intensity = 2;
        else intensity = 1;
      }
      cells.push({ date: key, total, intensity, isToday: key === this.todayKey });
    }
    while (cells.length < 42) {
      cells.push({ date: null, total: 0, intensity: 0, isToday: false });
    }
    return cells;
  });

  /**
   * Projection: which BASE material is most behind, given current pace?
   * For each base material that's still missing in the *total recipe*,
   * compute days_remaining = missing / avg_daily. Bottleneck = max(days).
   */
  projection = computed(() => {
    const list = this.entries();
    if (list.length === 0) {
      return { status: 'no-data' as const };
    }

    const totalReq = this.inventory.totalRequired();
    const inv = this.inventory.inv();
    const avg = this.dropLog.avgPerActiveDay(7);

    let allComplete = true;
    let bottleneck: MaterialId | null = null;
    let bottleneckDays = 0;
    let bottleneckMissing = 0;
    let bottleneckAvg = 0;

    for (const id of BASE_MATERIALS) {
      const need = totalReq[id] ?? 0;
      const have = inv[id] ?? 0;
      const missing = Math.max(0, need - have);
      if (missing === 0) continue;
      allComplete = false;
      const a = avg[id] ?? 0;
      if (a <= 0) {
        // No recent drops for this material — projection is meaningless
        return { status: 'stalled' as const };
      }
      const days = missing / a;
      if (days > bottleneckDays) {
        bottleneckDays = days;
        bottleneck = id;
        bottleneckMissing = missing;
        bottleneckAvg = a;
      }
    }

    if (allComplete) return { status: 'complete' as const };
    if (!bottleneck) return { status: 'stalled' as const };

    const daysRemaining = Math.ceil(bottleneckDays);
    const eta = new Date();
    eta.setDate(eta.getDate() + daysRemaining);

    return {
      status: 'projected' as const,
      bottleneck,
      bottleneckName: MATERIALS[bottleneck].name,
      missing: bottleneckMissing,
      avgPerDay: bottleneckAvg,
      daysRemaining,
      etaDate: localDateKey(eta),
    };
  });

  prevMonth() {
    let m = this.viewMonth() - 1;
    let y = this.viewYear();
    if (m < 0) { m = 11; y--; }
    this.viewMonth.set(m); this.viewYear.set(y);
  }
  nextMonth() {
    let m = this.viewMonth() + 1;
    let y = this.viewYear();
    if (m > 11) { m = 0; y++; }
    this.viewMonth.set(m); this.viewYear.set(y);
  }
  thisMonth() {
    const now = new Date();
    this.viewMonth.set(now.getMonth());
    this.viewYear.set(now.getFullYear());
  }

  confirmClear() {
    if (this.clearConfirm()) {
      this.dropLog.clearAll();
      this.clearConfirm.set(false);
      if (this.clearTimer) clearTimeout(this.clearTimer);
    } else {
      this.clearConfirm.set(true);
      this.clearTimer = setTimeout(() => this.clearConfirm.set(false), 3000);
    }
  }

  materialBreakdown(e: { totals: Partial<Record<MaterialId, number>> }) {
    return (Object.entries(e.totals) as [MaterialId, number][])
      .filter(([, qty]) => qty > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([id, qty]) => ({
        id,
        qty,
        name: MATERIALS[id].name,
        family: MATERIALS[id].family,
      }));
  }

  formatNum(n: number, decimals = 0): string {
    if (!Number.isFinite(n)) return '0';
    return n.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }
}
