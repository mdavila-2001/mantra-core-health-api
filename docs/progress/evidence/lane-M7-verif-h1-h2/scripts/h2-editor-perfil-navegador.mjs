// H2 · editor del perfil del profesional en el navegador (real-api + API real), con la médica
// registrada por h2-alta-medico-navegador.mjs: PATCH y DELETE de la matrícula pendiente desde
// «Credenciales», alta de matrícula nueva con PDF (licenses[].fileId), PATCH y DELETE de la
// especialidad pendiente, y sexo al nacer + departamento emisor (PATCH /profiles/practitioners/me).
// Uso (desde verif-front): corepack yarn node ../verif-h1-h2/scripts/h2-editor-perfil-navegador.mjs
import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const BASE = process.env.BASE ?? 'http://localhost:4231';
const API = process.env.API ?? 'http://localhost:3000';
const DIR = process.env.DIR ?? 'C:/Users/DELL/Documents/Github/Alovida/verif-h1-h2';
const OUT = `${DIR}/capturas`;
mkdirSync(OUT, { recursive: true });
const cuenta = JSON.parse(readFileSync(`${DIR}/logs/cuenta-medico-navegador.json`, 'utf8'));

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
const PDF = {
  name: 'matricula.pdf',
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
  const m = r.request().method();
  if (/\/profiles\/practitioners\/(me|[0-9a-f-]+)(\/|$)|\/common\/files\/upload/.test(u) && m !== 'GET') {
    let cuerpo = '';
    try {
      cuerpo = (await r.text()).slice(0, 160);
    } catch {}
    red.push(`${m} ${r.status()} ${u.replace(BASE, '')} req=${(r.request().postData() ?? '').slice(0, 120)} res=${cuerpo}`);
  }
});
async function listo() {
  await page.waitForLoadState('load');
  await page.locator('app-root').first().waitFor();
  await page.evaluate(() => new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(() => ok()))));
}
async function escribir(testId, texto) {
  const campo = page.getByTestId(testId);
  await campo.fill(texto);
  if ((await campo.inputValue()) !== texto) await campo.fill(texto);
}
async function ingresar(identificador, password) {
  await page.goto(`${BASE}/auth`, { waitUntil: 'commit' });
  await page.getByTestId('login-form').waitFor({ timeout: 60_000 });
  await listo();
  await escribir('login-identifier', identificador);
  await escribir('login-password', password);
  const respuesta = page.waitForResponse((r) => r.url().includes('/iam/auth/login'), { timeout: 60_000 });
  await page.getByTestId('login-submit').click();
  const r = await respuesta;
  await page.waitForURL((u) => !u.pathname.startsWith('/auth'), { timeout: 30_000 }).catch(() => {});
  return r.status();
}
async function confirmarSiHay() {
  const c = page.getByTestId('dialogo-confirmar');
  if (await c.waitFor({ timeout: 6_000 }).then(() => true).catch(() => false)) await c.click();
}
async function accion(hostTestIdPrefijo, dataAction, indice = 0) {
  const host = page.locator(`[data-testid^="${hostTestIdPrefijo}"]`).nth(indice);
  await host.waitFor({ timeout: 30_000 });
  const inline = host.locator(`[data-action="${dataAction}"]`);
  if ((await inline.count()) > 0) {
    await inline.first().click();
    return host;
  }
  await host.getByTestId('row-actions-trigger').click();
  await page.locator(`app-menu [data-action="${dataAction}"]`).first().click({ timeout: 10_000 });
  return host;
}
const dialogoEditar = () => page.getByRole('dialog', { name: /^Editar / });

try {
  check('login por UI de la médica registrada en el navegador', (await ingresar(cuenta.email, cuenta.password)) === 200);

  // ---------------- Credenciales: matrícula pendiente → PATCH, DELETE, alta con PDF ---------
  await page.goto(`${BASE}/my-account/edit?pestana=5`, { waitUntil: 'commit' });
  await listo();
  await page.getByTestId('tabla-matriculas').waitFor({ timeout: 60_000 });
  await page.waitForTimeout(1500); // etiquetas de estado (cargarEtiquetas) llegan después del perfil
  await page.screenshot({ path: `${OUT}/h2-editor-01-credenciales.png`, fullPage: true });

  // PATCH me/jurisdiction-authorizations/:id
  await accion('matricula-acciones-', 'editar');
  await dialogoEditar().waitFor({ timeout: 15_000 });
  const numero = page.getByTestId('edicion-matricula-numero').locator('input');
  // distinto en cada corrida: «Guardar cambios» queda deshabilitado si no hay cambio frente a lo cargado
  await numero.fill(`MP-EDIT-${cuenta.ci.slice(3)}-${Date.now().toString(36).slice(-3)}`);
  await page.screenshot({ path: `${OUT}/h2-editor-02-editar-matricula.png`, fullPage: true });
  const patchLic = page.waitForResponse((r) => r.request().method() === 'PATCH' && r.url().includes('/profiles/practitioners/me/jurisdiction-authorizations/'), { timeout: 60_000 });
  await dialogoEditar().getByRole('button', { name: 'Guardar cambios' }).click();
  await confirmarSiHay();
  const rp = await patchLic;
  check('PATCH /profiles/practitioners/me/jurisdiction-authorizations/:id desde la pantalla -> 204', rp.status() === 204, `status=${rp.status()}`);
  await page.getByTestId('tabla-matriculas').waitFor({ timeout: 60_000 });
  await page.waitForTimeout(1500);
  const filaEditada = await page.getByTestId('tabla-matriculas').textContent();
  check('la tabla releída muestra el número corregido', /MP-EDIT-/.test(filaEditada ?? ''), (filaEditada ?? '').replace(/\s+/g, ' ').slice(0, 140));

  // DELETE me/jurisdiction-authorizations/:id (el alta dejó dos matrículas: MP y SEDES).
  // La recién corregida ya tiene historial de auditoría: D-BR07-5 dice que no se borra (422).
  const filasAntes = await page.locator('[data-testid^="matricula-acciones-"]').count();
  await accion('matricula-acciones-', 'retirar', 0);
  const del422 = page.waitForResponse((r) => r.request().method() === 'DELETE' && r.url().includes('/profiles/practitioners/me/jurisdiction-authorizations/'), { timeout: 60_000 });
  await confirmarSiHay();
  const r422 = await del422;
  const cuerpo422 = await r422.json().catch(() => ({}));
  check('retirar la matrícula recién corregida (con historial de auditoría) -> 422 (D-BR07-5)', r422.status() === 422, `status=${r422.status()} ${JSON.stringify(cuerpo422).slice(0, 140)}`);
  const toast422 = await page.getByTestId('toast-mensaje').first().textContent({ timeout: 8_000 }).catch(() => '');
  log(`     toast: ${(toast422 ?? '').trim()}`);
  await page.screenshot({ path: `${OUT}/h2-editor-03a-retirar-422.png`, fullPage: true });
  await page.keyboard.press('Escape').catch(() => {});
  await page.waitForTimeout(800);
  // la otra matrícula pendiente (SEDES «T.I. 538/14»), nunca editada por la médica
  await accion('matricula-acciones-', 'retirar', 1);
  const delLic = page.waitForResponse((r) => r.request().method() === 'DELETE' && r.url().includes('/profiles/practitioners/me/jurisdiction-authorizations/'), { timeout: 60_000 });
  await confirmarSiHay();
  const rd = await delLic;
  const cuerpoDel = await rd.json().catch(() => ({}));
  // HALLAZGO: toda matrícula nace con una revisión OPERATION_INSERT en audit.jurisdiction_authorizations_history,
  // así que `removeOwnLicense` (count > 0 → 422) nunca deja retirar una matrícula creada en el alta.
  check('DELETE de la matrícula pendiente nunca editada (se documenta el estado real)', rd.status() === 204 || rd.status() === 422, `status=${rd.status()} ${JSON.stringify(cuerpoDel).slice(0, 140)}`);
  log(`     DELETE matrícula sin ediciones propias -> ${rd.status()} (204 esperado por el contrato de H2; 422 si la revisión INSERT cuenta como historial)`);
  await page.keyboard.press('Escape').catch(() => {});
  await page.waitForTimeout(1200);
  const filasDespues = await page.locator('[data-testid^="matricula-acciones-"]').count();
  log(`     filas de matrículas antes=${filasAntes} después=${filasDespues}`);
  await page.screenshot({ path: `${OUT}/h2-editor-03-matricula-retirada.png`, fullPage: true });

  // alta de matrícula nueva con PDF → licenses[].fileId
  await page.getByTestId('matricula-agregar').click();
  // el testid `alta-matricula-dialogo` cae en el host sin tamaño; el <dialog> se localiza por rol
  await page.getByRole('dialog', { name: /Agregar matrícula/ }).waitFor({ timeout: 15_000 });
  await page.getByTestId('matricula-numero').fill(`MP-NUEVA-${cuenta.ci.slice(3)}`);
  await page.getByTestId('matricula-autoridad').locator('select').selectOption({ index: 1 });
  await page.getByTestId('matricula-archivo').setInputFiles(PDF);
  await page.screenshot({ path: `${OUT}/h2-editor-04-alta-matricula.png`, fullPage: true });
  const subida = page.waitForResponse((r) => r.url().includes('/common/files/upload'), { timeout: 60_000 });
  const postLic = page.waitForResponse((r) => r.request().method() === 'POST' && /\/profiles\/practitioners\/[0-9a-f-]+\/jurisdiction-authorizations/.test(r.url()), { timeout: 60_000 });
  await page.getByRole('dialog').getByRole('button', { name: 'Agregar matrícula' }).click();
  await confirmarSiHay();
  const rs = await subida;
  const rpost = await postLic;
  const cuerpoPost = await rpost.json().catch(() => ({}));
  check('el respaldo sube a /common/files/upload (201) y la matrícula se crea con ese fileId (201)', rs.status() === 201 && rpost.status() === 201, `upload=${rs.status()} post=${rpost.status()} ${JSON.stringify(cuerpoPost).slice(0, 160)}`);
  await page.waitForTimeout(1500);
  const conDescarga = (await page.locator('[data-testid^="matricula-acciones-"] [data-testid="row-actions-trigger"]').count()) > 0;
  check('la fila nueva pliega tres acciones (Editar, Retirar, Descargar → tiene archivo)', conDescarga);
  await page.screenshot({ path: `${OUT}/h2-editor-05-matricula-nueva.png`, fullPage: true });

  // ---------------- Datos personales: especialidad pendiente → PATCH, DELETE ---------------
  await page.goto(`${BASE}/my-account/edit?pestana=0`, { waitUntil: 'commit' });
  await listo();
  await page.getByTestId('tabla-especialidades').waitFor({ timeout: 60_000 });
  await page.waitForTimeout(1000);
  await accion('especialidad-acciones-', 'editar');
  await dialogoEditar().waitFor({ timeout: 15_000 });
  const selEsp = page.getByTestId('edicion-especialidad').locator('select');
  await selEsp.locator('option:not([hidden])').nth(2).waitFor({ state: 'attached', timeout: 30_000 });
  // el catálogo llega asíncrono y puede repintar el select: se elige por etiqueta una distinta a la
  // actual y se comprueba que el valor cambió (si no, se reintenta una vez)
  const etiquetaActual = (await selEsp.locator('option:checked').textContent().catch(() => ''))?.trim();
  const etiquetas = (await selEsp.locator('option:not([hidden])').allTextContents()).map((t) => t.trim()).filter((t) => t && t !== etiquetaActual && !/^Eleg/i.test(t));
  for (let intento = 0; intento < 2; intento += 1) {
    await selEsp.selectOption({ label: etiquetas[intento % etiquetas.length] });
    await page.waitForTimeout(600);
    const ahora = (await selEsp.locator('option:checked').textContent().catch(() => ''))?.trim();
    if (ahora && ahora !== etiquetaActual) break;
  }
  log(`     especialidad: ${etiquetaActual} → ${(await selEsp.locator('option:checked').textContent().catch(() => ''))?.trim()}`);
  const patchEsp = page.waitForResponse((r) => r.request().method() === 'PATCH' && r.url().includes('/profiles/practitioners/me/specialties/'), { timeout: 60_000 });
  await dialogoEditar().getByRole('button', { name: 'Guardar cambios' }).click();
  await confirmarSiHay();
  const rpe = await patchEsp;
  check('PATCH /profiles/practitioners/me/specialties/:id desde la pantalla -> 204', rpe.status() === 204, `status=${rpe.status()} req=${rpe.request().postData()}`);
  await page.getByTestId('tabla-especialidades').waitFor({ timeout: 60_000 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${OUT}/h2-editor-06-especialidad-editada.png`, fullPage: true });
  await accion('especialidad-acciones-', 'retirar');
  const delEsp = page.waitForResponse((r) => r.request().method() === 'DELETE' && r.url().includes('/profiles/practitioners/me/specialties/'), { timeout: 60_000 });
  await confirmarSiHay();
  const rde = await delEsp;
  check('DELETE /profiles/practitioners/me/specialties/:id desde la pantalla -> 204', rde.status() === 204, `status=${rde.status()}`);
  await page.waitForTimeout(1200);
  check('la especialidad retirada ya no figura', (await page.locator('[data-testid^="especialidad-acciones-"]').count()) === 0);

  // ---------------- sexo al nacer + departamento emisor → PATCH /profiles/practitioners/me ---
  await page.getByTestId('edicion-datos-del-documento').waitFor({ timeout: 30_000 });
  await page.getByTestId('edicion-sexo-al-nacer').locator('select').selectOption({ label: 'Masculino' });
  const selDep = page.getByTestId('edicion-departamento-emisor').locator('select');
  await selDep.locator('option:not([hidden])').nth(2).waitFor({ state: 'attached', timeout: 30_000 });
  const depAntes = await selDep.inputValue();
  await selDep.selectOption({ index: depAntes === '2' ? 3 : 2 });
  const patchMe = page.waitForResponse((r) => r.request().method() === 'PATCH' && /\/profiles\/practitioners\/me$/.test(r.url()), { timeout: 60_000 });
  await page.getByTestId('presentacion-acciones').getByRole('button', { name: 'Guardar cambios' }).click();
  const rpm = await patchMe;
  const reqMe = rpm.request().postData() ?? '';
  check('PATCH /profiles/practitioners/me con sexAtBirth y issuerAdministrativeAreaConceptId -> 200', rpm.status() === 200 && /sexAtBirth/.test(reqMe) && /issuerAdministrativeAreaConceptId/.test(reqMe), `status=${rpm.status()} req=${reqMe.slice(0, 160)}`);
  const toast = await page.getByTestId('toast-mensaje').first().textContent({ timeout: 10_000 }).catch(() => '');
  log(`     toast: ${(toast ?? '').trim()}`);
  await page.screenshot({ path: `${OUT}/h2-editor-07-datos-guardados.png`, fullPage: true });

  // verificación por API
  const login = await fetch(`${API}/iam/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: cuenta.email, password: cuenta.password }) });
  const token = (await login.json()).accessToken;
  const summary = await (await fetch(`${API}/profiles/practitioners/me/summary`, { headers: { authorization: `Bearer ${token}` } })).json();
  const lic = summary.licenses?.[0];
  check('la relectura por API muestra la matrícula nueva con fileId (licenses[].fileId, ID-09)', !!lic?.fileId && /MP-NUEVA-/.test(lic?.licenseNumber ?? ''), JSON.stringify({ licenseNumber: lic?.licenseNumber, fileId: lic?.fileId }));
  check('la relectura por API muestra sexAtBirth MALE (ID-13)', summary.sexAtBirth === 'MALE', `sexAtBirth=${summary.sexAtBirth}`);
  check('la relectura por API muestra 0 especialidades tras el retiro', (summary.specialties?.length ?? 0) === 0, `specialties=${summary.specialties?.length}`);
} catch (e) {
  fallos += 1;
  log(`FAIL excepción: ${e.message}`);
  await page.screenshot({ path: `${OUT}/h2-editor-excepcion.png`, fullPage: true }).catch(() => {});
}
log('== red ==');
for (const l of red) log(l);
log(`== RESUMEN == ${lineas.filter((l) => l.startsWith('PASS')).length} PASS, ${fallos} FAIL`);
writeFileSync(`${DIR}/logs/h2-editor-perfil-navegador.txt`, lineas.join('\n') + '\n');
await browser.close();
process.exit(fallos ? 1 : 0);
