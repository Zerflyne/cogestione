<script>
  // Disegnini a mano libera, in SVG, che si tracciano da soli quando entrano nello schermo.
  // Il colore è currentColor: si decide da fuori (inchiostro, rosso o porpora).
  import { disegna } from '../lib/azioni.js';

  let { nome, ritardo = 0, passo = 140, durata = 900, spessore = 2, class: classe = '', ...resto } = $props();
</script>

{#if nome === 'sottolinea'}
  <!-- Sottolineatura a due passate -->
  <svg class="schizzo {classe}" viewBox="0 0 300 24" preserveAspectRatio="none" aria-hidden="true" use:disegna={{ ritardo, passo, durata }} {...resto}>
    <path data-tratto stroke-width={spessore * 1.6} d="M4 15 C 60 9, 140 8, 210 10 S 280 12, 296 9" />
    <path data-tratto stroke-width={spessore} d="M30 20 C 90 15, 170 15, 270 17" />
  </svg>
{:else if nome === 'cerchio'}
  <!-- Cerchio fatto di corsa, che non si chiude bene -->
  <svg class="schizzo {classe}" viewBox="0 0 200 90" preserveAspectRatio="none" aria-hidden="true" use:disegna={{ ritardo, passo, durata }} {...resto}>
    <path data-tratto stroke-width={spessore} d="M120 8 C 60 2, 10 18, 8 44 C 6 72, 70 86, 120 82 C 170 78, 196 60, 192 38 C 188 14, 140 4, 92 10 C 70 13, 54 18, 44 24" />
  </svg>
{:else if nome === 'freccia'}
  <svg class="schizzo {classe}" viewBox="0 0 120 80" aria-hidden="true" use:disegna={{ ritardo, passo, durata }} {...resto}>
    <path data-tratto stroke-width={spessore} d="M8 12 C 30 60, 70 70, 106 54" />
    <path data-tratto stroke-width={spessore} d="M92 42 L 107 54 L 90 66" />
  </svg>
{:else if nome === 'scintille'}
  <svg class="schizzo {classe}" viewBox="0 0 48 48" aria-hidden="true" use:disegna={{ ritardo, passo: 90, durata: 400 }} {...resto}>
    <path data-tratto stroke-width={spessore} d="M10 22 L 4 18" />
    <path data-tratto stroke-width={spessore} d="M20 12 L 18 3" />
    <path data-tratto stroke-width={spessore} d="M32 14 L 40 6" />
  </svg>
{:else if nome === 'calendario'}
  <!-- Illustrazione della home: una settimana di cinque giorni, un giorno cerchiato, una matita. -->
  <svg class="schizzo {classe}" viewBox="0 0 340 280" aria-hidden="true" use:disegna={{ ritardo, passo: 70, durata: 700 }} {...resto}>
    <g class="inchiostro" stroke-width="2.2">
      <path data-tratto d="M44 60 C 112 55, 204 58, 284 53 C 287 112, 284 176, 288 236 C 204 239, 122 236, 41 240 C 39 176, 43 112, 44 60" />
      <path data-tratto d="M46 96 C 122 92, 204 97, 285 93" />
      <path data-tratto d="M92 97 C 93 144, 91 196, 93 237" />
      <path data-tratto d="M140 96 C 139 146, 141 194, 139 238" />
      <path data-tratto d="M188 95 C 189 144, 187 192, 189 237" />
      <path data-tratto d="M236 94 C 235 142, 237 190, 236 236" />
      <path data-tratto d="M86 48 c -9 -2, -10 14, 0 16 M156 46 c -9 -2, -10 14, 0 16 M226 45 c -9 -2, -10 14, 0 16" />
    </g>
    <g class="matita-testo">
      <text x="61" y="84">L</text><text x="109" y="84">M</text><text x="158" y="83">M</text><text x="207" y="83">G</text><text x="254" y="82">V</text>
    </g>
    <g class="inchiostro" stroke-width="1.6">
      <path data-tratto d="M52 108 L 84 107 L 84 134 L 52 135 Z" />
      <path data-tratto d="M55 130 L 70 110 M64 133 L 82 111" />
      <path data-tratto d="M100 150 L 132 149 L 132 180 L 100 181 Z" />
      <path data-tratto d="M103 176 L 120 152 M112 179 L 130 155" />
      <path data-tratto d="M196 112 L 228 111 L 228 140 L 196 141 Z" />
      <path data-tratto d="M244 170 L 276 169 L 276 200 L 244 201 Z" />
      <path data-tratto d="M247 196 L 264 173 M256 199 L 274 176" />
      <path data-tratto d="M52 196 L 84 195 L 84 226 L 52 227 Z" />
    </g>
    <g class="rosso" stroke-width="2.6">
      <path data-tratto data-durata="1100" d="M176 104 C 150 100, 140 132, 142 170 C 144 212, 176 228, 196 214 C 214 200, 212 140, 200 116 C 192 100, 170 96, 156 108" />
      <path data-tratto d="M300 36 L 306 20 M314 44 L 330 36 M296 52 L 284 44" />
    </g>
    <g class="inchiostro" stroke-width="2">
      <path data-tratto d="M246 268 L 318 196 L 332 210 L 260 282" />
      <path data-tratto d="M246 268 L 240 286 L 260 282" />
      <path data-tratto d="M306 208 L 320 222" />
    </g>
  </svg>
{:else if nome === 'lampadina'}
  <svg class="schizzo {classe}" viewBox="0 0 48 48" aria-hidden="true" use:disegna={{ ritardo, passo: 120, durata: 600 }} {...resto}>
    <path data-tratto stroke-width="2" d="M18 32 C 10 26, 12 10, 24 9 C 36 8, 39 24, 30 32 C 29 34, 29 36, 29 38 L 19 38 C 19 36, 19 34, 18 32" />
    <path data-tratto stroke-width="2" d="M20 42 L 28 42" />
    <path data-tratto stroke-width="2" class="rosso" d="M40 8 L 44 4 M42 16 L 47 16 M8 8 L 4 4" />
  </svg>
{:else if nome === 'griglia'}
  <svg class="schizzo {classe}" viewBox="0 0 48 48" aria-hidden="true" use:disegna={{ ritardo, passo: 100, durata: 600 }} {...resto}>
    <path data-tratto stroke-width="2" d="M7 11 C 20 10, 30 11, 41 10 C 42 22, 41 32, 42 40 C 30 41, 18 40, 6 41 C 6 30, 7 20, 7 11" />
    <path data-tratto stroke-width="2" d="M7 19 L 41 18 M19 19 L 19 40 M30 18 L 30 40" />
    <path data-tratto stroke-width="2" class="rosso" d="M33 24 L 36 30 L 44 20" />
  </svg>
{:else if nome === 'spunta'}
  <svg class="schizzo {classe}" viewBox="0 0 48 48" aria-hidden="true" use:disegna={{ ritardo, passo: 120, durata: 600 }} {...resto}>
    <path data-tratto stroke-width="2" d="M24 6 C 12 6, 5 15, 6 25 C 7 36, 16 42, 25 42 C 36 41, 43 33, 42 22 C 41 12, 33 6, 22 8" />
    <path data-tratto stroke-width="2.6" class="rosso" d="M15 24 L 22 31 L 35 16" />
  </svg>
{:else if nome === 'stella'}
  <svg class="schizzo {classe}" viewBox="0 0 48 48" aria-hidden="true" use:disegna={{ ritardo, passo: 120, durata: 700 }} {...resto}>
    <path data-tratto stroke-width="2" d="M24 5 L 29 18 L 43 19 L 32 28 L 36 42 L 24 34 L 12 42 L 16 28 L 5 19 L 19 18 Z" />
    <path data-tratto stroke-width="2" class="rosso" d="M41 4 L 44 9 M46 12 L 41 13" />
  </svg>
{:else if nome === 'chiave'}
  <svg class="schizzo {classe}" viewBox="0 0 96 96" aria-hidden="true" use:disegna={{ ritardo, passo: 110, durata: 700 }} {...resto}>
    <path data-tratto stroke-width="2.2" d="M30 22 C 16 22, 10 36, 16 46 C 22 56, 40 56, 44 44 C 48 32, 42 22, 30 22" />
    <path data-tratto stroke-width="2.2" d="M27 34 C 24 36, 26 41, 30 40" />
    <path data-tratto stroke-width="2.2" d="M43 47 C 56 60, 66 70, 82 84" />
    <path data-tratto stroke-width="2.2" d="M66 70 L 72 63 M74 77 L 80 70" />
    <path data-tratto stroke-width="2.4" class="rosso" d="M58 18 L 62 10 M68 26 L 78 22 M54 30 L 60 34" />
  </svg>
{:else if nome === 'busta'}
  <svg class="schizzo {classe}" viewBox="0 0 96 96" aria-hidden="true" use:disegna={{ ritardo, passo: 110, durata: 700 }} {...resto}>
    <path data-tratto stroke-width="2.2" d="M12 30 C 34 29, 60 30, 84 28 C 85 46, 84 62, 85 76 C 60 77, 36 76, 12 77 C 11 62, 12 46, 12 30" />
    <path data-tratto stroke-width="2.2" d="M13 31 C 28 44, 40 54, 48 56 C 58 54, 70 44, 83 30" />
    <path data-tratto stroke-width="2.4" class="rosso" d="M70 8 C 64 12, 66 20, 72 18 C 78 16, 78 8, 72 8" />
    <path data-tratto stroke-width="2" class="rosso" d="M60 22 C 64 18, 66 16, 68 14" />
  </svg>
{:else if nome === 'lista'}
  <svg class="schizzo {classe}" viewBox="0 0 96 96" aria-hidden="true" use:disegna={{ ritardo, passo: 90, durata: 600 }} {...resto}>
    <path data-tratto stroke-width="2.2" d="M20 10 C 40 9, 60 10, 76 9 C 77 36, 76 62, 77 86 C 58 87, 38 86, 19 87 C 18 62, 19 36, 20 10" />
    <path data-tratto stroke-width="2" d="M30 28 L 34 32 L 40 24" />
    <path data-tratto stroke-width="2" d="M46 28 C 54 27, 60 28, 66 27" />
    <path data-tratto stroke-width="2" d="M30 48 L 34 52 L 40 44" />
    <path data-tratto stroke-width="2" d="M46 48 C 54 47, 60 48, 66 47" />
    <path data-tratto stroke-width="2" d="M30 68 C 32 66, 38 66, 40 68" />
    <path data-tratto stroke-width="2" d="M46 68 C 52 67, 56 68, 60 67" />
    <path data-tratto stroke-width="2.6" class="rosso" d="M26 62 C 20 66, 24 76, 34 74 C 44 72, 44 62, 36 60 C 32 59, 28 60, 26 62" />
  </svg>
{:else if nome === 'lente'}
  <svg class="schizzo {classe}" viewBox="0 0 96 96" aria-hidden="true" use:disegna={{ ritardo, passo: 110, durata: 700 }} {...resto}>
    <path data-tratto stroke-width="2.2" d="M40 14 C 22 14, 12 28, 14 42 C 16 58, 32 66, 46 62 C 62 58, 68 42, 62 28 C 58 18, 48 14, 36 16" />
    <path data-tratto stroke-width="2.6" d="M58 58 C 66 66, 74 74, 84 84" />
    <path data-tratto stroke-width="2.6" class="rosso" d="M28 40 L 36 48 L 50 30" />
  </svg>
{:else if nome === 'faccina'}
  <svg class="schizzo {classe}" viewBox="0 0 96 96" aria-hidden="true" use:disegna={{ ritardo, passo: 110, durata: 700 }} {...resto}>
    <path data-tratto stroke-width="2.2" d="M48 10 C 26 10, 12 26, 12 46 C 12 68, 28 84, 50 84 C 72 84, 86 66, 84 44 C 82 24, 66 10, 44 12" />
    <path data-tratto stroke-width="2.6" d="M36 38 L 36 42 M60 38 L 60 42" />
    <path data-tratto stroke-width="2.4" class="rosso" d="M32 56 C 40 66, 56 66, 64 56" />
    <path data-tratto stroke-width="2" d="M30 20 C 36 14, 46 12, 54 14" />
  </svg>
{:else if nome === 'ingranaggio'}
  <svg class="schizzo {classe}" viewBox="0 0 96 96" aria-hidden="true" use:disegna={{ ritardo, passo: 110, durata: 800 }} {...resto}>
    <path data-tratto stroke-width="2.2" d="M44 12 L 52 12 L 54 22 C 58 23, 62 25, 65 27 L 73 21 L 79 27 L 73 35 C 75 38, 77 42, 78 46 L 88 48 L 88 56 L 78 58 C 77 62, 75 66, 73 69 L 79 77 L 73 83 L 65 77 C 62 79, 58 81, 54 82 L 52 92 L 44 92 L 42 82 C 38 81, 34 79, 31 77 L 23 83 L 17 77 L 23 69 C 21 66, 19 62, 18 58 L 8 56 L 8 48 L 18 46 C 19 42, 21 38, 23 35 L 17 27 L 23 21 L 31 27 C 34 25, 38 23, 42 22 Z" />
    <path data-tratto stroke-width="2.4" class="rosso" d="M48 38 C 40 38, 36 44, 38 52 C 40 60, 52 62, 57 55 C 62 48, 58 38, 48 38" />
  </svg>
{:else if nome === 'lucchetto'}
  <svg class="schizzo {classe}" viewBox="0 0 96 96" aria-hidden="true" use:disegna={{ ritardo, passo: 110, durata: 700 }} {...resto}>
    <path data-tratto stroke-width="2.2" d="M22 44 C 40 43, 58 44, 74 43 C 75 58, 74 72, 75 86 C 58 87, 40 86, 21 87 C 20 72, 21 58, 22 44" />
    <path data-tratto stroke-width="2.2" d="M32 44 C 31 30, 36 16, 48 16 C 60 16, 65 28, 64 44" />
    <path data-tratto stroke-width="2.6" class="rosso" d="M48 58 L 48 70" />
  </svg>
{:else if nome === 'persone'}
  <svg class="schizzo {classe}" viewBox="0 0 96 96" aria-hidden="true" use:disegna={{ ritardo, passo: 100, durata: 700 }} {...resto}>
    <path data-tratto stroke-width="2.2" d="M34 18 C 26 18, 22 26, 26 32 C 30 38, 40 36, 41 28 C 42 22, 38 18, 32 19" />
    <path data-tratto stroke-width="2.2" d="M14 64 C 14 50, 22 42, 34 42 C 46 42, 52 50, 52 60" />
    <path data-tratto stroke-width="2.2" d="M64 30 C 56 30, 52 38, 56 44 C 60 50, 70 48, 71 40 C 72 34, 68 30, 62 31" />
    <path data-tratto stroke-width="2.2" d="M46 76 C 46 62, 54 54, 64 54 C 76 54, 82 62, 82 74" />
    <path data-tratto stroke-width="2.4" class="rosso" d="M12 84 C 34 80, 60 82, 86 80" />
  </svg>
{/if}

<style>
  .schizzo { display: block; overflow: visible; }
  .schizzo :global(.inchiostro) { color: var(--testo); }
  .schizzo :global(.rosso) { color: var(--rosso); }
  .schizzo :global(.rosso) :global(path),
  .schizzo :global(path.rosso) { stroke: var(--rosso); }
  .matita-testo { font: 500 15px var(--serif); fill: var(--testo-3); }
</style>
