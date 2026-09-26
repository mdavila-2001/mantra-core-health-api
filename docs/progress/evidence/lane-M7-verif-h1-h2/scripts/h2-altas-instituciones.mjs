// H2 · alta de laboratorio (UNIPERSONAL) y de centro de imagenología (SRL) desde el navegador,
// contra el front real (ng serve --configuration real-api) y la API real (node dist/src/main.js).
// Uso (desde verif-front): OUT=<dir capturas> BASE=http://localhost:4231 corepack yarn node <este archivo>
import { chromium } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'node:fs';

const BASE = process.env.BASE ?? 'http://localhost:4231';
const OUT = process.env.OUT ?? 'C:/Users/DELL/Documents/Github/Alovida/verif-h1-h2/capturas';
const LOG = process.env.LOG ?? 'C:/Users/DELL/Documents/Github/Alovida/verif-h1-h2/logs/h2-altas-instituciones.txt';
mkdirSync(OUT, { recursive: true });
const marca = Math.random().toString(16).slice(2, 8);
const lineas = [];
let fallos = 0;
const log = (s) => {
  lineas.push(s);
  console.log(s);
};
const check = (nombre, ok, detalle = '') => {
  if (!ok) fallos += 1;
  log(`${ok ? 'PASS' : 'FAIL'} ${nombre} ${detalle}`.trim());
};

const PDF = (nombre) => ({
  name: nombre,
  mimeType: 'application/pdf',
  buffer: Buffer.from(
    '%PDF-1.4\n1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] >> endobj\ntrailer << /Root 1 0 R >>\n%%EOF\n',
  ),
});

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 }, locale: 'es-BO', reducedMotion: 'reduce' });
const page = await ctx.newPage();
const consola = [];
page.on('pageerror', (e) => consola.push(`pageerror: ${e}`));
page.on('console', (m) => {
  if (m.type() === 'error' && !/Content Security Policy|inline script/.test(m.text())) consola.push(`consola: ${m.text()}`);
});
const red = [];
page.on('response', async (r) => {
  const u = r.url();
  if (/\/iam\/auth\/(upload-registration-document|register-organization|login)|\/system-context\/dynamic-enums/.test(u)) {
    let cuerpo = '';
    try {
      cuerpo = (await r.text()).slice(0, 400);
    } catch {}
    red.push(`${r.request().method()} ${r.status()} ${u.replace(BASE, '')} ${cuerpo}`);
  }
});

const encabezado = () => page.locator('.paginated-form__titulo');
async function continuarHasta(titulo, rellenar = async () => {}) {
  const objetivo = page.getByRole('heading', { name: titulo });
  for (let i = 0; i < 5; i += 1) {
    await rellenar();
    await page.getByTestId('paginated-form-continuar').click();
    if (await objetivo.waitFor({ timeout: 5_000 }).then(() => true).catch(() => false)) return;
  }
  throw new Error(`No se llegó a «${titulo}» (estoy en «${await encabezado().textContent()}»)`);
}
async function siguiente() {
  const antes = (await encabezado().textContent())?.trim();
  for (let i = 0; i < 5; i += 1) {
    await page.getByTestId('paginated-form-continuar').click();
    const cambio = await page
      .waitForFunction((a) => document.querySelector('.paginated-form__titulo')?.textContent?.trim() !== a, antes, { timeout: 5_000 })
      .then(() => true)
      .catch(() => false);
    if (cambio) return (await encabezado().textContent())?.trim();
  }
  throw new Error(`No se pasó de «${antes}»`);
}

async function alta({ ruta, p, etiqueta, tipoSociedad, modalidades, conConstitucion, nombreCaptura }) {
  const correo = `${p}-${marca}@example.test`;
  const password = 'S3cret-passw0rd';
  await page.goto(`${BASE}${ruta}`, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await page.getByTestId(`${p}-razon-social`).waitFor({ timeout: 90_000 });
  const tipo = page.getByTestId(`${p}-tipo-sociedad`).locator('select');
  await tipo.locator('option:not([hidden])').nth(1).waitFor({ state: 'attached', timeout: 20_000 });
  const rellenarEmpresa = async () => {
    await page.getByTestId(`${p}-razon-social`).fill(`${etiqueta} ${marca}`);
    await tipo.selectOption({ label: tipoSociedad });
    await page.getByTestId(`${p}-nit`).fill('1023456789');
  };
  if (modalidades) {
    await continuarHasta('Qué estudios hacés', rellenarEmpresa);
    await continuarHasta('Los papeles de la empresa', async () => {
      const grupo = page.getByTestId(`${p}-modalidades`);
      for (const m of modalidades) {
        const casilla = grupo.getByLabel(m);
        if (!(await casilla.isChecked())) await grupo.locator('app-checkbox', { hasText: m }).locator('label').first().click();
      }
    });
  } else {
    await continuarHasta('Los papeles de la empresa', rellenarEmpresa);
  }
  await page.screenshot({ path: `${OUT}/${nombreCaptura}-01-papeles.png`, fullPage: true });
  for (const clave of ['seprecFile', 'licenciaFile', 'sedesFile', 'nitFile']) {
    await page.getByTestId(`${p}-adjunto-${clave}`).setInputFiles(PDF(`${clave}.pdf`));
  }
  await continuarHasta(/^Constitución/);
  if (conConstitucion) {
    await page.getByTestId(`${p}-adjunto-constitucionFile`).setInputFiles(PDF('constitucion.pdf'));
    await page.getByTestId(`${p}-adjunto-poderFile`).setInputFiles(PDF('poder.pdf'));
  }
  await page.screenshot({ path: `${OUT}/${nombreCaptura}-02-constitucion.png`, fullPage: true });
  await continuarHasta('Dónde está la central');
  await continuarHasta('Tus sucursales', async () => {
    await page.getByTestId(`${p}-direccion`).fill('Calle Warnes #350');
  });
  await continuarHasta('Representante legal');
  await page.getByTestId(`${p}-representante`).fill(`Representante ${marca}`);
  await page.getByTestId(`${p}-representante-documento`).fill(`${marca}77`);
  await page.getByTestId(`${p}-representante-correo`).fill(correo);
  // gerencias (3 páginas opcionales) hasta «Tu acceso»
  let titulo = await siguiente();
  const recorridas = [titulo];
  for (let i = 0; i < 5 && !/acceso/i.test(titulo ?? ''); i += 1) {
    titulo = await siguiente();
    recorridas.push(titulo);
  }
  log(`     páginas tras el representante: ${recorridas.join(' → ')}`);
  check(`${etiqueta}: se llega a «Tu acceso»`, /acceso/i.test(titulo ?? ''), `último=${titulo}`);
  await page.getByTestId(`${p}-password`).fill(password);
  await page.screenshot({ path: `${OUT}/${nombreCaptura}-03-acceso.png`, fullPage: true });
  const respuesta = page.waitForResponse((r) => r.url().includes('/iam/auth/register-organization'), { timeout: 120_000 });
  await page.getByTestId('paginated-form-continuar').click();
  const r = await respuesta;
  let cuerpo = {};
  try {
    cuerpo = await r.json();
  } catch {}
  check(`${etiqueta}: POST /iam/auth/register-organization`, r.status() === 201, `status=${r.status()} ${JSON.stringify(cuerpo).slice(0, 300)}`);
  const exito = await page
    .getByTestId(`${p}-exito`)
    .waitFor({ timeout: 30_000 })
    .then(() => true)
    .catch(() => false);
  check(`${etiqueta}: pantalla de éxito (${p}-exito)`, exito);
  await page.screenshot({ path: `${OUT}/${nombreCaptura}-04-exito.png`, fullPage: true });
  return { correo, password, cuerpo };
}

let lab = null;
let img = null;
try {
  lab = await alta({
    ruta: '/auth/register/laboratory',
    p: 'registro-lab',
    etiqueta: 'Laboratorio Unipersonal',
    tipoSociedad: 'Unipersonal',
    conConstitucion: false,
    nombreCaptura: 'h2-lab',
  });
  img = await alta({
    ruta: '/auth/register/imaging-center',
    p: 'registro-imagen',
    etiqueta: 'Imagenología SRL',
    tipoSociedad: 'S.R.L.',
    modalidades: ['Rayos X', 'Ecografía'],
    conConstitucion: true,
    nombreCaptura: 'h2-imagen',
  });
} catch (e) {
  fallos += 1;
  log(`FAIL excepción: ${e.message}`);
  await page.screenshot({ path: `${OUT}/h2-altas-excepcion.png`, fullPage: true }).catch(() => {});
}

log('== red ==');
for (const l of red) log(l);
log(`== consola (${consola.length}) ==`);
for (const l of consola.slice(0, 10)) log(l);
log(`== RESUMEN == fallos=${fallos}`);
writeFileSync(LOG, lineas.join('\n') + '\n');
writeFileSync(LOG.replace(/\.txt$/, '.json'), JSON.stringify({ lab, img }, null, 2));
await browser.close();
process.exit(fallos ? 1 : 0);
