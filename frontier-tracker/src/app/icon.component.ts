import { Component, ChangeDetectionStrategy, input } from '@angular/core';

@Component({
  selector: 'app-icon',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg class="icon" [attr.viewBox]="'0 0 32 32'" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      @switch (kind()) {
        @case ('leaf') {
          <path d="M16 4 C8 8, 6 18, 10 26 C14 22, 22 22, 26 14 C22 12, 18 8, 16 4 Z"
                fill="currentColor" opacity="0.85"/>
          <path d="M10 26 L20 14" stroke="currentColor" stroke-width="1.5" fill="none" opacity="0.5"/>
        }
        @case ('leaf-dark') {
          <path d="M16 4 C8 8, 6 18, 10 26 C14 22, 22 22, 26 14 C22 12, 18 8, 16 4 Z"
                fill="currentColor" opacity="0.85"/>
          <path d="M10 26 L20 14" stroke="currentColor" stroke-width="1.5" fill="none" opacity="0.5"/>
        }
        @case ('dust') {
          <circle cx="10" cy="14" r="3" fill="currentColor" opacity="0.6"/>
          <circle cx="20" cy="10" r="2" fill="currentColor" opacity="0.4"/>
          <circle cx="22" cy="20" r="3.5" fill="currentColor" opacity="0.7"/>
          <circle cx="14" cy="22" r="2" fill="currentColor" opacity="0.5"/>
          <circle cx="16" cy="16" r="1.5" fill="currentColor"/>
          <circle cx="8" cy="22" r="1.2" fill="currentColor" opacity="0.4"/>
          <circle cx="24" cy="14" r="1" fill="currentColor" opacity="0.5"/>
        }
        @case ('ore') {
          <path d="M6 22 L10 12 L18 8 L26 14 L24 24 L14 26 Z"
                fill="currentColor" opacity="0.7"/>
          <path d="M10 12 L18 8 L24 24 M6 22 L18 8" stroke="currentColor" stroke-width="0.8" fill="none" opacity="0.4"/>
        }
        @case ('crystal') {
          <path d="M16 3 L24 12 L20 28 L12 28 L8 12 Z"
                fill="currentColor" opacity="0.85"/>
          <path d="M16 3 L16 28 M8 12 L24 12" stroke="rgba(255,255,255,0.3)" stroke-width="0.8" fill="none"/>
        }
        @case ('coin') {
          <circle cx="16" cy="16" r="11" fill="currentColor" opacity="0.85"/>
          <circle cx="16" cy="16" r="8" fill="none" stroke="rgba(0,0,0,0.25)" stroke-width="1"/>
          <path d="M12 16 L16 11 L20 16 L16 21 Z" fill="rgba(0,0,0,0.3)"/>
        }
        @case ('gem') {
          <path d="M8 12 L12 6 L20 6 L24 12 L16 28 Z"
                fill="currentColor" opacity="0.9"/>
          <path d="M8 12 L24 12 M12 6 L16 12 L20 6 M16 12 L16 28"
                stroke="rgba(255,255,255,0.4)" stroke-width="0.8" fill="none"/>
        }
        @case ('gem-dark') {
          <path d="M8 12 L12 6 L20 6 L24 12 L16 28 Z"
                fill="currentColor" opacity="0.9"/>
          <path d="M8 12 L24 12 M12 6 L16 12 L20 6 M16 12 L16 28"
                stroke="rgba(255,255,255,0.4)" stroke-width="0.8" fill="none"/>
        }
        @case ('rune') {
          <path d="M16 4 C20 8 26 12 26 18 C26 24 22 28 16 28 C10 28 6 24 6 18 C6 12 12 8 16 4 Z"
                fill="currentColor" opacity="0.85"/>
          <path d="M16 12 L19 18 L13 18 Z" fill="rgba(255,255,255,0.5)"/>
          <circle cx="16" cy="20" r="1.2" fill="rgba(255,255,255,0.6)"/>
        }
        @case ('crown-green') {
          <path d="M4 22 L8 10 L12 18 L16 6 L20 18 L24 10 L28 22 Z"
                fill="currentColor" opacity="0.9"/>
          <rect x="4" y="22" width="24" height="4" fill="currentColor" opacity="0.7"/>
          <circle cx="16" cy="13" r="1.5" fill="rgba(255,255,255,0.6)"/>
        }
        @case ('crown-black') {
          <path d="M4 22 L8 10 L12 18 L16 6 L20 18 L24 10 L28 22 Z"
                fill="currentColor" opacity="0.9"/>
          <rect x="4" y="22" width="24" height="4" fill="currentColor" opacity="0.7"/>
          <circle cx="16" cy="13" r="1.5" fill="rgba(255,255,255,0.6)"/>
        }
      }
    </svg>
  `,
  styles: [`
    .icon { width: 100%; height: 100%; display: block; }
  `],
})
export class IconComponent {
  kind = input.required<string>();
}
