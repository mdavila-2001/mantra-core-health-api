// Genera el contrato OpenAPI real desde la aplicación NestJS compilada
// (`dist/app.module.js`), no desde una plantilla escrita a mano: el documento
// resultante refleja exactamente los decoradores `@Api*` presentes en los 191
// controllers y 364 DTOs reales del código, en el commit compilado.
//
// Arranca la app como contexto (sin `listen()`), con `ORM_SCHEMA_SYNC=off` y
// `RATE_LIMIT_DISABLED=true` (mismo patrón que `yarn test:integration`) para
// no mutar el esquema de la base local ni activar limitación de tasa durante
// la generación. Requiere `yarn build` previo y los contenedores de
// infraestructura local (`docker-compose.yml`) arriba, porque MikroORM valida
// la conexión al arrancar el módulo raíz.
import 'reflect-metadata';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { dump } from 'js-yaml';

process.env.ORM_SCHEMA_SYNC = 'off';
process.env.RATE_LIMIT_DISABLED = 'true';

const OUT_DIR = join(process.cwd(), 'openapi');
mkdirSync(OUT_DIR, { recursive: true });

/**
 * Garantiza operationId únicos y estables. El default de @nestjs/swagger
 * (`${controllerKey}_${methodKey}`) colisiona para un subconjunto de
 * controllers donde `instance.constructor.name` llega vacío al explorador de
 * Swagger (quirk de @nestjs/swagger 11.x sin causa raíz identificada en esta
 * fase — ver `docs/reports/openapi-generation-notes.md`); el resultado son
 * operationId iguales al nombre de método pelado (`create`, `verify`, ...)
 * repetidos entre módulos no relacionados. Se resuelve determinísticamente
 * por método+ruta, sin depender de arreglar el explorador interno.
 */
function dedupeOperationIds(document) {
  const seen = new Map(); // operationId -> [{path, method}]
  for (const [path, methods] of Object.entries(document.paths)) {
    for (const [method, op] of Object.entries(methods)) {
      if (!op.operationId) continue;
      const list = seen.get(op.operationId) ?? [];
      list.push({ path, method });
      seen.set(op.operationId, list);
    }
  }

  const slug = (path, method) =>
    `${method}_${path
      .replace(/^\//, '')
      .replace(/[{}]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '_')
      .replace(/_+$/, '')}`;

  let renamed = 0;
  for (const [operationId, occurrences] of seen) {
    if (occurrences.length < 2) continue;
    for (const { path, method } of occurrences) {
      document.paths[path][method].operationId = `${operationId}__${slug(path, method)}`;
      renamed++;
    }
  }
  return renamed;
}

/**
 * Redocly exige `security` explícito (poblado o `[]`) en cada operación para
 * distinguir "público a propósito" de "olvidaron documentarlo". Nest no tiene
 * un decorador Swagger dedicado para "sin auth"; estas 9 rutas están
 * verificadas contra el decorador real `@Public()` en el código fuente (que sí
 * salta el guard JWT en runtime) — ver `docs/reports/openapi-generation-notes.md`
 * para la lista con archivo/línea. Si se añade un nuevo endpoint público, hay
 * que sumarlo aquí o el lint de Redocly (`security-defined`) volverá a fallar.
 */
const KNOWN_PUBLIC_OPERATIONS = [
  ['get', '/health'],
  ['post', '/iam/auth/activate'],
  ['post', '/iam/auth/login'],
  ['post', '/iam/auth/token/refresh'],
  ['post', '/webhooks/providers/{providerCode}/receipts'],
  ['post', '/integrations/webhooks/inbound'],
  ['get', '/r/{code}'],
  ['get', '/public/directory'],
  ['get', '/public/{slug}'],
];

function markPublicOperations(document) {
  let marked = 0;
  for (const [method, path] of KNOWN_PUBLIC_OPERATIONS) {
    const op = document.paths[path]?.[method];
    if (!op) {
      console.warn(`Aviso: ruta pública esperada no encontrada: ${method.toUpperCase()} ${path}`);
      continue;
    }
    op.security = [];
    marked++;
  }
  return marked;
}

/**
 * `SwaggerModule.createDocument` no rellena el `tags` global del documento a
 * partir de los `@ApiTags` de cada controller — sin esto, Redocly
 * (`operation-tag-defined`) marca error en las 841 operaciones. Se deriva
 * determinísticamente de las etiquetas realmente usadas, ordenadas
 * alfabéticamente (no hay agrupación temática oficial que priorizar).
 */
function populateGlobalTags(document) {
  const used = new Set();
  for (const methods of Object.values(document.paths)) {
    for (const op of Object.values(methods)) {
      for (const tag of op.tags ?? []) used.add(tag);
    }
  }
  document.tags = [...used].sort().map((name) => ({ name }));
  return document.tags.length;
}

async function main() {
  const { AppModule } = await import('../../dist/app.module.js');

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn'],
  });

  const pkg = await import('../../package.json', { with: { type: 'json' } });

  const config = new DocumentBuilder()
    .setTitle('REDESA Health API')
    .setDescription(
      'API del ecosistema de salud REDESA (Mantra Core Technologies). ' +
        'Contrato generado automáticamente desde los decoradores `@nestjs/swagger` ' +
        'reales de los controllers y DTO del backend — no es un documento mantenido a mano. ' +
        'Regenerar con `yarn docs:openapi:generate` tras cualquier cambio de contrato.',
    )
    .setVersion(pkg.default.version ?? '0.0.1')
    .addServer('http://localhost:3000', 'Desarrollo local')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description:
          'Token de acceso JWT emitido por `POST /auth/login` (`TokenService`). ' +
          'Los endpoints marcados `@Public()` no lo requieren.',
      },
      'bearer',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  const dupCount = dedupeOperationIds(document);
  if (dupCount > 0) {
    console.log(
      `Nota: ${dupCount} operationId colisionaban bajo el default de ` +
        '@nestjs/swagger (controllerKey vacío para ciertos controllers — ' +
        'quirk conocido, ver docs/reports/openapi-generation-notes.md) y se ' +
        'desambiguaron determinísticamente por método+ruta.',
    );
  }
  const publicCount = markPublicOperations(document);
  const tagCount = populateGlobalTags(document);
  console.log(`  ${publicCount}/${KNOWN_PUBLIC_OPERATIONS.length} rutas públicas marcadas, ${tagCount} tags globales.`);

  writeFileSync(
    join(OUT_DIR, 'openapi.json'),
    JSON.stringify(document, null, 2) + '\n',
    'utf-8',
  );
  writeFileSync(
    join(OUT_DIR, 'openapi.yaml'),
    dump(document, { lineWidth: 120, noRefs: true }),
    'utf-8',
  );

  const pathCount = Object.keys(document.paths).length;
  const opCount = Object.values(document.paths).reduce(
    (acc, methods) => acc + Object.keys(methods).length,
    0,
  );
  const schemaCount = Object.keys(document.components?.schemas ?? {}).length;
  console.log(
    `OpenAPI generado: ${pathCount} paths, ${opCount} operaciones, ${schemaCount} esquemas.`,
  );
  console.log(`  → ${join(OUT_DIR, 'openapi.json')}`);
  console.log(`  → ${join(OUT_DIR, 'openapi.yaml')}`);

  await app.close();
  process.exit(0);
}

main().catch((err) => {
  console.error('Fallo generando OpenAPI:', err);
  process.exit(1);
});
