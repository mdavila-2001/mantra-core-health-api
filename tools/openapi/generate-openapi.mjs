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
import { ModulesContainer, NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { dump } from 'js-yaml';

import {
  closeRequestBodies,
  collectBodyClasses,
  disambiguateHomonymSchemas,
  modulesOf,
} from './request-body-contract.mjs';

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
  // Entraron con `@Public()` y sin sumarse acá: `docs` venía fallando en `dev`
  // con estos `security-defined` (verificado contra el decorador el 16/09).
  // Pre-carga del PDF para alta de organización o profesional (`iam-auth.controller.ts`).
  ['post', '/iam/auth/upload-registration-document'],
  // Lecturas sociales y ficha pública (`community-public.controller.ts`).
  ['get', '/public/posts'],
  ['get', '/public/posts/{postId}/reactions'],
  ['get', '/public/posts/{postId}/comments'],
  ['get', '/public/comments/{commentId}/replies'],
  ['get', '/public/profiles/{prefijo}/{slug}'],
  ['get', '/public/profiles/{prefijo}/{slug}/reviews'],
  ['get', '/public/media/{id}'],
  // Catálogo del registro de pacientes (`insurance-catalog.controller.ts`).
  ['get', '/insurance-carrier-catalog'],
  // Vitrina pública de medicamentos (`pharmacy-public.controller.ts`).
  ['get', '/public/medications'],
  ['get', '/public/medications/{conceptId}/availability'],
  // Verificación pública de una receta por su sello
  // (`clinical-prescriptions-public.controller.ts`, `@Public()`): entró sin
  // sumarse acá y el lint de Redocly lo daba como `security-defined` (18/09).
  ['get', '/public/prescriptions/{id}/verify'],
  // Verificación pública de un certificado de portabilidad de seguros por su
  // sello SHA-256 (`insurance-portability-public.controller.ts`, `@Public()`
  // — subtarea 3.3, 2026-09-18).
  ['get', '/public/portability/verify/{manifestHash}'],
  // Entraron con `@Public()` y sin sumarse acá; `docs:validate` los daba como
  // `security-defined` (2026-10-24). Firma del alta (`iam-auth.controller.ts`) y
  // catálogo de la ficha pública (`public-catalog.controller.ts`, líneas 30-45).
  ['post', '/iam/auth/upload-registration-signature-image'],
  // Logo del consultorio propio en el alta del médico (`iam-auth.controller.ts`).
  ['post', '/iam/auth/upload-registration-logo'],
  ['get', '/public/profiles/o/{slug}/services'],
  ['get', '/public/profiles/f/{slug}/products'],
  // P34 y P37 (`pharmacy-public.controller.ts` y `public-catalog.controller.ts`,
  // las tres con `@Public()`): farmacias abiertas ahora y sucursales de una ficha.
  ['get', '/public/pharmacies/open-now'],
  ['get', '/public/profiles/f/{slug}/branches'],
  ['post', '/public/profiles/f/{slug}/branch-availability'],
  // Borradores del alta y eventos del embudo de onboarding: llevan `@Public()` en
  // `iam-onboarding-drafts.controller.ts` (líneas 24, 41 y 59) y en
  // `telemetry-onboarding-analytics.controller.ts` (línea 31). Entraron en `test`
  // sin sumarse acá y `docs:openapi:lint` daba cuatro `security-defined`.
  ['get', '/iam/onboarding-drafts/{formType}/{draftId}'],
  ['put', '/iam/onboarding-drafts/{formType}/{draftId}'],
  ['delete', '/iam/onboarding-drafts/{formType}/{draftId}'],
  ['post', '/telemetry/onboarding-events'],
  // Calle desde el punto del mapa en el alta (`reverse-geocoding.controller.ts`,
  // `@Public()`, 2026-10-26).
  ['post', '/public/geo/reverse'],
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
  // `TIMEOUT` es un 504 verdadero (SQLSTATE 57014 y plazos de dependencia): el
  // trabajo pudo ejecutarse y sólo perderse la respuesta, así que el cliente
  // reintenta con la misma clave de idempotencia. No se mezcla con el 503.
  504: [
    'GatewayTimeout',
    'TIMEOUT',
    'La operación excedió su plazo; reintente con la misma clave de idempotencia.',
  ],
};

/**
 * Rutas que no pueden devolver 504: la liveness no toca ninguna dependencia y
 * la readiness convierte el plazo agotado de cada sonda en su 503 catalogado.
 */
const NO_TIMEOUT_PATHS = new Set(['/', '/health', '/liveness', '/readiness']);

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
function enrichOperations(document, errorCodes) {
  document.components ??= {};
  document.components.schemas ??= {};
  document.components.responses ??= {};
  document.components.schemas.ErrorResponse = {
    type: 'object',
    additionalProperties: false,
    required: ['code', 'message', 'timestamp', 'path'],
    properties: {
      // Derivado del catálogo `ErrorCode` (dist/src/common/errors): una lista
      // escrita a mano dejó fuera `TIMEOUT`, `CIRCUIT_OPEN`, `CONCURRENCY_LIMIT`
      // e `IDENTITY_VERIFICATION_REQUIRED`, que el filtro global sí emite.
      code: { type: 'string', enum: errorCodes },
      message: { type: 'string' },
      reason: {
        type: 'string',
        description:
          'Sub-código de negocio o de sistema estable dentro de `code` ' +
          '(p. ej. `ROLE_INSUFFICIENT`, `INVALID_CURSOR`). Ramificar sobre ' +
          'él, no sobre `message`.',
      },
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
      if (!NO_TIMEOUT_PATHS.has(path)) responseCodes.add('504');
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
  const { ErrorCode } =
    await import('../../dist/src/common/errors/error-codes.js');

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

  // Antes de generar: dos DTO homónimos en módulos distintos comparten un solo
  // esquema y una de las rutas queda documentada con el cuerpo ajeno. Ver
  // `request-body-contract.mjs`.
  const bodyClasses = collectBodyClasses(modulesOf(app.get(ModulesContainer)));
  const renamed = disambiguateHomonymSchemas(bodyClasses);

  const document = SwaggerModule.createDocument(app, config);
  // `forbidNonWhitelisted`, dicho en el contrato: una clave que el DTO no
  // declara es un 400, así que el esquema del cuerpo es cerrado.
  const closedBodies = closeRequestBodies(document, bodyClasses);
  console.log(
    `  ${bodyClasses.size} DTO de cuerpo · ${renamed.length} esquemas homónimos renombrados ` +
      `(${[...new Set(renamed.map((r) => r.from))].join(', ') || 'ninguno'}) · ` +
      `${closedBodies} esquemas con additionalProperties: false.`,
  );
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
  const enrichment = enrichOperations(document, Object.values(ErrorCode));
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
