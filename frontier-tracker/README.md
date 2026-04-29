# Frontier Crown Tracker

Calculadora y contador de drops para craftear la Frontier Crown Tier 4
(15× Green Frontier Stone + 10× Black Frontier Stone).

Stack: **Angular 18 standalone** · **TypeScript** · **LocalStorage**
(sin backend, sin cuenta, sin servidor).

## Qué hace

- Anotás cuánto dropeás de cada material base.
- La app calcula automáticamente cuántos Frontier Stones podés craftear
  ahora mismo, considerando cuellos de botella en recursos compartidos
  (`Frontier Magic Stone` y `Disparate Rune` se usan en ambas líneas).
- Si ya crafteaste intermedios (`Green/Black Illusion Stone`,
  `Disparate Rune`), podés registrarlos en la pestaña *Intermedios*.
- Todo se guarda en LocalStorage. Cerrar el navegador no borra nada.

## Correr en local

```bash
npm install
npm start
```

Abre `http://localhost:4200`.

## Build de producción

```bash
npm run build
```

Salida en `dist/frontier-tracker/browser`.

## Deploy en Netlify

### Opción A — drag & drop
1. `npm run build`
2. Subí la carpeta `dist/frontier-tracker/browser` a
   <https://app.netlify.com/drop>.

### Opción B — Git
1. Subí este proyecto a GitHub.
2. En Netlify: *Add new site → Import from Git*.
3. La config ya está en `netlify.toml`:
   - Build: `npm run build`
   - Publish: `dist/frontier-tracker/browser`

## Recetas de referencia

| Ítem                    | Receta                                                       |
|-------------------------|--------------------------------------------------------------|
| Green Illusion Stone    | 7× Green Illusion Fragment + 150× Frontier Magic Dust        |
| Black Illusion Stone    | 7× Black Illusion Fragment + 175× Frontier Magic Dust        |
| Disparate Rune          | 10× Disparate Rune Ore + 7× Frontier Magic Stone + 10× Coin |
| Green Frontier Stone    | 7× Green Illusion Stone + 10× Frontier Magic Stone + 15× Rune |
| Black Frontier Stone    | 10× Black Illusion Stone + 15× Frontier Magic Stone + 15× Rune |

### Total de materiales base para la corona completa

| Material                | Cantidad |
|-------------------------|---------:|
| Green Illusion Fragment |      735 |
| Black Illusion Fragment |      700 |
| Frontier Magic Dust     |   33,250 |
| Frontier Magic Stone    |    2,925 |
| Disparate Rune Ore      |    3,750 |
| Golden Root Coin        |    3,750 |
