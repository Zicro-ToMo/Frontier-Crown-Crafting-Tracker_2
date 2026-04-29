import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IconComponent } from './icon.component';
import { MaterialDef } from './recipes';

@Component({
  selector: 'app-material-row',
  standalone: true,
  imports: [FormsModule, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="row" [attr.data-family]="material().family" [class.complete]="isComplete()">
      <div class="icon-wrap">
        <app-icon [kind]="material().icon" />
      </div>

      <div class="info">
        <div class="name">{{ material().name }}</div>
        <div class="progress-track">
          <div class="progress-fill" [style.width.%]="percent()"></div>
        </div>
        <div class="progress-label">
          <span class="have">{{ have() }}</span>
          <span class="sep">/</span>
          <span class="need">{{ need() }}</span>
          @if (isComplete()) {
            <span class="check">✓</span>
          } @else {
            <span class="missing">missing {{ missing() }}</span>
          }
        </div>
      </div>

      <div class="controls">
        <button class="btn-step" type="button" (click)="dec()" aria-label="Remove 1">−</button>
        <input
          type="number"
          inputmode="numeric"
          min="0"
          [ngModel]="have()"
          (ngModelChange)="onInput($event)"
          (focus)="$any($event.target).select()"
          aria-label="Quantity" />
        <button class="btn-step" type="button" (click)="inc()" aria-label="Add 1">+</button>
      </div>
    </div>
  `,
  styles: [`
    .row {
      display: grid;
      grid-template-columns: 44px 1fr auto;
      gap: 14px;
      align-items: center;
      padding: 12px 14px;
      background: var(--bg-elev-1);
      border: 1px solid var(--line-soft);
      border-radius: var(--radius);
      transition: border-color 160ms ease, background 160ms ease;
    }
    .row:hover {
      border-color: var(--line);
      background: var(--bg-elev-2);
    }
    .row.complete {
      background: linear-gradient(90deg, var(--bg-elev-1), color-mix(in srgb, var(--green-soft) 60%, var(--bg-elev-1)));
    }

    .icon-wrap {
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-deep);
      border-radius: 8px;
      padding: 2px;
      overflow: hidden;
    }

    /* Family colors driven by data attribute */
    .row[data-family="green"] .icon-wrap { color: var(--green); box-shadow: inset 0 0 0 1px var(--green-dim); }
    .row[data-family="black"] .icon-wrap { color: var(--black-mat); box-shadow: inset 0 0 0 1px var(--black-mat-dim); }
    .row[data-family="magic"] .icon-wrap { color: var(--magic); box-shadow: inset 0 0 0 1px rgba(127,180,214,0.25); }
    .row[data-family="rune"]  .icon-wrap { color: var(--rune);  box-shadow: inset 0 0 0 1px rgba(224,142,122,0.25); }
    .row[data-family="gold"]  .icon-wrap { color: var(--gold);  box-shadow: inset 0 0 0 1px rgba(212,184,120,0.25); }

    .info { min-width: 0; }
    .name {
      font-weight: 600;
      font-size: 14px;
      letter-spacing: 0.01em;
      color: var(--text-primary);
      margin-bottom: 6px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .progress-track {
      height: 4px;
      background: var(--bg-deep);
      border-radius: 2px;
      overflow: hidden;
      margin-bottom: 6px;
    }
    .progress-fill {
      height: 100%;
      background: var(--text-muted);
      border-radius: 2px;
      transition: width 240ms cubic-bezier(0.2, 0.8, 0.2, 1), background 240ms ease;
    }
    .row[data-family="green"] .progress-fill { background: var(--green); }
    .row[data-family="black"] .progress-fill { background: var(--black-mat); }
    .row[data-family="magic"] .progress-fill { background: var(--magic); }
    .row[data-family="rune"]  .progress-fill { background: var(--rune); }
    .row[data-family="gold"]  .progress-fill { background: var(--gold); }

    .progress-label {
      font-family: var(--font-mono);
      font-size: 12px;
      color: var(--text-secondary);
      display: flex;
      gap: 6px;
      align-items: center;
    }
    .have { color: var(--text-primary); font-weight: 700; }
    .sep { color: var(--text-dim); }
    .need { color: var(--text-secondary); }
    .check { color: var(--done); margin-left: auto; font-weight: 700; }
    .missing { margin-left: auto; color: var(--text-muted); font-size: 11px; }

    .controls {
      display: flex;
      align-items: center;
      gap: 4px;
      background: var(--bg-deep);
      padding: 4px;
      border-radius: 8px;
    }
    .btn-step {
      width: 28px;
      height: 28px;
      border-radius: 6px;
      color: var(--text-secondary);
      font-size: 16px;
      font-weight: 600;
      transition: background 120ms ease, color 120ms ease;
    }
    .btn-step:hover { background: var(--bg-elev-2); color: var(--text-primary); }
    .btn-step:active { background: var(--bg-elev-3); }

    input[type="number"] {
      width: 70px;
      height: 28px;
      border: none;
      background: transparent;
      color: var(--text-primary);
      font-family: var(--font-mono);
      font-size: 13px;
      font-weight: 600;
      text-align: center;
      outline: none;
      -moz-appearance: textfield;
    }
    input[type="number"]::-webkit-outer-spin-button,
    input[type="number"]::-webkit-inner-spin-button {
      -webkit-appearance: none; margin: 0;
    }
    input[type="number"]:focus {
      background: var(--bg-elev-2);
      border-radius: 4px;
    }

    @media (max-width: 540px) {
      .row { grid-template-columns: 36px 1fr; gap: 10px; padding: 10px; }
      .icon-wrap { width: 36px; height: 36px; padding: 1px; }
      .controls { grid-column: 1 / -1; justify-self: end; }
      .name { font-size: 13px; }
    }
  `],
})
export class MaterialRowComponent {
  material = input.required<MaterialDef>();
  have = input.required<number>();
  need = input.required<number>();

  changed = output<number>();

  percent = computed(() => {
    const n = this.need();
    if (n <= 0) return 100;
    return Math.min(100, (this.have() / n) * 100);
  });

  isComplete = computed(() => this.have() >= this.need() && this.need() > 0);

  missing = computed(() => Math.max(0, this.need() - this.have()));

  inc() { this.changed.emit(this.have() + 1); }
  dec() { this.changed.emit(Math.max(0, this.have() - 1)); }
  onInput(v: number | string) {
    const n = typeof v === 'number' ? v : parseInt(v as string, 10);
    this.changed.emit(Number.isFinite(n) ? Math.max(0, n) : 0);
  }
}
