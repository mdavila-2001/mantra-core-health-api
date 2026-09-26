// H2 · alta del profesional desde el navegador (wizard de 14 páginas) contra el front real
// (real-api) y la API real: título universitario con número y PDF (credentials[].fileId por
// /iam/auth/upload-registration-document), una especialidad, y verificación por API/DB del
// resultado. Deja la cuenta en logs/cuenta-medico-navegador.json para el recorrido del editor.
// Uso (desde verif-front): corepack yarn node ../verif-h1-h2/scripts/h2-alta-medico-navegador.mjs
import { chromium } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'node:fs';
import { execSync } from 'node:child_process';

const BASE = process.env.BASE ?? 'http://localhost:4231';
const API = process.env.API ?? 'http://localhost:3000';
const DIR = process.env.DIR ?? 'C:/Users/DELL/Documents/Github/Alovida/verif-h1-h2';
const OUT = `${DIR}/capturas`;
mkdirSync(OUT, { recursive: true });
const marca = Math.random().toString(16).slice(2, 8);
const lineas = [];
let fallos = 0;
const log = (s) => {
  lineas.push(s);
  console.log(s);
};
const check = (n, ok, d = '') => {
  if (!ok) fallos += 1;
  log(`${ok ? 'PASS' : 'FAIL'} ${n}${d ? ' :: ' + d : ''}`);
};
const psql = (sql) => {
  try {
    return execSync(`docker exec verif-pg psql -U verif -d verif -tAc "${sql.replace(/"/g, '\\"')}"`, { encoding: 'utf8' }).trim();
  } catch (e) {
    return `(psql error: ${String(e.stderr ?? e.message).trim().split('\n')[0]})`;
  }
};
const PDF = {
  name: 'titulo-universitario.pdf',
  mimeType: 'application/pdf',
  buffer: Buffer.from(
    '%PDF-1.4\n1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] >> endobj\ntrailer << /Root 1 0 R >>\n%%EOF\n',
  ),
};

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 }, locale: 'es-BO', reducedMotion: 'reduce' });
const page = await ctx.newPage();
const red = [];
page.on('response', async (r) => {
  const u = r.url();
  if (/\/iam\/auth\/(upload-registration-document|register-practitioner)/.test(u)) {
    let cuerpo = '';
    try {
      cuerpo = (await r.text()).slice(0, 300);
    } catch {}
    red.push(`${r.request().method()} ${r.status()} ${u.replace(BASE, '')} ${cuerpo}`);
  }
});
const encabezado = () => page.locator('.paginated-form__titulo');
// Se compara el texto exacto del título del motor (`.paginated-form__titulo`), no un heading por
// rol: en la última página «Tu contraseña» hay más de un encabezado con ese nombre y el locator
// por rol quedaba en modo estricto, lo que hacía reintentar el clic sobre «Crear cuenta».
const tituloActual = async () => ((await encabezado().textContent().catch(() => '')) ?? '').trim();
async function paso(titulo, rellenar = async () => {}) {
  for (let i = 0; i < 5; i += 1) {
    if ((await tituloActual()) === titulo) return;
    await rellenar();
    const continuar = page.getByTestId('paginated-form-continuar');
    await continuar.waitFor({ timeout: 10_000 });
    await continuar.click();
    const llego = await page
      .waitForFunction((t) => document.querySelector('.paginated-form__titulo')?.textContent?.trim() === t, titulo, { timeout: 6_000 })
      .then(() => true)
      .catch(() => false);
    if (llego) return;
  }
  throw new Error(`No se llegó a «${titulo}» (estoy en «${await tituloActual()}»)`);
}
async function escribirFecha(valor) {
  const fecha = page.getByPlaceholder('DD/MM/AAAA');
  await fecha.evaluate((el, texto) => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(el, texto);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }, valor);
}

const email = `medico-nav-${marca}@example.test`;
const ci = `NAV${marca}`;
const password = 'S3cret-passw0rd';
let registro = null;
try {
  await page.goto(`${BASE}/auth/register/practitioner`, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await page.getByTestId('registro-form-profesional').waitFor({ timeout: 90_000 });
  await page.getByTestId('registro-pro-nombre').waitFor({ timeout: 30_000 });

  await paso('Tu documento de identidad', async () => {
    await page.getByTestId('registro-pro-nombre').fill('Ana');
    await page.getByTestId('registro-pro-apellido-paterno').fill(`Navegador ${marca}`);
  });
  const depto = page.getByTestId('registro-pro-departamento-ci').locator('select');
  await depto.locator('option:not([hidden])').nth(1).waitFor({ state: 'attached', timeout: 30_000 });
  await paso('Contanos un poco sobre vos', async () => {
    await page.getByTestId('registro-pro-documento').fill(ci);
    await depto.selectOption({ index: 1 });
  });
  await paso('Cómo te contactamos en privado', async () => {
    await page.getByTestId('registration-practitioner-sex').locator('select').selectOption({ label: 'Femenino' });
    await escribirFecha('12/05/1985');
  });
  await paso('El contacto de tu trabajo', async () => {
    await page.getByTestId('registro-pro-celular-personal').fill('70012345');
    await page.getByTestId('registro-pro-correo-personal').fill(email);
  });
  await paso('¿Dónde vivís?');
  await paso('¿Dónde trabajás?');
  await paso('Tu consultorio propio');
  await paso('Tu título profesional y foto');
  await page.screenshot({ path: `${OUT}/h2-medico-01-titulo.png`, fullPage: true });
  await paso('Tu habilitación para ejercer', async () => {
    const combo = page.getByTestId('registro-pro-titulo').getByRole('combobox');
    await combo.fill('Médico');
    await page.getByRole('option', { name: 'Médico / Médica', exact: true }).click({ timeout: 15_000 });
  });
  await paso('Los respaldos de tu habilitación', async () => {
    await page.getByTestId('registro-pro-matricula').fill(`MP-${marca}`);
    await page.getByTestId('registro-pro-credencial').fill('T.I. 538/14');
  });
  await paso('Tus títulos');
  // título universitario con número y PDF → credentials[].fileId
  await page.getByTestId('registro-pro-agregar-UNIVERSITARIO').click();
  const fila = page.getByTestId('registro-pro-fila-UNIVERSITARIO').first();
  await fila.waitFor({ timeout: 15_000 });
  await fila.locator('[data-testid^="registro-pro-titulo-numero-"]').first().fill(`UNIV-${marca}`);
  await fila.locator('input[type="file"]').first().setInputFiles(PDF);
  await page.screenshot({ path: `${OUT}/h2-medico-02-titulos.png`, fullPage: true });
  await paso('Tus especialidades');
  await page.getByTestId('registro-pro-agregar-especialidad').click();
  const esp = page.getByTestId('registro-pro-especialidad-extra-0').locator('select');
  await esp.locator('option:not([hidden])').nth(1).waitFor({ state: 'attached', timeout: 30_000 });
  await esp.selectOption({ index: 1 });
  await paso('Tu contraseña');
  await page.getByTestId('registro-pro-password').fill(password);
  await page.screenshot({ path: `${OUT}/h2-medico-03-contrasena.png`, fullPage: true });
  const respuesta = page.waitForResponse((r) => r.url().includes('/iam/auth/register-practitioner'), { timeout: 120_000 });
  await page.getByTestId('paginated-form-continuar').click();
  const r = await respuesta;
  registro = await r.json().catch(() => ({}));
  check('POST /iam/auth/register-practitioner desde el navegador -> 201', r.status() === 201, `status=${r.status()} ${JSON.stringify(registro).slice(0, 260)}`);
  check('el PDF del título subió por /iam/auth/upload-registration-document (201)', red.some((l) => l.startsWith('POST 201 /iam/auth/upload-registration-document')));
  const exito = await page.getByTestId('registro-exito').waitFor({ timeout: 30_000 }).then(() => true).catch(() => false);
  check('pantalla de éxito (registro-exito)', exito);
  await page.screenshot({ path: `${OUT}/h2-medico-04-exito.png`, fullPage: true });

  // verificación por API y base
  const login = await fetch(`${API}/iam/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password }) });
  check('la médica recién registrada inicia sesión por API', login.status === 200, `status=${login.status}`);
  const token = (await login.json()).accessToken;
  const summary = await fetch(`${API}/profiles/practitioners/me/summary`, { headers: { authorization: `Bearer ${token}` } });
  const s = await summary.json();
  check('GET /profiles/practitioners/me/summary -> 200 con la matrícula y la especialidad cargadas', summary.status === 200 && (s.licenses?.length ?? 0) >= 1 && (s.specialties?.length ?? 0) >= 1, `licenses=${s.licenses?.length} specialties=${s.specialties?.length} credentials=${s.credentials?.length ?? 'n/a'}`);
  const credenciales = psql(`select count(*) || '|' || count(file_id) from profiles.professional_credentials where practitioner_profile_id='${registro.practitionerProfileId}'`);
  check('la credencial universitaria quedó con file_id en profiles.professional_credentials', /^1\|1$/.test(credenciales), `count|con_file=${credenciales}`);
  log(`     SELECT profiles.jurisdiction_authorizations -> ${psql(`select license_number from profiles.jurisdiction_authorizations where practitioner_profile_id='${registro.practitionerProfileId}'`)}`);
} catch (e) {
  fallos += 1;
  log(`FAIL excepción: ${e.message}`);
  await page.screenshot({ path: `${OUT}/h2-medico-excepcion.png`, fullPage: true }).catch(() => {});
}
log('== red ==');
for (const l of red) log(l);
log(`== RESUMEN == ${lineas.filter((l) => l.startsWith('PASS')).length} PASS, ${fallos} FAIL`);
writeFileSync(`${DIR}/logs/h2-alta-medico-navegador.txt`, lineas.join('\n') + '\n');
writeFileSync(`${DIR}/logs/cuenta-medico-navegador.json`, JSON.stringify({ email, ci, password, ...(registro ?? {}) }, null, 2));
await browser.close();
process.exit(fallos ? 1 : 0);
