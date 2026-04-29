import { Component, ChangeDetectionStrategy, inject, computed, signal } from '@angular/core';
import { InventoryService } from './inventory.service';
import { MaterialRowComponent } from './material-row.component';
import { IconComponent } from './icon.component';
import { MATERIALS, MaterialId, BASE_MATERIALS, INTERMEDIATE_MATERIALS, GOAL } from './recipes';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [MaterialRowComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="page">
      <header class="hero">
        <div class="hero-inner">
          <div class="brand">
            <div class="brand-mark">
              <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M4 22 L8 10 L12 18 L16 6 L20 18 L24 10 L28 22 Z" fill="url(#crown-grad)"/>
                <rect x="4" y="22" width="24" height="4" fill="url(#crown-grad)"/>
                <defs>
                  <linearGradient id="crown-grad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stop-color="#78d9b8"/>
                    <stop offset="1" stop-color="#b8a8d4"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div>
              <div class="brand-eyebrow">·Frontier Crown·</div>
              <h1>Crafting Tracker</h1>
            </div>
          </div>

          <button class="btn-reset" (click)="confirmReset()" type="button" title="Clear inventory">
            @if (resetConfirm()) {
              <span>Confirm?</span>
            } @else {
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              <span>Reboot</span>
            }
          </button>
        </div>

        <!-- Goal cards -->
        <div class="goals">
          <div class="goal-card" data-tone="green" [class.complete]="progress().green_frontier_stone >= GOAL.green_frontier_stone">
            <div class="goal-icon"><app-icon kind="crown-green" /></div>
            <div class="goal-body">
              <div class="goal-name">Green Frontier Stone</div>
              <div class="goal-count">
                <span class="num">{{ progress().green_frontier_stone }}</span>
                <span class="den">/ {{ GOAL.green_frontier_stone }}</span>
              </div>
              <div class="goal-bar">
                <div class="goal-fill" [style.width.%]="(progress().green_frontier_stone / GOAL.green_frontier_stone) * 100"></div>
              </div>
            </div>
          </div>

          <div class="goal-card" data-tone="black" [class.complete]="progress().black_frontier_stone >= GOAL.black_frontier_stone">
            <div class="goal-icon"><app-icon kind="crown-black" /></div>
            <div class="goal-body">
              <div class="goal-name">Black Frontier Stone</div>
              <div class="goal-count">
                <span class="num">{{ progress().black_frontier_stone }}</span>
                <span class="den">/ {{ GOAL.black_frontier_stone }}</span>
              </div>
              <div class="goal-bar">
                <div class="goal-fill" [style.width.%]="(progress().black_frontier_stone / GOAL.black_frontier_stone) * 100"></div>
              </div>
            </div>
          </div>
        </div>

        @if (progress().complete) {
          <div class="complete-banner">
            <span>✦</span> Sufficient inventory to complete the crown <span>✦</span>
          </div>
        }
      </header>

      <!-- Tabs -->
      <nav class="tabs" role="tablist">
        <button
          role="tab"
          [class.active]="tab() === 'base'"
          [attr.aria-selected]="tab() === 'base'"
          (click)="tab.set('base')">
          Base materials
          <span class="badge">{{ baseRows().length }}</span>
        </button>
        <button
          role="tab"
          [class.active]="tab() === 'intermediate'"
          [attr.aria-selected]="tab() === 'intermediate'"
          (click)="tab.set('intermediate')">
          Crafted intermediates
          <span class="badge">{{ intermediateRows().length }}</span>
        </button>
        <button
          role="tab"
          [class.active]="tab() === 'recipes'"
          [attr.aria-selected]="tab() === 'recipes'"
          (click)="tab.set('recipes')">
          Recipes
        </button>
      </nav>

      @if (tab() === 'base') {
        <section class="materials">
          <p class="section-hint">
            Record what you drop or farm. The top bar updates in real time.
          </p>
          @for (row of baseRows(); track row.material.id) {
            <app-material-row
              [material]="row.material"
              [have]="row.have"
              [need]="row.need"
              (changed)="onChange(row.material.id, $event)" />
          }
        </section>
      }

      @if (tab() === 'intermediate') {
        <section class="materials">
          <p class="section-hint">
            If you've already crafted some intermediates, record them here and we'll subtract them from the calculation.
          </p>
          @for (row of intermediateRows(); track row.material.id) {
            <app-material-row
              [material]="row.material"
              [have]="row.have"
              [need]="row.need"
              (changed)="onChange(row.material.id, $event)" />
          }
        </section>
      }

      @if (tab() === 'recipes') {
        <section class="recipes">
          <div class="recipe-card">
            <h3><app-icon kind="crown-green" class="ic ic-green"/> Green Frontier Stone</h3>
            <ul>
              <li>7× Green Illusion Stone</li>
              <li>10× Frontier Magic Stone</li>
              <li>15× Disparate Rune</li>
            </ul>
          </div>
          <div class="recipe-card">
            <h3><app-icon kind="crown-black" class="ic ic-black"/> Black Frontier Stone</h3>
            <ul>
              <li>10× Black Illusion Stone</li>
              <li>15× Frontier Magic Stone</li>
              <li>15× Disparate Rune</li>
            </ul>
          </div>
          <div class="recipe-card">
            <h3><app-icon kind="gem" class="ic ic-green"/> Green Illusion Stone</h3>
            <ul>
              <li>7× Green Illusion Fragment</li>
              <li>150× Frontier Magic Dust</li>
            </ul>
          </div>
          <div class="recipe-card">
            <h3><app-icon kind="gem-dark" class="ic ic-black"/> Black Illusion Stone</h3>
            <ul>
              <li>7× Black Illusion Fragment</li>
              <li>175× Frontier Magic Dust</li>
            </ul>
          </div>
          <div class="recipe-card">
            <h3><app-icon kind="rune" class="ic ic-rune"/> Disparate Rune</h3>
            <ul>
              <li>10× Disparate Rune Ore</li>
              <li>7× Frontier Magic Stone</li>
              <li>10× Golden Root Coin</li>
            </ul>
          </div>
        </section>
      }

      <footer class="foot">
        <span>Data stored locally in your browser</span>
        <span class="dot">·</span>
        <span>No server · No account</span>
      </footer>
    </main>
  `,
  styles: [`
    .page {
      max-width: 1100px;
      margin: 0 auto;
      padding: 32px 24px 48px;
    }

    /* HERO */
    .hero { margin-bottom: 24px; }
    .hero-inner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 20px;
    }
    .brand { display: flex; align-items: center; gap: 14px; }
    .brand-mark {
      width: 48px; height: 48px;
      background: var(--bg-elev-1);
      border-radius: 10px;
      padding: 8px;
      box-shadow: 0 0 0 1px var(--line-soft), 0 8px 24px rgba(0,0,0,0.3);
    }
    .brand-mark svg { width: 100%; height: 100%; display: block; }
    .brand-eyebrow {
      font-family: var(--font-mono);
      font-size: 11px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--text-muted);
      margin-bottom: 2px;
    }
    h1 {
      font-family: var(--font-display);
      font-weight: 500;
      font-size: 28px;
      letter-spacing: 0.02em;
      color: var(--text-primary);
      margin: 0;
      line-height: 1;
    }

    .btn-reset {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 14px;
      background: var(--bg-elev-1);
      border: 1px solid var(--line-soft);
      border-radius: 8px;
      color: var(--text-secondary);
      font-size: 13px;
      font-weight: 500;
      transition: all 150ms ease;
    }
    .btn-reset:hover {
      background: var(--bg-elev-2);
      color: var(--text-primary);
      border-color: var(--rune);
    }

    /* GOAL CARDS */
    .goals {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
    }
    .goal-card {
      display: grid;
      grid-template-columns: 56px 1fr;
      gap: 16px;
      align-items: center;
      padding: 18px 20px;
      background: var(--bg-elev-1);
      border: 1px solid var(--line-soft);
      border-radius: var(--radius-lg);
      position: relative;
      overflow: hidden;
    }
    .goal-card::before {
      content: '';
      position: absolute;
      inset: 0;
      pointer-events: none;
      background: radial-gradient(circle at 90% -20%, var(--accent-soft, transparent), transparent 60%);
    }
    .goal-card[data-tone="green"] { --accent: var(--green); --accent-soft: var(--green-soft); }
    .goal-card[data-tone="black"] { --accent: var(--black-mat); --accent-soft: var(--black-mat-soft); }

    .goal-card.complete {
      border-color: var(--accent);
      box-shadow: 0 0 0 1px var(--accent), 0 8px 28px color-mix(in srgb, var(--accent) 18%, transparent);
    }

    .goal-icon {
      width: 56px; height: 56px;
      background: var(--bg-deep);
      border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      padding: 10px;
      color: var(--accent);
      box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--accent) 25%, transparent);
    }

    .goal-body { min-width: 0; }
    .goal-name {
      font-family: var(--font-display);
      font-size: 15px;
      letter-spacing: 0.04em;
      color: var(--text-primary);
      margin-bottom: 4px;
    }
    .goal-count {
      font-family: var(--font-mono);
      font-size: 13px;
      color: var(--text-secondary);
      margin-bottom: 8px;
    }
    .goal-count .num {
      color: var(--accent);
      font-size: 22px;
      font-weight: 700;
    }
    .goal-count .den { margin-left: 4px; color: var(--text-muted); }

    .goal-bar {
      height: 6px;
      background: var(--bg-deep);
      border-radius: 3px;
      overflow: hidden;
    }
    .goal-fill {
      height: 100%;
      background: var(--accent);
      border-radius: 3px;
      transition: width 320ms cubic-bezier(0.2, 0.8, 0.2, 1);
    }

    .complete-banner {
      margin-top: 18px;
      padding: 14px 18px;
      background: linear-gradient(90deg, var(--green-soft), var(--black-mat-soft));
      border: 1px solid color-mix(in srgb, var(--green) 30%, transparent);
      border-radius: var(--radius);
      text-align: center;
      font-family: var(--font-display);
      letter-spacing: 0.06em;
      color: var(--text-primary);
    }
    .complete-banner span {
      color: var(--green);
      margin: 0 10px;
    }

    /* TABS */
    .tabs {
      display: flex;
      gap: 2px;
      margin-bottom: 16px;
      background: var(--bg-elev-1);
      padding: 4px;
      border-radius: 10px;
      border: 1px solid var(--line-soft);
      width: fit-content;
    }
    .tabs button {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border-radius: 7px;
      color: var(--text-secondary);
      font-size: 13px;
      font-weight: 500;
      transition: all 150ms ease;
    }
    .tabs button:hover { color: var(--text-primary); }
    .tabs button.active {
      background: var(--bg-elev-3);
      color: var(--text-primary);
      box-shadow: 0 1px 0 0 rgba(255,255,255,0.04);
    }
    .badge {
      font-family: var(--font-mono);
      font-size: 11px;
      padding: 1px 6px;
      background: var(--bg-deep);
      border-radius: 10px;
      color: var(--text-muted);
    }

    /* MATERIALS LIST */
    .materials {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .section-hint {
      color: var(--text-muted);
      font-size: 13px;
      margin: 4px 4px 12px;
    }

    /* RECIPES */
    .recipes {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 14px;
    }
    .recipe-card {
      padding: 18px;
      background: var(--bg-elev-1);
      border: 1px solid var(--line-soft);
      border-radius: var(--radius);
    }
    .recipe-card h3 {
      display: flex;
      align-items: center;
      gap: 10px;
      font-family: var(--font-display);
      font-weight: 500;
      font-size: 15px;
      margin: 0 0 10px;
      color: var(--text-primary);
    }
    .recipe-card .ic {
      width: 24px; height: 24px;
      flex: 0 0 24px;
    }
    .ic-green :global(.icon),
    .recipe-card h3 .ic-green { color: var(--green); }
    .recipe-card h3 .ic-black { color: var(--black-mat); }
    .recipe-card h3 .ic-rune  { color: var(--rune); }
    /* Direct color via CSS var on icon component */
    .recipe-card h3 app-icon { display: block; width: 24px; height: 24px; }
    .recipe-card h3 app-icon.ic-green { color: var(--green); }
    .recipe-card h3 app-icon.ic-black { color: var(--black-mat); }
    .recipe-card h3 app-icon.ic-rune { color: var(--rune); }

    .recipe-card ul {
      margin: 0;
      padding: 0 0 0 16px;
      color: var(--text-secondary);
      font-size: 13px;
      line-height: 1.7;
    }

    /* FOOTER */
    .foot {
      margin-top: 32px;
      text-align: center;
      color: var(--text-dim);
      font-size: 12px;
      font-family: var(--font-mono);
    }
    .foot .dot { margin: 0 8px; }

    @media (max-width: 720px) {
      .page { padding: 20px 16px 36px; }
      h1 { font-size: 22px; }
      .goals { grid-template-columns: 1fr; }
      .goal-icon { width: 48px; height: 48px; }
      .goal-card { padding: 14px; }
    }
  `],
})
export class AppComponent {
  private inventory = inject(InventoryService);

  // Expose to template
  readonly GOAL = GOAL;

  tab = signal<'base' | 'intermediate' | 'recipes'>('base');
  resetConfirm = signal(false);
  private resetTimer: any;

  progress = this.inventory.progress;
  totalRequired = this.inventory.totalRequired;
  intermediateRequired = this.inventory.intermediateRequired;

  baseRows = computed(() => {
    const inv = this.inventory.inv();
    const req = this.totalRequired();
    return BASE_MATERIALS.map((id: MaterialId) => ({
      material: MATERIALS[id],
      have: inv[id] ?? 0,
      need: req[id] ?? 0,
    }));
  });

  intermediateRows = computed(() => {
    const inv = this.inventory.inv();
    const req = this.intermediateRequired();
    return INTERMEDIATE_MATERIALS.map((id: MaterialId) => ({
      material: MATERIALS[id],
      have: inv[id] ?? 0,
      need: req[id] ?? 0,
    }));
  });

  onChange(id: MaterialId, qty: number) {
    this.inventory.setQty(id, qty);
  }

  confirmReset() {
    if (this.resetConfirm()) {
      this.inventory.resetAll();
      this.resetConfirm.set(false);
      clearTimeout(this.resetTimer);
    } else {
      this.resetConfirm.set(true);
      this.resetTimer = setTimeout(() => this.resetConfirm.set(false), 3000);
    }
  }
}
