#!/usr/bin/env node
/**
 * seed-e2e.mjs — Los actores E2E del carril P4, creados por el camino real.
 *
 * ## Qué siembra, y qué no
 *
 * **Siembra hoy:** `doctor.one` y `doctor.two` —dos profesionales con login
 * real y vitrina pública publicada con slug estable— más `doctor.oculto`, una
 * vitrina creada y **deliberadamente no publicada** que existe para que la
 * prueba negativa tenga contra qué correr: sin un perfil que exista y no sea
 * público, «un slug despublicado da el mismo 404 que uno inexistente» no se
 * puede demostrar, sólo afirmar.
 *
 * **No siembra:** pacientes, citas, encuentros, recetas, conversaciones,
 * publicaciones ni reseñas. Son las precondiciones de P1, P2, P3, P5 y P6, y
 * este archivo es del carril P4. El catálogo de actores del paquete
 * (`seeds/SEED-CATALOG-PABLO.yaml`) las declara; el hueco está marcado abajo
 * para que quien tome esos carriles lo llene sin rehacer esto.
 *
 * ## Por qué pasa por la API y no por SQL
 *
 * Porque un `INSERT` en `iam.users` produce una fila, no una identidad. El
 * contrato de seeds lo dice sin rodeos: un usuario que no puede iniciar sesión
 * es un seed roto. Acá cada doctora nace por el alta asistida real
 * —`POST /iam/users/assisted-practitioner-registration`—, elige su contraseña
 * activando un token de un solo uso, y **entra por el login real** antes de
 * que el script la dé por buena. La vitrina se publica con la sesión de la
 * propia titular, que es quien puede hacerlo.
 *
 * Uso:
 *   node tools/e2e/seed-e2e.mjs
 *
 * Exige `.env.e2e` con `APP_ENV=e2e`, `ALLOW_E2E_SEED=true` y una `DB_NAME` que
 * contenga `e2e` o `test`. Ver `tools/e2e/entorno.mjs`.
 */

import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  claims,
  crearCliente,
  exigirAmbienteE2E,
  leerEnvE2E,
  RAIZ_REPO,
} from './entorno.mjs';

const env = exigirAmbienteE2E(leerEnvE2E());
const BASE = env.E2E_API_BASE_URL ?? 'http://localhost:3001';
const api = crearCliente(BASE);

/**
 * Los profesionales del catálogo.
 *
 * `slug` es parte del contrato de las pruebas, no un detalle: `/p/doctor-uno-e2e`
 * aparece literal en el criterio de aceptación del carril y en los journeys, así
 * que se fija acá y no se deriva del nombre.
 */
const PROFESIONALES = [
  {
    clave: 'doctor.one',
    email: env.E2E_DOCTOR_1_EMAIL,
    password: env.E2E_DOCTOR_1_PASSWORD,
    displayName: 'Dra. Marisol Quispe Ticona',
    titulo: 'Cardióloga',
    headline: 'Cardióloga · Hospital del Norte',
    biografia:
      'Cardióloga con veinte años de práctica clínica. Atiende consulta general de cardiología, control de hipertensión y seguimiento post-quirúrgico.',
    slug: 'doctor-uno-e2e',
    publicar: true,
  },
  {
    clave: 'doctor.two',
    email: env.E2E_DOCTOR_2_EMAIL,
    password: env.E2E_DOCTOR_2_PASSWORD,
    displayName: 'Dr. Iván Mamani Colque',
    titulo: 'Pediatra',
    headline: 'Pediatra · Centro de Salud Sur',
    biografia: 'Pediatra dedicado a control de crecimiento y desarrollo infantil.',
    slug: 'doctor-dos-e2e',
    publicar: true,
  },
  {
    /**
     * El perfil que existe y **no** está publicado.
     *
     * Sin él, la prueba de que un slug despublicado devuelve el mismo 404 que
     * uno inexistente no tendría un despublicado real contra el que correr, y
     * pasaría comprobando dos veces lo mismo.
     */
    clave: 'doctor.hidden',
    email: 'doctor.oculto.e2e@local.test',
    password: env.E2E_DOCTOR_2_PASSWORD,
    displayName: 'Dra. Ana Rojas Pinto',
    titulo: 'Dermatóloga',
    headline: 'Dermatóloga',
    biografia: 'Vitrina creada y no publicada: existe, pero no está en el directorio.',
    slug: 'doctor-oculto-e2e',
    publicar: false,
  },
];

/** Marca de la corrida, para los identificadores que exigen ser únicos. */
const CORRIDA = new Date().toISOString().replace(/\D/g, '').slice(0, 14);

async function main() {
  console.log(`\n  Sembrando el entorno E2E contra ${BASE}`);
  console.log(`  Base: ${env.DB_NAME}\n`);

  // ── 1 · El administrador de arranque ──────────────────────────────────────

  const loginAdmin = await api.llamar(
    'Sesión del administrador de arranque',
    'POST',
    '/iam/auth/login',
    {
      body: {
        email: env.E2E_BOOTSTRAP_ADMIN_EMAIL,
        password: env.E2E_BOOTSTRAP_ADMIN_PASSWORD,
      },
    },
  );
  const tokenAdmin = loginAdmin.body?.accessToken;
  if (!tokenAdmin) {
    console.error(
      '\n  Sin sesión de administrador no hay nada que sembrar.\n' +
        '  Comprobá que la API E2E arrancó con BOOTSTRAP_ADMIN_EMAIL/PASSWORD\n' +
        '  iguales a los E2E_BOOTSTRAP_ADMIN_* del .env.e2e.\n',
    );
    process.exit(1);
  }

  const tenantId = claims(tokenAdmin).tenants?.[0];
  if (!tenantId) {
    console.error('\n  El token del administrador no trae ningún tenant.\n');
    process.exit(1);
  }
  console.log(`  Tenant de arranque: ${tenantId}\n`);

  // ── 2 · Los profesionales, por el alta real ───────────────────────────────

  const manifiesto = { version: '2026-08-17-pablo-v1', tenantId, actors: {} };

  for (const p of PROFESIONALES) {
    console.log(`  — ${p.clave} (${p.email})`);

    const alta = await api.llamar(
      `Alta asistida de ${p.displayName}`,
      'POST',
      '/iam/users/assisted-practitioner-registration',
      {
        token: tokenAdmin,
        body: {
          email: p.email,
          displayName: p.displayName,
          licenseNumber: `LIC-E2E-${p.clave}-${CORRIDA}`,
          credentialNumber: `CRED-E2E-${p.clave}-${CORRIDA}`,
          professionalTitle: p.titulo,
          reason: 'Actor del catálogo E2E de Pablo (carril P4)',
          clinicalRoles: ['CLINICIAN', 'PRACTITIONER'],
        },
        // 409 = ya existía de una corrida anterior. El sembrador es idempotente
        // por clave natural —el correo—, así que reutiliza en vez de fallar.
        espera: [201, 409],
      },
    );

    if (alta.status === 201) {
      await api.llamar(
        `Activación de ${p.clave} (elige su contraseña)`,
        'POST',
        '/iam/auth/activate',
        {
          body: { activationToken: alta.body.activationToken, newPassword: p.password },
          espera: [200, 201, 204],
        },
      );
    }

    // El login real es lo que convierte una fila en una identidad. No se
    // presume del alta: se comprueba.
    const login = await api.llamar(`Login real de ${p.clave}`, 'POST', '/iam/auth/login', {
      body: { email: p.email, password: p.password },
      espera: [200, 201],
    });
    const tokenDoctor = login.body?.accessToken;
    if (!tokenDoctor) {
      console.log(`         ${p.clave} no pudo iniciar sesión: se omite su vitrina\n`);
      continue;
    }

    const c = claims(tokenDoctor);
    const tenantDelDoctor = c.tenants?.[0] ?? tenantId;

    // La vitrina la publica **la titular**, con su propia sesión. Es el camino
    // real: `visibility` sólo lo puede declarar quien es dueño del perfil.
    const vitrina = await api.llamar(
      `Vitrina de ${p.clave} (${p.publicar ? 'publicada' : 'sin publicar'})`,
      'PUT',
      '/community/profiles/me',
      {
        token: tokenDoctor,
        body: {
          tenantId: tenantDelDoctor,
          slug: p.slug,
          displayName: p.displayName,
          headline: p.headline,
          biography: p.biografia,
          acceptsReviews: true,
          // El perfil oculto **no manda el campo**: así se prueba también que
          // omitirlo no publica nada, que es la regla del opt-in.
          ...(p.publicar ? { visibility: 'PUBLIC' } : {}),
        },
        espera: [200, 201],
      },
    );

    manifiesto.actors[p.clave] = {
      email: p.email,
      slug: p.slug,
      practitionerProfileId: c.hpid ?? null,
      publicProfileId: vitrina.body?.id ?? null,
      visibility: vitrina.body?.visibility ?? null,
      published: p.publicar,
    };
    console.log('');
  }

  // ── 3 · Pendiente de otros carriles ───────────────────────────────────────
  //
  // Pacientes, citas COMPLETED con encuentro cerrado, recetas, seguimientos,
  // publicaciones y reseñas. P4 no los necesita y este archivo no los inventa:
  // sembrar una cita sin el flujo que la produce es exactamente lo que el
  // contrato de seeds prohíbe.

  // ── 4 · El manifiesto ─────────────────────────────────────────────────────

  const ruta = resolve(RAIZ_REPO, 'seed-manifest.json');
  writeFileSync(ruta, `${JSON.stringify(manifiesto, null, 2)}\n`);
  console.log(`  Manifiesto escrito en ${ruta}`);
  console.log('  (sin contraseñas ni tokens: los tests leen las claves lógicas)\n');

  // ── 5 · Resumen ───────────────────────────────────────────────────────────

  console.log(`  Llamadas correctas: ${api.exitos}`);
  if (api.fallos.length > 0) {
    console.log(`  Fallos: ${api.fallos.length}`);
    for (const f of api.fallos) console.log(`    · ${f}`);
    console.log('');
    process.exit(1);
  }
  console.log('  Siembra completa.\n');
}

await main();
