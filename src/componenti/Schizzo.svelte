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
{/if}

<style>
  .schizzo { display: block; overflow: visible; }
  .schizzo :global(.inchiostro) { color: var(--testo); }
  .schizzo :global(.rosso) { color: var(--rosso); }
  .schizzo :global(.rosso) :global(path),
  .schizzo :global(path.rosso) { stroke: var(--rosso); }
  .matita-testo { font: 500 15px var(--serif); fill: var(--testo-3); }
</style>
