// Genera el contrato OpenAPI real desde la aplicación NestJS compilada
// (`dist/src/app.module.js`), no desde una plantilla escrita a mano: el documento
// resultante refleja exactamente los decoradores `@Api*` presentes en los
// controllers y DTOs reales del código, en el commit compilado.
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
      document.paths[path][method].operationId =
        `${operationId}__${slug(path, method)}`;
      renamed++;
    }
  }
  return renamed;
}

/**
 * Redocly exige `security` explícito (poblado o `[]`) en cada operación para
 * distinguir "público a propósito" de "olvidaron documentarlo". Nest no tiene
 * un decorador Swagger dedicado para "sin auth"; estas rutas están
 * verificadas contra el decorador real `@Public()` en el código fuente (que sí
 * salta el guard JWT en runtime) — ver `docs/reports/openapi-generation-notes.md`
 * para la lista con archivo/línea. Si se añade un nuevo endpoint público, hay
 * que sumarlo aquí o el lint de Redocly (`security-defined`) volverá a fallar.
 */
const KNOWN_PUBLIC_OPERATIONS = [
  ['get', '/health'],
  ['get', '/liveness'],
  ['get', '/readiness'],
  ['post', '/iam/auth/activate'],
  ['post', '/iam/auth/login'],
  ['post', '/iam/auth/register-patient'],
  ['post', '/iam/auth/register-organization'],
  ['post', '/iam/auth/register-practitioner'],
  ['post', '/iam/auth/resend-verification'],
  ['post', '/iam/auth/forgot-password'],
  ['post', '/iam/auth/reset-password'],
  ['post', '/iam/auth/token/refresh'],
  ['post', '/iam/auth/verify-email'],
  ['post', '/webhooks/providers/{providerCode}/receipts'],
  ['post', '/integrations/webhooks/inbound'],
  ['get', '/r/{code}'],
  ['get', '/public/directory'],
  ['get', '/public/{slug}'],
  // Buscador público V65 (`CommunityPublicController`): las trece llevan
  // `@Public()` en el controlador, líneas 58-231. Entraron sin sumarse acá y
  // por eso `docs` venía fallando en `dev` con trece `security-defined`.
  ['get', '/public/search'],
  ['get', '/public/search/practitioners'],
  ['get', '/public/search/organizations'],
  ['get', '/public/search/diagnostic-units'],
  ['get', '/public/search/insurers'],
  ['get', '/public/search/pharmacies'],
  ['get', '/public/search/medications'],
  ['get', '/public/nearby'],
  ['get', '/p/{slug}'],
  ['get', '/o/{slug}'],
  ['get', '/f/{slug}'],
  ['get', '/l/{slug}'],
  ['get', '/s/{slug}'],
];

function markPublicOperations(document) {
  let marked = 0;
  for (const [method, path] of KNOWN_PUBLIC_OPERATIONS) {
    const op = document.paths[path]?.[method];
    if (!op) {
      console.warn(
        `Aviso: ruta pública esperada no encontrada: ${method.toUpperCase()} ${path}`,
      );
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
  document.tags = [...used].sort().map((name) => ({
    name,
    description:
      `Operaciones del dominio funcional ${name.replaceAll('-', ' ')}. ` +
      'Consulte el catálogo Markdown de endpoints para payloads mínimos, ' +
      'restricciones, ejemplos completos y semántica de negocio.',
  }));
  return document.tags.length;
}

const ERROR_RESPONSES = {
  400: [
    'BadRequest',
    'VALIDATION_FAILED',
    'La solicitud no cumple el contrato de entrada.',
  ],
  401: [
    'Unauthorized',
    'UNAUTHENTICATED',
    'Falta un token válido o la sesión expiró.',
  ],
  403: [
    'Forbidden',
    'FORBIDDEN',
    'El actor no posee el rol o alcance requerido.',
  ],
  404: [
    'NotFound',
    'NOT_FOUND',
    'El recurso solicitado no existe o no es visible.',
  ],
  409: [
    'Conflict',
    'CONFLICT',
    'La operación entra en conflicto con el estado actual.',
  ],
  413: [
    'PayloadTooLarge',
    'PAYLOAD_TOO_LARGE',
    'El cuerpo supera el límite permitido.',
  ],
  422: [
    'PreconditionFailed',
    'PRECONDITION_FAILED',
    'No se cumple una precondición de negocio.',
  ],
  429: [
    'RateLimited',
    'RATE_LIMITED',
    'Se excedió la cuota temporal de solicitudes.',
  ],
  500: ['InternalError', 'INTERNAL', 'Ocurrió un fallo interno no anticipado.'],
  503: [
    'ServiceUnavailable',
    'DEPENDENCY_UNAVAILABLE',
    'Una dependencia obligatoria no está disponible.',
  ],
};

function errorResponse(code, errorCode, description) {
  return {
    description,
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/ErrorResponse' },
        example: {
          code: errorCode,
          message: description,
          correlationId: 'req-01J4Z6M4Y7T3D2E1F0A9B8C7D6',
          ...(code === '400' ? { details: { field: 'exampleField' } } : {}),
          timestamp: '2026-07-31T22:00:00.000Z',
          path: '/resource/example',
        },
      },
    },
  };
}

/**
 * Completa los elementos transversales que Nest no puede inferir de la firma de
 * un controller: envelope del filtro global, errores de guards/pipes/rate-limit
 * y descripción mínima de la operación. Se usan `$ref` para que el contrato no
 * replique 867 veces el mismo cuerpo y toda evolución del envelope sea atómica.
 */
function enrichOperations(document) {
  document.components ??= {};
  document.components.schemas ??= {};
  document.components.responses ??= {};
  document.components.schemas.ErrorResponse = {
    type: 'object',
    additionalProperties: false,
    required: ['code', 'message', 'timestamp', 'path'],
    properties: {
      code: {
        type: 'string',
        enum: [
          'VALIDATION_FAILED',
          'UNAUTHENTICATED',
          'FORBIDDEN',
          'NOT_FOUND',
          'CONFLICT',
          'PRECONDITION_FAILED',
          'CONCURRENCY_CONFLICT',
          'PAYLOAD_TOO_LARGE',
          'RATE_LIMITED',
          'DEPENDENCY_UNAVAILABLE',
          'INTERNAL',
        ],
      },
      message: { type: 'string' },
      correlationId: { type: 'string' },
      details: {
        description:
          'Contexto seguro específico del error; su forma depende del código.',
      },
      timestamp: { type: 'string', format: 'date-time' },
      path: { type: 'string' },
    },
  };
  for (const [code, [name, errorCode, description]] of Object.entries(
    ERROR_RESPONSES,
  )) {
    document.components.responses[name] = errorResponse(
      code,
      errorCode,
      description,
    );
  }

  let descriptionsAdded = 0;
  let responseLinksAdded = 0;
  for (const [path, methods] of Object.entries(document.paths)) {
    for (const [method, operation] of Object.entries(methods)) {
      if (!operation.description?.trim()) {
        const access =
          operation.security?.length === 0
            ? 'Operación pública; no requiere JWT.'
            : 'Requiere JWT y los roles o alcances declarados por el controlador.';
        operation.description =
          `${operation.summary}. ${access} ` +
          'Todas las respuestas de error usan el envelope ErrorResponse.';
        descriptionsAdded++;
      }

      const responseCodes = new Set(['400', '429', '500']);
      if (operation.security?.length !== 0) responseCodes.add('401').add('403');
      if (path.includes('{')) responseCodes.add('404');
      if (operation.requestBody) responseCodes.add('413');
      if (path === '/readiness') responseCodes.add('503');
      if (['post', 'put', 'patch', 'delete'].includes(method)) {
        responseCodes.add('409').add('422');
      }
      operation.responses ??= {};
      for (const code of [...responseCodes].sort()) {
        if (operation.responses[code]) continue;
        const [name] = ERROR_RESPONSES[code];
        operation.responses[code] = { $ref: `#/components/responses/${name}` };
        responseLinksAdded++;
      }
    }
  }
  return { descriptionsAdded, responseLinksAdded };
}

async function main() {
  const { AppModule } = await import('../../dist/src/app.module.js');

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn'],
  });

  const pkg = await import('../../package.json', { with: { type: 'json' } });

  const config = new DocumentBuilder()
    .setTitle('ALOVIDA Health API')
    .setDescription(
      'API del ecosistema de salud ALOVIDA (Mantra Core Technologies). ' +
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
  const enrichment = enrichOperations(document);
  console.log(
    `  ${publicCount}/${KNOWN_PUBLIC_OPERATIONS.length} rutas públicas marcadas, ` +
      `${tagCount} tags globales, ${enrichment.descriptionsAdded} descripciones y ` +
      `${enrichment.responseLinksAdded} respuestas de error añadidas.`,
  );

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
