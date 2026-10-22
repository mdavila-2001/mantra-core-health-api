#!/usr/bin/env node
/**
 * fixture-directorio-territorial.mjs — Aseguradoras públicas con ubicación, para
 * el E2E del filtro territorial del directorio (subtarea 2.3, bloqueo B-23).
 *
 * ## Qué crea, y por qué eso
 *
 * Tres aseguradoras verificadas con dirección de organización:
 *
 *   E2E 2.3 · Aseguradora Cochabamba   → Cochabamba   (departamento Cochabamba)
 *   E2E 2.3 · Aseguradora Quillacollo  → Quillacollo  (departamento Cochabamba)
 *   E2E 2.3 · Aseguradora La Paz       → La Paz       (departamento La Paz)
 *
 * Dos municipios de un mismo departamento hacen falta para que el directorio
 * dibuje los chips de municipio (con uno solo no acotan nada y no se dibujan);
 * el tercero, en otro departamento, es el que demuestra que cambiar de
 * departamento cambia el conjunto.
 *
 * Aseguradoras y no laboratorios: la ficha pública de un laboratorio se proyecta
 * con `targetId = diagnostic_unit.id`, y `common.addresses` no admite ese dueño
 * (`OwnerType` = USER · PATIENT · TENANT · CONDITION · PROCEDURE), así que su
 * `city` pública es siempre `null`. La de una aseguradora se proyecta con
 * `targetId = tenant.id`, y una dirección `TENANT` sí la ubica.
 *
 * ## Por el camino de dominio, no por SQL
 *
 * La misma secuencia que `tools/alovida/seed-vitrina-publica.mjs` usa para sus
 * organizaciones:
 *
 *   POST /iam/auth/login                      el administrador de arranque
 *   POST /admin/tenants                       alta PAYER con su bloque `payer`
 *   POST /common/addresses                    dirección de la organización
 *   POST /admin/tenants/:id/verification      la verificación proyecta la ficha pública
 *
 * No hay una segunda implementación de la publicación: la hace la API.
 *
 * ## Dónde puede correr
 *
 * Sólo contra una API local y una base local. Aborta sin escribir nada si:
 * falta `--allow-local-fixture`; la API no está en localhost; `DB_HOST` no es
 * local; `DB_NAME` tiene pinta de productiva; o `NODE_ENV=production`.
 * No corre al arrancar la API: sólo si alguien lo invoca.
 *
 * ## Idempotente
 *
 * Cada aseguradora se reencuentra por su código (`E2E23_*`). Si ya existe no se
 * vuelve a crear; la dirección sólo se agrega si la ficha pública todavía no
 * muestra la ciudad; y una aseguradora cuya ficha ya es pública no se vuelve a
 * verificar: la verificación exige un tenant PENDING y rechaza uno ya
 * verificado, así que repetirla nunca es idempotente.
 *
 * Uso (desde la raíz del repo de la API):
 *
 *   node --env-file=.env tools/e2e/fixture-directorio-territorial.mjs \
 *     --allow-local-fixture --base-url http://localhost:3000
 *
 * Termina leyendo `GET /public/search/insurers` sin sesión y sale con código 1
 * si alguna de las tres no aparece con su ciudad.
 */

import { claims, crearCliente } from './entorno.mjs';

const argumento = (nombre) => {
  const i = process.argv.indexOf(`--${nombre}`);
  return i === -1 ? undefined : process.argv[i + 1];
};
const bandera = (nombre) => process.argv.includes(`--${nombre}`);

/* ── Guardas: sólo local ──────────────────────────────────────────────────── */

const HOSTS_LOCALES = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);
const NOMBRES_PROHIBIDOS = ['prod', 'produccion', 'production', 'live'];

const BASE = argumento('base-url') ?? process.env.FIXTURE_API_BASE_URL ?? 'http://localhost:3000';

const problemas = [];
if (!bandera('allow-local-fixture')) {
  problemas.push('falta --allow-local-fixture: este fixture escribe datos y hay que pedirlo explícitamente');
}
let hostApi = '';
try {
  hostApi = new URL(BASE).hostname;
} catch {
  problemas.push(`--base-url inválida: ${BASE}`);
}
if (hostApi !== '' && !HOSTS_LOCALES.has(hostApi)) {
  problemas.push(`la API tiene que ser local y es ${hostApi}`);
}
if (!HOSTS_LOCALES.has(process.env.DB_HOST ?? '')) {
  problemas.push(`DB_HOST tiene que ser local y es "${process.env.DB_HOST ?? '(ausente)'}" (¿faltó --env-file?)`);
}
const nombreBase = (process.env.DB_NAME ?? '').toLowerCase();
if (nombreBase === '') {
  problemas.push('DB_NAME es obligatorio');
} else if (NOMBRES_PROHIBIDOS.some((p) => nombreBase.includes(p))) {
  problemas.push(`DB_NAME="${process.env.DB_NAME}" tiene pinta de base productiva`);
}
if ((process.env.NODE_ENV ?? '').toLowerCase() === 'production') {
  problemas.push('NODE_ENV=production');
}
if (!process.env.BOOTSTRAP_ADMIN_EMAIL || !process.env.BOOTSTRAP_ADMIN_PASSWORD) {
  problemas.push('faltan BOOTSTRAP_ADMIN_EMAIL / BOOTSTRAP_ADMIN_PASSWORD');
}
if (problemas.length > 0) {
  console.error('\n  El fixture del directorio territorial se niega a correr:\n');
  for (const p of problemas) console.error(`    · ${p}`);
  console.error('');
  process.exit(2);
}

/* ── El fixture ──────────────────────────────────────────────────────────── */

const PREFIJO_NOMBRE = 'E2E 2.3 · ';

/**
 * Las ciudades son nombres de municipio del catálogo `VS_BO_MUNICIPALITY`: es
 * lo que el directorio compara para ubicar una ficha. Los datos regulatorios
 * son etiquetas de fixture, visibles como tales, no identificadores reales.
 */
const ASEGURADORAS = [
  { codigo: 'E2E23_ASEG_COCHABAMBA', sigla: 'E2E23CBB', ciudad: 'Cochabamba', calle: 'Av. Heroínas 100 (fixture E2E)' },
  { codigo: 'E2E23_ASEG_QUILLACOLLO', sigla: 'E2E23QLL', ciudad: 'Quillacollo', calle: 'Av. Blanco Galindo km 13 (fixture E2E)' },
  { codigo: 'E2E23_ASEG_LAPAZ', sigla: 'E2E23LPZ', ciudad: 'La Paz', calle: 'Av. 16 de Julio 1500 (fixture E2E)' },
].map((a) => ({ ...a, nombre: `${PREFIJO_NOMBRE}Aseguradora ${a.ciudad}` }));

const api = crearCliente(BASE);

async function fichasPublicas() {
  const r = await api.llamar('fichas públicas de aseguradoras', 'GET', '/public/search/insurers?limit=50', {
    espera: [200],
  });
  return (r.body?.items ?? []).filter((f) => typeof f.displayName === 'string' && f.displayName.startsWith(PREFIJO_NOMBRE));
}

async function main() {
  console.log(`\n  Fixture del directorio territorial contra ${BASE} (DB ${process.env.DB_HOST}/${process.env.DB_NAME})\n`);

  const login = await api.llamar('login del administrador', 'POST', '/iam/auth/login', {
    body: { email: process.env.BOOTSTRAP_ADMIN_EMAIL, password: process.env.BOOTSTRAP_ADMIN_PASSWORD },
    espera: [200, 201],
  });
  const token = login.body?.accessToken;
  if (!token) {
    console.error('\n  No hubo token de administrador: se corta antes de escribir nada.\n');
    process.exit(1);
  }
  const adminUserId = claims(token).sub;

  const antes = await fichasPublicas();
  const resumen = [];

  for (const a of ASEGURADORAS) {
    const busqueda = await api.llamar(`buscar ${a.codigo}`, 'GET', `/admin/tenants?q=${encodeURIComponent(a.codigo)}&limit=10`, {
      token,
      espera: [200],
    });
    let tenantId = (busqueda.body?.items ?? []).find((t) => t.code === a.codigo)?.id;
    let creada = false;

    if (!tenantId) {
      const alta = await api.llamar(`alta de ${a.nombre}`, 'POST', '/admin/tenants', {
        token,
        body: {
          code: a.codigo,
          legalName: a.nombre,
          tradeName: a.nombre,
          ownerUserId: adminUserId,
          tenantType: 'PAYER',
          payer: {
            carrierCode: a.codigo,
            sigla: a.sigla,
            address: `${a.calle}, ${a.ciudad}`,
            regulatorIdentifier: `E2E-FIXTURE-${a.sigla}`,
          },
        },
        espera: [201],
      });
      tenantId = alta.body?.id;
      creada = Boolean(tenantId);
      if (!tenantId) {
        resumen.push({ ...a, tenantId: null, creada: false, error: 'el alta no devolvió id' });
        continue;
      }
    }

    const yaUbicada = antes.some((f) => f.displayName === a.nombre && f.city === a.ciudad);
    if (!yaUbicada) {
      await api.llamar(`dirección de ${a.nombre}`, 'POST', '/common/addresses', {
        token,
        body: { ownerType: 'TENANT', ownerId: tenantId, lines: [a.calle], city: a.ciudad },
        espera: [201],
      });
    }

    // Sólo se verifica lo que todavía no es público (ver la cabecera).
    const yaPublica = antes.some((f) => f.displayName === a.nombre);
    const verificacion = yaPublica
      ? { status: 'ya publicada' }
      : await api.llamar(`verificación de ${a.nombre}`, 'POST', `/admin/tenants/${tenantId}/verification`, {
          token,
          body: {},
          espera: [200, 201],
        });

    resumen.push({
      codigo: a.codigo,
      nombre: a.nombre,
      ciudad: a.ciudad,
      tenantId,
      creada,
      direccionAgregada: !yaUbicada,
      verificacion: verificacion.status,
    });
  }

  const despues = await fichasPublicas();
  const faltan = ASEGURADORAS.filter((a) => !despues.some((f) => f.displayName === a.nombre && f.city === a.ciudad));

  console.log('\n  Dataset:\n');
  console.log(JSON.stringify({ fixture: resumen, fichasPublicas: despues.map((f) => ({ displayName: f.displayName, city: f.city, slug: f.slug })) }, null, 2));

  if (faltan.length > 0 || api.fallos.length > 0) {
    console.error('\n  El fixture no quedó completo:');
    for (const a of faltan) console.error(`    · falta la ficha pública de ${a.nombre} con ciudad ${a.ciudad}`);
    for (const f of api.fallos) console.error(`    · ${f}`);
    process.exit(1);
  }
  console.log('\n  ✓ Tres aseguradoras públicas, cada una con su ciudad del catálogo.\n');
}

main().catch((error) => {
  console.error('\n  El fixture falló:', error);
  process.exit(1);
});
