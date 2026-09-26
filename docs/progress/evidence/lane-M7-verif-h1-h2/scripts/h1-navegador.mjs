// H1 · recorrido de navegador contra el front real (real-api) y la API real en modo cookie:
// login por UI (cookie httpOnly, sin refreshToken en el cuerpo ni en localStorage), F5 con
// refresh sin cuerpo, «Seguridad», «Mi privacidad» (retirar), «Quién ve mi historia» (revocar),
// cerrar sesión en todos lados (cookie borrada → refresh 401), paso MFA en el login, y capturas
// por viewport/tema de las tres pantallas nuevas.
// Uso (desde verif-front): corepack yarn node ../verif-h1-h2/scripts/h1-navegador.mjs
import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHmac } from 'node:crypto';

const BASE = process.env.BASE ?? 'http://localhost:4231';
const API = process.env.API ?? 'http://localhost:3000';
const DIR = process.env.DIR ?? 'C:/Users/DELL/Documents/Github/Alovida/verif-h1-h2';
const OUT = `${DIR}/capturas`;
mkdirSync(OUT, { recursive: true });
const cuentas = JSON.parse(readFileSync(`${DIR}/logs/cuentas.json`, 'utf8'));
const { A, B, medica } = cuentas;

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
const consola = [];
page.on('pageerror', (e) => consola.push(`pageerror: ${e}`));
page.on('console', (m) => {
  if (m.type() === 'error' && !/Content Security Policy|inline script/.test(m.text())) consola.push(`consola: ${m.text()}`);
});
const red = [];
page.on('response', async (r) => {
  const u = r.url();
  if (/\/iam\/auth\/(login|token\/refresh|logout|logout-all)|\/iam\/me\/sessions|\/consent\/me|\/authz\/me|\/iam\/auth\/change-password/.test(u)) {
    let cuerpo = '';
    try {
      cuerpo = (await r.text()).slice(0, 200);
    } catch {}
    const pedido = r.request().postData();
    red.push(`${r.request().method()} ${r.status()} ${u.replace(BASE, '')} req=${pedido ? pedido.slice(0, 120) : '-'} res=${cuerpo}`);
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
  const respuesta = page.waitForResponse((r) => r.url().includes('/iam/auth/login'), { timeout: 60_000 });
  await page.getByTestId('login-submit').click();
  let r = await respuesta;
  if (r.status() === 401 && mfaSecret) {
    const cuerpo = await r.json().catch(() => ({}));
    check('login sin código: 401 MFA_REQUIRED y el formulario pide el código', cuerpo?.details?.reason === 'MFA_REQUIRED', JSON.stringify(cuerpo).slice(0, 200));
    await page.getByTestId('login-mfa-code').waitFor({ timeout: 15_000 });
    await page.screenshot({ path: `${OUT}/h1-mfa-01-pide-codigo.png`, fullPage: true });
    await escribir('login-mfa-code', totp(mfaSecret));
    const respuesta2 = page.waitForResponse((r2) => r2.url().includes('/iam/auth/login'), { timeout: 60_000 });
    await page.getByTestId('login-submit').click();
    r = await respuesta2;
  }
  const cuerpo = await r.json().catch(() => ({}));
  return { status: r.status(), cuerpo };
}
async function cookieRefresh() {
  return (await ctx.cookies()).find((c) => c.name === 'redesa_refresh');
}
async function capturas(nombre) {
  for (const tema of ['light', 'dark']) {
    for (const [etq, vp] of [
      ['escritorio', { width: 1366, height: 900 }],
      ['movil', { width: 390, height: 844 }],
    ]) {
      await page.setViewportSize(vp);
      await page.emulateMedia({ colorScheme: tema });
      await page.waitForTimeout(400);
      await page.screenshot({ path: `${OUT}/${nombre}-${etq}-${tema === 'dark' ? 'oscuro' : 'claro'}.png`, fullPage: true });
    }
  }
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.emulateMedia({ colorScheme: 'light' });
}

try {
  // ---------------- TX-10 · login en modo cookie desde el navegador (paciente A) --------------
  // El sujeto de la credencial de un paciente es su CI (iam-patient-self-registration.service.ts:190-233);
  // el correo no entra por el login. La médica sí entra por correo.
  const ingreso = await ingresar(A.nationalId, A.password);
  check('login por UI de A -> 200', ingreso.status === 200, `status=${ingreso.status}`);
  check('el cuerpo del login NO trae refreshToken (cookie encendida)', ingreso.cuerpo?.refreshToken === '', `refreshToken=${JSON.stringify(ingreso.cuerpo?.refreshToken)}`);
  await page.waitForURL((u) => !u.pathname.startsWith('/auth'), { timeout: 30_000 }).catch(() => {});
  const cookie = await cookieRefresh();
  check(
    'el navegador guardó la cookie redesa_refresh httpOnly, Path acotado, SameSite=Strict',
    !!cookie && cookie.httpOnly && cookie.path === '/iam/auth/token/refresh' && cookie.sameSite === 'Strict',
    JSON.stringify(cookie ? { ...cookie, value: '<masked>' } : null),
  );
  const almacen = await page.evaluate(() => Object.fromEntries(Object.keys(localStorage).map((k) => [k, String(localStorage.getItem(k)).slice(0, 60)])));
  const filtrado = JSON.stringify(almacen);
  check('localStorage no guarda el refresh token', !/refresh/i.test(Object.keys(almacen).join(',')) && !/"refreshToken":"[^"]+"/.test(filtrado), `claves=${Object.keys(almacen).join(',')}`);
  await page.screenshot({ path: `${OUT}/h1-cookie-01-tras-login.png`, fullPage: true });

  // F5: la sesión se restaura con el refresh por cookie, sin cuerpo
  await page.goto(`${BASE}/my-account/security`, { waitUntil: 'commit' });
  const refresco = page.waitForResponse((r) => r.url().includes('/iam/auth/token/refresh'), { timeout: 30_000 });
  await page.reload({ waitUntil: 'commit' });
  const rr = await refresco;
  const postData = rr.request().postData() ?? '';
  check('F5: POST /iam/auth/token/refresh -> 200 con la cookie y sin token en el cuerpo', rr.status() === 200 && !/refreshToken":"[^"]+"/.test(postData), `status=${rr.status()} cuerpo=${postData.slice(0, 80) || '(vacío)'}`);
  const cookie2 = await cookieRefresh();
  check('la cookie rotó tras el refresh', !!cookie2 && cookie2.value !== cookie?.value);
  await page.getByTestId('seguridad-form').waitFor({ timeout: 60_000 });
  check('tras F5 sigue adentro: «Seguridad» se dibuja', true);

  // ---------------- ID-24 / CV-22 · Seguridad ---------------------------------------------
  await page.getByTestId('seguridad-sesiones').waitFor({ timeout: 30_000 });
  const filasSesiones = await page.getByTestId('seguridad-sesiones').locator('tbody tr, li, [role="row"]').count();
  check('«Sesiones abiertas» lista al menos la sesión actual', filasSesiones >= 1, `filas=${filasSesiones}`);
  await capturas('h1-seguridad');
  // contraseña actual incorrecta -> 422 mostrado en pantalla, sin cerrar sesión
  await escribir('seguridad-actual', 'incorrecta-123');
  await escribir('seguridad-nueva', 'Nuev4-passw0rd!');
  await escribir('seguridad-confirmacion', 'Nuev4-passw0rd!');
  const cambio = page.waitForResponse((r) => r.url().includes('/iam/auth/change-password'), { timeout: 30_000 });
  await page.getByTestId('seguridad-guardar').click();
  const rc = await cambio;
  const errorVisible = await page.getByTestId('seguridad-error').waitFor({ timeout: 10_000 }).then(() => true).catch(() => false);
  check('contraseña actual incorrecta -> 422 y el error se muestra sin cerrar la sesión', rc.status() === 422 && errorVisible, `status=${rc.status()}`);
  await page.screenshot({ path: `${OUT}/h1-seguridad-error-contrasena.png`, fullPage: true });

  // ---------------- CL-78 · Mi privacidad: retirar el consentimiento ----------------------
  await page.goto(`${BASE}/my-account/privacy`, { waitUntil: 'commit' });
  await page.getByTestId('privacidad-consentimientos').waitFor({ timeout: 60_000 });
  const retirar = page.locator('[data-testid^="consentimiento-retirar-"]').first();
  await retirar.waitFor({ timeout: 15_000 });
  await capturas('h1-privacidad');
  const idCons = (await retirar.getAttribute('data-testid')).replace('consentimiento-retirar-', '');
  const withdraw = page.waitForResponse((r) => r.url().includes(`/consent/me/consents/${idCons}/withdraw`), { timeout: 30_000 });
  await retirar.click();
  const confirmar = page.getByTestId('dialogo-confirmar');
  if (await confirmar.waitFor({ timeout: 5_000 }).then(() => true).catch(() => false)) await confirmar.click();
  const rw = await withdraw;
  await page.waitForTimeout(800);
  const fila = page.getByTestId(`consentimiento-${idCons}`);
  const textoFila = (await fila.textContent().catch(() => '')) ?? '';
  check('retirar el consentimiento -> 200 y la fila releída figura «Retirado»', rw.status() === 200 && /retirad/i.test(textoFila), `status=${rw.status()} fila=${textoFila.replace(/\s+/g, ' ').slice(0, 120)}`);
  await page.screenshot({ path: `${OUT}/h1-privacidad-tras-retirar.png`, fullPage: true });

  // ---------------- CV-22 · cerrar sesión en todos lados: cookie borrada, refresh 401 ------
  await page.goto(`${BASE}/my-account/security`, { waitUntil: 'commit' });
  await page.getByTestId('seguridad-cerrar-todas').waitFor({ timeout: 60_000 });
  const logoutAll = page.waitForResponse((r) => /\/iam\/auth\/(logout|logout-all)/.test(r.url()), { timeout: 30_000 });
  await page.getByTestId('seguridad-cerrar-todas').click();
  const confirmar2 = page.getByTestId('dialogo-confirmar');
  if (await confirmar2.waitFor({ timeout: 5_000 }).then(() => true).catch(() => false)) await confirmar2.click();
  const rl = await logoutAll;
  await page.waitForTimeout(1000);
  const cookie3 = await cookieRefresh();
  const refresh401 = await page.evaluate(async () => {
    const r = await fetch('/iam/auth/token/refresh', { method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' }, body: '{}' });
    return r.status;
  });
  check('«cerrar sesión en todos lados»: la API responde 200, la cookie desaparece y el refresh da 401', rl.status() === 200 && !cookie3 && refresh401 === 401, `logout=${rl.status()} cookie=${cookie3 ? 'sigue' : 'borrada'} refresh=${refresh401}`);
  const almacen2 = await page.evaluate(() => Object.keys(localStorage));
  check('al cerrar sesión el navegador olvida la sesión (localStorage sin claves de sesión)', !almacen2.some((k) => /session|token|auth/i.test(k)), `claves=${almacen2.join(',') || '(vacío)'}`);
  await page.screenshot({ path: `${OUT}/h1-cookie-02-tras-cerrar-todas.png`, fullPage: true });

  // ---------------- CV-19 · Quién ve mi historia (paciente B revoca a la médica) ------------
  const ingresoB = await ingresar(B.nationalId, B.password);
  check('login por UI de B -> 200', ingresoB.status === 200, `status=${ingresoB.status}`);
  await page.goto(`${BASE}/my-account/clinical-access`, { waitUntil: 'commit' });
  await page.getByTestId('acceso-relaciones').waitFor({ timeout: 60_000 });
  const relacionFila = page.getByTestId(`relacion-${cuentas.relacionB}`);
  const relacionVisible = await relacionFila.waitFor({ timeout: 15_000 }).then(() => true).catch(() => false);
  check('B ve el vínculo con la médica (nombre, desde cuándo, estado)', relacionVisible, (await relacionFila.textContent().catch(() => '')).replace(/\s+/g, ' ').slice(0, 160));
  await capturas('h1-quien-ve-mi-historia');
  const revocar = page.getByTestId(`relacion-revocar-${cuentas.relacionB}`);
  const rev = page.waitForResponse((r) => r.url().includes(`/authz/me/care-relationships/${cuentas.relacionB}/revoke`), { timeout: 30_000 });
  await revocar.click();
  const confirmar3 = page.getByTestId('dialogo-confirmar');
  if (await confirmar3.waitFor({ timeout: 5_000 }).then(() => true).catch(() => false)) await confirmar3.click();
  const rrev = await rev;
  await page.waitForTimeout(800);
  const textoRel = (await relacionFila.textContent().catch(() => '')) ?? '';
  check('revocar el vínculo desde la pantalla -> 200 y la fila figura revocada', rrev.status() === 200 && /revocad/i.test(textoRel), `status=${rrev.status()} fila=${textoRel.replace(/\s+/g, ' ').slice(0, 120)}`);
  await page.screenshot({ path: `${OUT}/h1-quien-ve-mi-historia-tras-revocar.png`, fullPage: true });

  // 403 real de la médica tras la revocación hecha desde la pantalla (API, con su MFA)
  const loginMed = await fetch(`${API}/iam/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: medica.email, password: medica.password, mfaCode: totp(medica.mfaSecret) }) });
  const tokenMed = (await loginMed.json()).accessToken;
  const lectura = await fetch(`${API}/clinical/patients/${B.pid}/summary`, { headers: { authorization: `Bearer ${tokenMed}`, 'x-tenant-id': cuentas.seedTenant } });
  const cuerpoLectura = await lectura.text();
  check('403 REAL: la médica revocada por B desde la pantalla no lee su historia', lectura.status === 403, `status=${lectura.status} ${cuerpoLectura.slice(0, 160)}`);

  // cerrar la sesión de B por el menú
  await page.getByTestId('header-cerrar-sesion').first().click({ timeout: 15_000 }).catch(() => {});
  await page.waitForTimeout(800);

  // ---------------- TX-29 · paso MFA en el navegador (la médica) ---------------------------
  const ingresoMed = await ingresar(medica.email, medica.password, medica.mfaSecret);
  check('login de la médica con el código TOTP desde el formulario -> 200', ingresoMed.status === 200, `status=${ingresoMed.status}`);
  await page.waitForURL((u) => !u.pathname.startsWith('/auth'), { timeout: 30_000 }).catch(() => {});
  await page.screenshot({ path: `${OUT}/h1-mfa-02-adentro.png`, fullPage: true });
} catch (e) {
  fallos += 1;
  log(`FAIL excepción: ${e.message}`);
  await page.screenshot({ path: `${OUT}/h1-navegador-excepcion.png`, fullPage: true }).catch(() => {});
}

log('== red ==');
for (const l of red) log(l);
log(`== consola (${consola.length}) ==`);
for (const l of consola.slice(0, 12)) log(l);
log(`== RESUMEN == ${lineas.filter((l) => l.startsWith('PASS')).length} PASS, ${fallos} FAIL`);
writeFileSync(`${DIR}/logs/h1-navegador.txt`, lineas.join('\n') + '\n');
await browser.close();
process.exit(fallos ? 1 : 0);
