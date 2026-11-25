// Genera public/anteprima.jpg e public/cogestione/anteprima.jpg dal modello HTML (serve Playwright).
//   node docs/anteprima-social/genera.mjs
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';

const modello = new URL('./modello.html', import.meta.url).href;
const radice = fileURLToPath(new URL('../../public/', import.meta.url));
mkdirSync(radice + 'cogestione', { recursive: true });

const browser = await chromium.launch();
const pagina = await browser.newPage({ viewport: { width: 1200, height: 630 } });
for (const [nome, file] of [['sito', 'anteprima.jpg'], ['cogestione', 'cogestione/anteprima.jpg']]) {
  await pagina.goto(`${modello}?pagina=${nome}`, { waitUntil: 'networkidle' });
  await pagina.evaluate(() => document.fonts.ready);
  await pagina.screenshot({ path: radice + file, type: 'jpeg', quality: 86 });
}
await browser.close();
