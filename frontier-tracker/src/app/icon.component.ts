import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';

/**
 * Mapea el `kind` que ya usaban los SVG antiguos al PNG correspondiente
 * en `src/assets/icons/`. Mantener este mapping aquí evita tocar
 * `recipes.ts` y los componentes que ya pasan `material().icon`.
 */
const ICON_MAP: Record<string, string> = {
  // Base materials
  'leaf':        'icon_Green_Illusion_Fragment.png',
  'leaf-dark':   'icon_Black_Illusion_Fragment.png',
  'dust':        'icon_Frontier_Magic_Dust.png',
  'ore':         'icon_Disparate_Rune_Ore.png',
  'crystal':     'icon_Frontier_Magic_Stone.png',
  'coin':        'icon_Golden_Root_Coin.png',
  // Intermediates
  'gem':         'icon_Green_Illusion_Stone.png',
  'gem-dark':    'icon_Black_Illusion_Stone.png',
  'rune':        'icon_Disparate_Rune.png',
  // Goal
  'crown-green': 'icon_Green_Frontier_Stone.png',
  'crown-black': 'icon_Black_Frontier_Stone.png',
};

@Component({
  selector: 'app-icon',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <img class="icon" [src]="src()" [alt]="kind()" aria-hidden="true" draggable="false" />
  `,
  styles: [`
    .icon {
      width: 100%;
      height: 100%;
      display: block;
      object-fit: contain;
      user-select: none;
      -webkit-user-drag: none;
    }
  `],
})
export class IconComponent {
  kind = input.required<string>();

  src = computed(() => {
    const file = ICON_MAP[this.kind()];
    return file ? `assets/icons/${file}` : '';
  });
}
