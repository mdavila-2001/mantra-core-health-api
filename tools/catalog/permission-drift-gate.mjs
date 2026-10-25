// Gate de CI de la deriva de permisos: lo que las rutas exigen (`@Roles`) contra lo que existe para
// asignarse. Arranca la aplicación compilada (`dist/`) como contexto, sin `listen()`, lee las rutas
// que Nest registró y las pasa por `computePermissionDrift`, la misma función que sirve la consola
// (`GET /admin/catalog/permission-drift`).
//
// Es un trinquete, no una exigencia de deriva cero: la que hoy existe está en
// `permission-drift-allowlist.json` y no bloquea; lo que se agregue sin figurar ahí, sí. En el otro
// sentido, una excepción que ya no hace falta también falla, para que la lista sólo pueda encogerse.
// La lista distingue las rutas **revisadas** (`reviewed`: un grupo con el motivo por el que no
// necesitan `@Roles` y la evidencia de dónde se autorizan) de las **sin revisar** (`routes`).
//
//   node tools/catalog/permission-drift-gate.mjs            comprueba (exit 1 si hay deriva nueva u obsoleta)
//   node tools/catalog/permission-drift-gate.mjs --write    reescribe la lista con la deriva actual
//
// Requiere `yarn build` previo y la misma base que `generate-openapi.mjs` (MikroORM valida la
// conexión al arrancar el módulo raíz). No consulta `authz.roles`: lo sembrado sale del código.
import 'reflect-metadata';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { NestFactory } from '@nestjs/core';

process.env.ORM_SCHEMA_SYNC = 'off';
process.env.RATE_LIMIT_DISABLED = 'true';

const ALLOWLIST = join(
  dirname(fileURLToPath(import.meta.url)),
  'permission-drift-allowlist.json',
);
const escribir = process.argv.includes('--write');

const dist = (ruta) => import(`../../dist/src/${ruta}`);

async function main() {
  const { AppModule } = await dist('app.module.js');
  const { RouteMetadataService } = await dist(
    'observability/route-index/route-metadata.service.js',
  );
  const { SYSTEM_ROLE_SEED } = await dist(
    'common/seed/authz-clinical-roles-seed.service.js',
  );
  const { PLATFORM_ROLE_CODES } = await dist(
    'modules/data_catalog/services/permission-drift.service.js',
  );
  const {
    blockingDrift,
    computePermissionDrift,
    invalidAllowlist,
    routeKey,
    staleAllowlist,
  } = await dist('modules/data_catalog/permission-drift/permission-drift.js');

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error'],
  });
  const informe = computePermissionDrift({
    routes: app
      .get(RouteMetadataService)
      .all()
      .map((r) => ({
        method: r.method,
        template: r.template,
        controller: r.controller,
        handler: r.handler,
        roles: r.roles,
        isPublic: r.isPublic,
      })),
    seededRoleCodes: SYSTEM_ROLE_SEED.map((rol) => rol.code),
    platformRoleCodes: PLATFORM_ROLE_CODES,
    databaseRoleCodes: null,
  });
  await app.close();

  const actual = new Set(informe.routesWithoutRoles.map(routeKey));
  if (escribir) {
    // Los grupos revisados conservan su motivo y su evidencia: `--write` sólo les quita las rutas
    // que dejaron de derivar. Lo que deriva y no está revisado queda en `routes`.
    const previa = existsSync(ALLOWLIST)
      ? JSON.parse(readFileSync(ALLOWLIST, 'utf8'))
      : {};
    const reviewed = (previa.reviewed ?? [])
      .map((grupo) => ({
        ...grupo,
        routes: grupo.routes.filter((ruta) => actual.has(ruta)),
      }))
      .filter((grupo) => grupo.routes.length > 0);
    const revisadas = new Set(reviewed.flatMap((grupo) => grupo.routes));
    const lista = {
      roles: informe.usedNotSeeded.map((u) => u.role).sort(),
      routes: [...actual].filter((ruta) => !revisadas.has(ruta)).sort(),
      reviewed,
    };
    writeFileSync(ALLOWLIST, `${JSON.stringify(lista, null, 2)}\n`);
    console.log(
      `Lista reescrita: ${lista.roles.length} rol(es) sin sembrar, ${revisadas.size} ruta(s) revisadas, ${lista.routes.length} ruta(s) sin revisar.`,
    );
    return 0;
  }

  const permitido = JSON.parse(readFileSync(ALLOWLIST, 'utf8'));
  const problemas = [
    ...invalidAllowlist(permitido),
    ...blockingDrift(informe, permitido),
    ...staleAllowlist(informe, permitido),
  ];
  const revisadas = (permitido.reviewed ?? []).flatMap((g) => g.routes).length;
  console.log(
    `Rutas: ${informe.routes.total} (${informe.routes.public} públicas, ${informe.routes.withRoles} con @Roles, ${informe.routes.withoutRoles} sin @Roles: ${revisadas} revisadas con motivo, ${(permitido.routes ?? []).length} sin revisar).`,
  );
  if (problemas.length === 0) {
    console.log('✓ permission-drift-gate: sin deriva de permisos nueva.');
    return 0;
  }
  console.error(`\n✗ permission-drift-gate: ${problemas.length} problema(s)\n`);
  for (const p of problemas) console.error(`  - ${p}`);
  console.error(
    '\n  Una ruta autenticada declara `@Roles(...)` o es `@Public()`; un rol que una ruta exige se siembra\n  en el `*.roles.ts` de su módulo. Si la deriva es deliberada y de hoy, `--write` reescribe la lista.\n',
  );
  return 1;
}

main().then(
  (codigo) => process.exit(codigo),
  (error) => {
    console.error('Fallo en permission-drift-gate:', error);
    process.exit(2);
  },
);
