// H1 · acción de emergencia en el navegador con una médica CLINICAL_APPROVER real (no SUPERADMIN):
// la médica abre la historia de B (vínculo revocado → 403), pide el acceso de emergencia desde la
// pantalla, la historia se abre; B lo ve como emergencia en «Quién ve mi historia» y lo revoca.
// Requiere la API con el arreglo del PDP por EMERGENCY. Uso (desde verif-front): corepack yarn node <este archivo>
import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHmac } from 'node:crypto';

const BASE = process.env.BASE ?? 'http://localhost:4231';
const API = process.env.API ?? 'http://localhost:3000';
const DIR = process.env.DIR ?? 'C:/Users/DELL/Documents/Github/Alovida/verif-h1-h2';
const OUT = `${DIR}/capturas`;
mkdirSync(OUT, { recursive: true });
const cuentas = JSON.parse(readFileSync(`${DIR}/logs/cuentas.json`, 'utf8'));
const { B, medica } = cuentas;

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
function base32Decode(s) {
  const alfabeto = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  for (const ch of s.replace(/=+$/, '').toUpperCase()) {
    const v = alfabeto.indexOf(ch);
    if (v >= 0) bits += v.toString(2).padStart(5, '0');
  }
  const out = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) out.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(out);
}
function totp(secret, t = Date.now()) {
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(Math.floor(t / 1000 / 30)));
  const h = createHmac('sha1', base32Decode(secret)).update(msg).digest();
  const off = h[h.length - 1] & 0xf;
  const codigo = ((h[off] & 0x7f) << 24) | (h[off + 1] << 16) | (h[off + 2] << 8) | h[off + 3];
  return String(codigo % 1_000_000).padStart(6, '0');
}

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 }, locale: 'es-BO', reducedMotion: 'reduce' });
const page = await ctx.newPage();
const red = [];
page.on('response', async (r) => {
  const u = r.url();
  if (/break-the-glass|\/clinical\/patients\/|\/charts\/patients\/|\/authz\/me|clinical-access-grants/.test(u)) {
    let cuerpo = '';
    try {
      cuerpo = (await r.text()).slice(0, 160);
    } catch {}
    red.push(`${r.request().method()} ${r.status()} ${u.replace(BASE, '')} res=${cuerpo}`);
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
async function ingresar(identificador, password, mfaSecret) {
  await page.goto(`${BASE}/auth`, { waitUntil: 'commit' });
  await page.getByTestId('login-form').waitFor({ timeout: 60_000 });
  await listo();
  await escribir('login-identifier', identificador);
  await escribir('login-password', password);
  let respuesta = page.waitForResponse((r) => r.url().includes('/iam/auth/login'), { timeout: 60_000 });
  await page.getByTestId('login-submit').click();
  let r = await respuesta;
  if (r.status() === 401 && mfaSecret) {
    await page.getByTestId('login-mfa-code').waitFor({ timeout: 15_000 });
    await escribir('login-mfa-code', totp(mfaSecret));
    respuesta = page.waitForResponse((r2) => r2.url().includes('/iam/auth/login'), { timeout: 60_000 });
    await page.getByTestId('login-submit').click();
    r = await respuesta;
  }
  await page.waitForURL((u) => !u.pathname.startsWith('/auth'), { timeout: 30_000 }).catch(() => {});
  return r.status();
}
async function salir() {
  await page.getByTestId('header-cerrar-sesion').first().click({ timeout: 15_000 }).catch(() => {});
  await page.waitForTimeout(800);
  await ctx.clearCookies();
}

let grantId = null;
try {
  // Estado de partida reproducible: si quedó una emergencia ACTIVA de una corrida anterior, B la
  // revoca por API antes de empezar (si no, la médica ya entraría con 200 y no habría 403 que mostrar).
  {
    const lb = await fetch(`${API}/iam/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ nationalId: B.nationalId, password: B.password }) });
    const tb = (await lb.json()).accessToken;
    const acc = await (await fetch(`${API}/authz/me/access`, { headers: { authorization: `Bearer ${tb}` } })).json();
    for (const g of acc.grants ?? []) {
      if (g.isEmergency && g.state === 'ACTIVE') {
        const rv = await fetch(`${API}/authz/me/clinical-access-grants/${g.id}/revoke`, { method: 'POST', headers: { authorization: `Bearer ${tb}` } });
        log(`     prólogo: B revoca la emergencia previa ${g.id} -> ${rv.status}`);
      }
    }
  }
  // --- la médica (CLINICAL_APPROVER) abre la historia de B: 403 → botón de emergencia ------
  check('login de la médica por UI (con TOTP)', (await ingresar(medica.email, medica.password, medica.mfaSecret)) === 200);
  const lectura403 = page.waitForResponse((r) => /\/(clinical|charts)\/patients\//.test(r.url()) && r.status() === 403, { timeout: 60_000 });
  await page.goto(`${BASE}/medical-records/${B.pid}`, { waitUntil: 'commit' });
  const r403 = await lectura403;
  check('el expediente de B responde 403 a la médica revocada', r403.status() === 403, `${r403.request().method()} ${r403.url().replace(BASE, '')}`);
  await page.getByTestId('expediente-emergencia').waitFor({ timeout: 30_000 });
  check('la pantalla ofrece «Acceso de emergencia» (rol CLINICAL_APPROVER)', await page.getByTestId('expediente-acceso-emergencia').isVisible());
  await page.screenshot({ path: `${OUT}/h1-emergencia-01-403-con-boton.png`, fullPage: true });

  await page.getByTestId('expediente-acceso-emergencia').click();
  const justificacion = page.getByRole('dialog').getByLabel(/Justificaci/i);
  await justificacion.waitFor({ timeout: 15_000 });
  await justificacion.fill('Paciente inconsciente en urgencias, sin acompañante (recorrido de navegador H1)');
  await page.screenshot({ path: `${OUT}/h1-emergencia-02-dialogo.png`, fullPage: true });
  const btg = page.waitForResponse((r) => r.url().includes('/break-the-glass'), { timeout: 60_000 });
  const relectura = page.waitForResponse((r) => /\/(clinical|charts)\/patients\//.test(r.url()) && r.status() === 200, { timeout: 60_000 });
  await page.getByRole('dialog').getByRole('button', { name: 'Pedir acceso' }).click();
  const rb = await btg;
  const cuerpoBtg = await rb.json().catch(() => ({}));
  grantId = cuerpoBtg.id ?? null;
  check('POST /authz/patients/:pid/break-the-glass desde la pantalla -> 201', rb.status() === 201, `status=${rb.status()} ${JSON.stringify(cuerpoBtg).slice(0, 160)}`);
  const rl = await relectura;
  check('la historia se relee y ahora responde 200 (acceso de emergencia vigente)', rl.status() === 200, `${rl.request().method()} ${rl.url().replace(BASE, '')}`);
  const sinAlerta = await page.getByTestId('expediente-emergencia').waitFor({ state: 'hidden', timeout: 30_000 }).then(() => true).catch(() => false);
  check('la alerta de emergencia desaparece y el expediente se muestra', sinAlerta);
  await page.screenshot({ path: `${OUT}/h1-emergencia-03-expediente-abierto.png`, fullPage: true });
  await salir();

  // --- B lo ve como emergencia y lo revoca --------------------------------------------------
  check('login de B por UI', (await ingresar(B.nationalId, B.password)) === 200);
  await page.goto(`${BASE}/my-account/clinical-access`, { waitUntil: 'commit' });
  await page.getByTestId('acceso-relaciones').waitFor({ timeout: 60_000 });
  // los accesos concedidos viven en una segunda pestaña
  await page.getByRole('tab', { name: /Accesos concedidos/ }).click();
  await page.getByTestId('acceso-accesos').waitFor({ timeout: 30_000 });
  const fila = page.getByTestId(`acceso-${grantId}`);
  const filaVisible = await fila.waitFor({ timeout: 15_000 }).then(() => true).catch(() => false);
  const textoFila = ((await fila.textContent().catch(() => '')) ?? '').replace(/\s+/g, ' ');
  check('B ve el acceso de la médica marcado como emergencia', filaVisible && /emergen/i.test(textoFila), textoFila.slice(0, 160));
  check('aparece el aviso de emergencia de la pantalla', await page.getByTestId('acceso-aviso-emergencia').isVisible().catch(() => false));
  await page.screenshot({ path: `${OUT}/h1-emergencia-04-quien-ve-mi-historia.png`, fullPage: true });
  const rev = page.waitForResponse((r) => r.url().includes(`/authz/me/clinical-access-grants/${grantId}/revoke`), { timeout: 30_000 });
  await page.getByTestId(`acceso-revocar-${grantId}`).click();
  const confirmar = page.getByTestId('dialogo-confirmar');
  if (await confirmar.waitFor({ timeout: 5_000 }).then(() => true).catch(() => false)) await confirmar.click();
  const rr = await rev;
  await page.waitForTimeout(1200);
  // tras revocar, la pantalla recarga y vuelve a la primera pestaña: se reabre «Accesos concedidos»
  const pestana = page.getByRole('tab', { name: /Accesos concedidos/ });
  if (await pestana.isVisible().catch(() => false)) await pestana.click();
  await fila.waitFor({ timeout: 15_000 }).catch(() => {});
  const textoTras = ((await fila.textContent().catch(() => '')) ?? '').replace(/\s+/g, ' ');
  check('B revoca la emergencia desde la pantalla -> 200 y la fila figura revocada', rr.status() === 200 && /revocad/i.test(textoTras), `status=${rr.status()} fila=${textoTras.slice(0, 140)}`);
  await page.screenshot({ path: `${OUT}/h1-emergencia-05-revocada.png`, fullPage: true });

  // la médica vuelve al 403 (API)
  const loginMed = await fetch(`${API}/iam/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: medica.email, password: medica.password, mfaCode: totp(medica.mfaSecret) }) });
  const tokenMed = (await loginMed.json()).accessToken;
  const lectura = await fetch(`${API}/clinical/patients/${B.pid}/summary`, { headers: { authorization: `Bearer ${tokenMed}`, 'x-tenant-id': cuentas.seedTenant } });
  check('revocada la emergencia, la médica vuelve al 403', lectura.status === 403, `status=${lectura.status}`);
} catch (e) {
  fallos += 1;
  log(`FAIL excepción: ${e.message}`);
  await page.screenshot({ path: `${OUT}/h1-emergencia-excepcion.png`, fullPage: true }).catch(() => {});
}
log('== red ==');
for (const l of red) log(l);
log(`== RESUMEN == ${lineas.filter((l) => l.startsWith('PASS')).length} PASS, ${fallos} FAIL`);
writeFileSync(`${DIR}/logs/h1-navegador-emergencia.txt`, lineas.join('\n') + '\n');
await browser.close();
process.exit(fallos ? 1 : 0);
