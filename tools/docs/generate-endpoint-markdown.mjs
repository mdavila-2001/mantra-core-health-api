import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { buildSourceIndex, jsDoc, literal } from '../inventario/lib/ast.mjs';
import { createDtoReader } from '../inventario/lib/dto.mjs';
import { code, md, slug } from '../inventario/lib/markdown.mjs';
import {
  loadContract,
  requestBody,
  schemaName,
  schemaType,
} from '../inventario/lib/openapi.mjs';

const ROOT = process.cwd();
const OUTPUT_DIR = path.join(ROOT, 'openapi', 'endpoints');

const contract = loadContract(ROOT);
const { schemas, dereference, mergedSchema, operations } = contract;
const sourceIndex = buildSourceIndex(ROOT);
const { classes, controllerMethods, dtoConstraints, sourceClassProperties } =
  sourceIndex;
const {
  exampleForSchema,
  constraintText,
  fieldRows,
  sourceClassSchema,
  sourceTypeSchema,
} = createDtoReader({
  contract,
  index: sourceIndex,
});

function renderFieldTable(schema, emptyMessage) {
  const rows = fieldRows(schema);
  if (!rows.length) return emptyMessage;
  return [
    '| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |',
    '|---|:---:|---|---|---|---|',
    ...rows.map(
      (row) =>
        `| ${code(row.field)} | ${row.required} | ${code(row.type)} | ${md(row.constraints)} | ${md(row.description)} | ${code(row.example)} |`,
    ),
  ].join('\n');
}

function parameterExample(parameter) {
  const schema = parameter.schema ?? {};
  return exampleForSchema(schema, 'full', parameter.name);
}

function renderParameters(parameters) {
  if (!parameters.length)
    return 'No hay parámetros de ruta, query ni cabeceras específicos de la operación.';
  return [
    '| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |',
    '|---|---|:---:|---|---|---|---|',
    ...parameters.map(
      (parameter) =>
        `| ${code(parameter.name)} | ${parameter.in} | ${parameter.required ? 'Sí' : 'No'} | ${code(schemaType(parameter.schema))} | ${md(constraintText(parameter.schema, '', parameter.name))} | ${md(parameter.description || 'Sin descripción específica en OpenAPI.')} | ${code(typeof parameterExample(parameter) === 'object' ? JSON.stringify(parameterExample(parameter)) : parameterExample(parameter))} |`,
    ),
  ].join('\n');
}

function extractResponseSchema(returnType) {
  if (!returnType || returnType === 'no declarado') return {};
  let normalized = returnType.trim();
  while (/^(Promise|Observable)<[\s\S]+>$/.test(normalized))
    normalized = normalized
      .replace(/^(Promise|Observable)<([\s\S]+)>$/, '$2')
      .trim();
  if (normalized === 'void' || normalized === 'undefined')
    return { void: true, type: normalized };
  const generic = normalized.match(/^(\w+)<([\s\S]+)>$/);
  if (generic && sourceClassProperties.has(generic[1])) {
    const parameters = classes.get(generic[1])?.typeParameters ?? [];
    // Los DTO genéricos del código usan actualmente un parámetro. El split se
    // conserva explícito para no fingir soporte de genéricos anidados múltiples.
    const argumentsList = parameters.length === 1 ? [generic[2].trim()] : [];
    if (argumentsList.length === parameters.length) {
      const replacements = new Map(
        parameters.map((parameter, index) => [parameter, argumentsList[index]]),
      );
      return {
        schema: sourceClassSchema(generic[1], replacements),
        type: normalized,
      };
    }
  }
  const array = normalized.endsWith('[]');
  const candidate = (array ? normalized.slice(0, -2) : normalized)
    .split(/[|&]/)[0]
    .trim()
    .replace(/^Readonly</, '')
    .replace(/>$/, '');
  if (schemas[candidate]) {
    return {
      schema: array
        ? {
            type: 'array',
            items: { $ref: `#/components/schemas/${candidate}` },
          }
        : { $ref: `#/components/schemas/${candidate}` },
      type: normalized,
    };
  }
  if (
    /^(string|number|boolean|Date)$/.test(normalized) ||
    normalized.startsWith('{')
  ) {
    return { schema: sourceTypeSchema(normalized), type: normalized };
  }
  return { type: normalized };
}

function successDescription(status, method) {
  const descriptions = {
    200: 'Operación completada correctamente.',
    201: 'Recurso creado o acción registrada correctamente.',
    202: 'Solicitud aceptada para procesamiento asíncrono.',
    204: 'Operación completada sin cuerpo de respuesta.',
  };
  return (
    descriptions[status] ??
    (method === 'get'
      ? 'Consulta completada correctamente.'
      : 'Operación completada correctamente.')
  );
}

const exceptionContract = {
  UnauthorizedException: [401, 'UNAUTHENTICATED'],
  ResourceNotFoundException: [404, 'NOT_FOUND'],
  NotFoundException: [404, 'NOT_FOUND'],
  ConflictException: [409, 'CONFLICT'],
  ConcurrencyConflictException: [409, 'CONCURRENCY_CONFLICT'],
  PreconditionFailedException: [422, 'PRECONDITION_FAILED'],
  BadRequestException: [400, 'VALIDATION_FAILED'],
  ForbiddenException: [403, 'FORBIDDEN'],
};

function errorRows(operation, source, hasInput) {
  const rows = [];
  const add = (status, errorCode, situation, evidence) => {
    const key = `${status}:${errorCode}:${situation}`;
    if (!rows.some((row) => row.key === key))
      rows.push({ key, status, errorCode, situation, evidence });
  };
  if (hasInput)
    add(
      400,
      'VALIDATION_FAILED',
      'Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.',
      'Pipeline global de validación',
    );
  if ((operation.security ?? []).length)
    add(
      401,
      'UNAUTHENTICATED',
      'JWT Bearer ausente, vencido o inválido.',
      'Guard global de autenticación',
    );
  if (
    (operation.security ?? []).length &&
    (source?.roles.length || source?.moduleName !== 'app')
  ) {
    add(
      403,
      'FORBIDDEN',
      source?.roles.length
        ? `El actor no posee alguno de los roles admitidos: ${source.roles.join(', ')}.`
        : 'El actor no tiene acceso al tenant o alcance exigido por la operación.',
      'Roles/tenant/guards de autorización',
    );
  }
  for (const thrown of source?.exceptions ?? []) {
    const contract = exceptionContract[thrown.exception];
    if (!contract) continue;
    add(
      contract[0],
      contract[1],
      typeof thrown.message === 'string'
        ? thrown.message
        : `El servicio lanza ${thrown.exception}.`,
      `Excepción explícita en ${thrown.source}`,
    );
  }
  if (operation.requestBody)
    add(
      413,
      'PAYLOAD_TOO_LARGE',
      'El body supera el límite global de 1 MB.',
      'Parser JSON/urlencoded global y filtro global de excepciones',
    );
  add(
    429,
    'RATE_LIMITED',
    source?.throttle
      ? `Se excede el límite particular ${source.throttle}.`
      : 'Se exceden 300 solicitudes por 60 segundos para la instancia.',
    'Throttler y filtro global de excepciones',
  );
  add(
    500,
    'INTERNAL',
    'Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno.',
    'Filtro global de excepciones',
  );
  return rows.sort((a, b) => a.status - b.status);
}

function errorExample(route, row) {
  return {
    code: row.errorCode,
    message: row.status >= 500 ? 'Error interno del servidor' : row.situation,
    correlationId: 'req-01J00000000000000000000000',
    timestamp: '2026-07-31T12:00:00.000Z',
    path: route,
  };
}

function renderErrors(operation, source, route, hasInput) {
  const rows = errorRows(operation, source, hasInput);
  const primary =
    rows.find((row) => row.status >= 400 && row.status < 500) ?? rows.at(-1);
  return [
    '| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |',
    '|---:|---|---|---|',
    ...rows.map(
      (row) =>
        `| ${row.status} | ${code(row.errorCode)} | ${md(row.situation)} | ${md(row.evidence)} |`,
    ),
    '',
    'Ejemplo de error normalizado:',
    '',
    '```json',
    JSON.stringify(errorExample(route, primary), null, 2),
    '```',
  ].join('\n');
}

function businessDescription(operation, method) {
  const summary =
    operation.summary ||
    operation.description ||
    `Operación ${method.toUpperCase()}`;
  const verbs = {
    get: 'consultar',
    post: 'ejecutar',
    put: 'reemplazar o registrar',
    patch: 'actualizar parcialmente',
    delete: 'eliminar o desactivar',
  };
  return `Permite al actor autorizado ${verbs[method] ?? 'ejecutar'} el caso de uso «${summary}». El resultado representa el efecto de negocio de esa acción dentro del módulo y respeta el aislamiento por tenant, las reglas de autorización y las invariantes del dominio.`;
}

function cleanJsDoc(value) {
  if (!value || /^(UC|C)-[\w-]+\.?$/.test(value)) return '';
  return value;
}

function resolvedRoute(route, parameters, includeOptional) {
  let result = route;
  const query = [];
  for (const parameter of parameters) {
    if (!includeOptional && !parameter.required) continue;
    const value = parameterExample(parameter);
    if (parameter.in === 'path')
      result = result.replace(
        `{${parameter.name}}`,
        encodeURIComponent(String(value)),
      );
    if (parameter.in === 'query')
      query.push(
        `${encodeURIComponent(parameter.name)}=${encodeURIComponent(String(value))}`,
      );
  }
  return result + (query.length ? `?${query.join('&')}` : '');
}

function renderRequestExample(method, route, operation, source, mode) {
  const parameters = operation.parameters ?? [];
  const body = requestBody(operation);
  const lines = [
    `${method.toUpperCase()} ${resolvedRoute(route, parameters, mode === 'full')} HTTP/1.1`,
    'Host: localhost:3000',
  ];
  if ((operation.security ?? []).length)
    lines.push('Authorization: Bearer <access_token_jwt>');
  for (const parameter of parameters) {
    if (
      parameter.in !== 'header' ||
      (mode === 'minimal' && !parameter.required)
    )
      continue;
    lines.push(`${parameter.name}: ${parameterExample(parameter)}`);
  }
  if (body.schema) {
    lines.push(
      `Content-Type: ${body.contentType}`,
      '',
      JSON.stringify(exampleForSchema(body.schema, mode), null, 2),
    );
  }
  return ['```http', ...lines, '```'].join('\n');
}

function renderSuccess(operation, source, method) {
  const statuses = Object.entries(operation.responses ?? {});
  const responseType = extractResponseSchema(source?.returnType);
  const lines = [
    '| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |',
    '|---:|---|---|---|',
    ...statuses.map(([status, response]) => {
      const numeric = Number(status);
      const description =
        response.description || successDescription(numeric, method);
      return `| ${status} | ${md(description)} | ${code(source?.returnType ?? 'no declarado')} | ${response.content ? 'Sí' : 'No'} |`;
    }),
  ];
  if (responseType.void) {
    lines.push(
      '',
      'La operación no devuelve body según el tipo TypeScript del controlador.',
    );
  } else if (responseType.schema) {
    lines.push(
      '',
      `Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara ${code(responseType.type)}. Ejemplo completo derivado de ese DTO:`,
      '',
      '```json',
      JSON.stringify(exampleForSchema(responseType.schema, 'full'), null, 2),
      '```',
      '',
      'Campos de la respuesta:',
      '',
      renderFieldTable(
        responseType.schema,
        'El DTO de respuesta no declara campos documentables.',
      ),
    );
  } else {
    lines.push(
      '',
      `El controlador declara ${code(responseType.type || source?.returnType || 'un tipo no especificado')}, pero ese tipo no existe como esquema enlazable en ${code('components.schemas')}. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.`,
    );
  }
  lines.push(
    '',
    'En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.',
  );
  return lines.join('\n');
}

function renderEndpoint(endpoint, ordinal) {
  const { route, method, operation, source } = endpoint;
  const body = requestBody(operation);
  const parameters = operation.parameters ?? [];
  const hasInput = Boolean(body.schema || parameters.length);
  const sourceLink = source ? `../../${source.source}` : undefined;
  const systemDetails = [
    `NestJS resuelve ${code(method.toUpperCase() + ' ' + route)} en ${code(operation.operationId)}.`,
    source?.delegates.length
      ? `El controlador delega en ${source.delegates.map(code).join(', ')}.`
      : 'No se detectó una delegación adicional desde el controlador.',
    body.schema
      ? `Valida el body como ${code(schemaName(body.schema) ?? schemaType(body.schema))} y consume ${code(body.contentType)}.`
      : 'No recibe body.',
    source
      ? `El tipo de retorno estático es ${code(source.returnType)}.`
      : 'No se encontró metadato estático adicional del controlador.',
  ].join(' ');
  const restrictions = [];
  restrictions.push(
    (operation.security ?? []).length
      ? 'Requiere `Authorization: Bearer <JWT>`.'
      : 'Endpoint público: no exige JWT según el contrato y `@Public()` del código.',
  );
  if (source?.roles.length)
    restrictions.push(
      `Roles admitidos por ` +
        code('@Roles') +
        `: ${source.roles.map(code).join(', ')}.`,
    );
  if (source?.uuidParams.length)
    restrictions.push(
      `Deben ser UUID válidos: ${source.uuidParams.map(code).join(', ')}.`,
    );
  if (body.schema)
    restrictions.push(
      'El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).',
    );
  restrictions.push(
    source?.throttle
      ? `Rate limit particular: ${code(source.throttle)}.`
      : 'Rate limit global: 300 solicitudes por cada 60 segundos por instancia.',
  );
  restrictions.push(
    'CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.',
  );

  return [
    `## ${ordinal}. ${method.toUpperCase()} ${route}`,
    '',
    `- **Módulo:** ${code(source?.moduleName ?? operation.tags?.[0] ?? 'sin-clasificar')}`,
    `- **Etiqueta OpenAPI:** ${(operation.tags ?? []).map(code).join(', ') || 'Sin etiqueta'}`,
    `- **Nombre:** ${md(operation.summary || operation.operationId)}`,
    `- **Operation ID:** ${code(operation.operationId)}`,
    `- **Autenticación:** ${(operation.security ?? []).length ? 'JWT Bearer obligatoria' : 'Pública'}`,
    sourceLink
      ? `- **Implementación:** [${source.className}.${source.methodName}](${sourceLink})`
      : '- **Implementación:** no localizada automáticamente',
    '',
    '### Descripción de negocio',
    '',
    operation.description || businessDescription(operation, method),
    cleanJsDoc(source?.jsDoc)
      ? `\nContexto declarado en el controlador: ${cleanJsDoc(source.jsDoc)}`
      : '',
    '',
    '### Descripción del sistema',
    '',
    systemDetails,
    '',
    '### Parámetros',
    '',
    renderParameters(parameters),
    '',
    '### Payload mínimo aceptable',
    '',
    body.schema
      ? `Incluye únicamente los campos obligatorios del DTO ${code(schemaName(body.schema) ?? schemaType(body.schema))}; los campos opcionales se omiten.`
      : 'La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.',
    '',
    renderRequestExample(method, route, operation, source, 'minimal'),
    '',
    '### Restricciones a considerar',
    '',
    ...restrictions.map((item) => `- ${item}`),
    '',
    body.schema
      ? renderFieldTable(
          body.schema,
          'El body no declara campos documentables.',
        )
      : '',
    '',
    '### Payload completo de ejemplo',
    '',
    body.schema
      ? 'Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.'
      : 'No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.',
    '',
    renderRequestExample(method, route, operation, source, 'full'),
    '',
    '### Respuestas generales esperadas',
    '',
    renderSuccess(operation, source, method),
    '',
    '### Respuestas de error posibles',
    '',
    renderErrors(operation, source, route, hasInput),
    '',
    '---',
    '',
  ].join('\n');
}

const endpoints = [];
for (const { route, method, operation } of operations()) {
  const source = controllerMethods.get(operation.operationId.split('__')[0]);
  endpoints.push({
    route,
    method,
    operation,
    source,
    moduleName: source?.moduleName ?? operation.tags?.[0] ?? 'sin-clasificar',
  });
}

const byModule = new Map();
for (const endpoint of endpoints) {
  const list = byModule.get(endpoint.moduleName) ?? [];
  list.push(endpoint);
  byModule.set(endpoint.moduleName, list);
}

fs.mkdirSync(OUTPUT_DIR, { recursive: true });
for (const existing of fs.readdirSync(OUTPUT_DIR)) {
  if (existing.endsWith('.md')) fs.unlinkSync(path.join(OUTPUT_DIR, existing));
}

const indexRows = [];
let documented = 0;
for (const [moduleName, moduleEndpoints] of [...byModule.entries()].sort(
  ([a], [b]) => a.localeCompare(b),
)) {
  moduleEndpoints.sort(
    (a, b) =>
      a.route.localeCompare(b.route) || a.method.localeCompare(b.method),
  );
  const filename = `${slug(moduleName)}.md`;
  const tags = [
    ...new Set(moduleEndpoints.flatMap((item) => item.operation.tags ?? [])),
  ].sort();
  const controllers = [
    ...new Set(
      moduleEndpoints.map((item) => item.source?.className).filter(Boolean),
    ),
  ].sort();
  const content = [
    '<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->',
    '',
    `# Endpoints del módulo ${code(moduleName)}`,
    '',
    `Referencia exhaustiva de ${moduleEndpoints.length} operación(es) del módulo ${code(moduleName)}, derivada del contrato OpenAPI y del código TypeScript.`,
    '',
    `- **Etiquetas OpenAPI:** ${tags.map(code).join(', ') || 'Sin etiquetas'}`,
    `- **Controladores:** ${controllers.map(code).join(', ') || 'No localizados'}`,
    '- **Contrato fuente:** [openapi.json](../openapi.json)',
    '- **Convenciones transversales:** [README.md](README.md)',
    '',
    '## Índice del módulo',
    '',
    ...moduleEndpoints.map(
      (item, index) =>
        `${index + 1}. [${item.method.toUpperCase()} ${item.route}](#${index + 1}-${slug(item.method + '-' + item.route)}) — ${item.operation.summary || item.operation.operationId}`,
    ),
    '',
    '---',
    '',
    ...moduleEndpoints.map((item, index) => renderEndpoint(item, index + 1)),
  ].join('\n');
  fs.writeFileSync(path.join(OUTPUT_DIR, filename), content + '\n', 'utf8');
  indexRows.push({
    moduleName,
    filename,
    count: moduleEndpoints.length,
    tags,
    controllers: controllers.length,
  });
  documented += moduleEndpoints.length;
}

const index = [
  '<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->',
  '',
  '# Referencia ultra detallada de endpoints',
  '',
  `Esta referencia documenta **${documented} de ${endpoints.length} operaciones HTTP** registradas en ${code('openapi/openapi.json')}, agrupadas en **${byModule.size} módulos**. Cada endpoint incluye módulo, nombre, descripciones de negocio y sistema, parámetros, payload mínimo, restricciones, payload completo, respuesta exitosa y errores posibles.`,
  '',
  '## Cómo interpretar la referencia',
  '',
  '- **Fuente contractual:** rutas, métodos, parámetros, seguridad, DTOs de entrada y status exitosos proceden de `openapi.json`.',
  '- **Fuente de implementación:** controlador, roles, UUID pipes, servicio delegado, tipo TypeScript de retorno y excepciones explícitas se extraen del AST de `src/`.',
  '- **Payload mínimo:** contiene solo propiedades marcadas como obligatorias. Si el objeto no tiene campos obligatorios, `{}` es el body estructural mínimo; las reglas de negocio todavía pueden exigir coherencia entre campos opcionales.',
  '- **Payload completo:** incluye todos los campos documentados. Es un ejemplo sintáctico; UUID, códigos de catálogo y referencias deben existir en el tenant real.',
  '- **Respuestas:** el OpenAPI actual no enlaza schemas de respuesta. Cuando el retorno TypeScript coincide con un DTO Swagger, esta referencia lo muestra como evidencia de implementación, señalando expresamente la brecha contractual.',
  '- **Errores:** se combinan errores transversales reales con excepciones detectadas en los servicios alcanzables desde el controlador. No todos los errores son alcanzables en todas las ramas de ejecución.',
  '',
  '## Reglas transversales',
  '',
  '- Autenticación JWT Bearer por defecto; solo las operaciones con `security: []` son públicas.',
  '- Validación global con transformación implícita, `whitelist: true` y `forbidNonWhitelisted: true`.',
  '- Límite de body JSON/urlencoded: 1 MB. Archivos grandes siguen flujos de almacenamiento de objetos.',
  '- Rate limit global: 300 solicitudes cada 60 segundos por instancia; autenticación aplica límites más estrictos.',
  '- Aislamiento multi-tenant mediante el contexto del actor y, cuando corresponda, `X-Tenant-Id`.',
  '- Errores normalizados como `{ code, message, correlationId?, details?, timestamp, path }`.',
  '- Respuestas trazables mediante la cabecera `x-trace-id`.',
  '',
  '## Forma general del error',
  '',
  '```json',
  JSON.stringify(
    {
      code: 'VALIDATION_FAILED',
      message: 'Error de validación',
      correlationId: 'req-01J00000000000000000000000',
      details: { violations: ['email must be an email'] },
      timestamp: '2026-07-31T12:00:00.000Z',
      path: '/ruta',
    },
    null,
    2,
  ),
  '```',
  '',
  '## Módulos',
  '',
  '| Módulo | Endpoints | Etiquetas OpenAPI | Controladores |',
  '|---|---:|---|---:|',
  ...indexRows.map(
    (row) =>
      `| [${row.moduleName}](${row.filename}) | ${row.count} | ${row.tags.map(code).join(', ')} | ${row.controllers} |`,
  ),
  '',
  '## Regeneración y control de cobertura',
  '',
  '```bash',
  'yarn docs:endpoints:generate',
  '```',
  '',
  `La generación falla si la cantidad documentada difiere de las ${endpoints.length} operaciones encontradas. Los archivos de esta carpeta son derivados; los cambios permanentes deben hacerse en decoradores, DTOs, controladores, servicios o en el generador.`,
  '',
].join('\n');

fs.writeFileSync(path.join(OUTPUT_DIR, 'README.md'), index, 'utf8');

const rootIndex = [
  '<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->',
  '',
  '# Documentación de endpoints',
  '',
  `Se documentan **${documented} de ${endpoints.length} endpoints** en **${byModule.size} módulos**. La referencia completa, convenciones y modelo de error están en [openapi/endpoints/README.md](endpoints/README.md).`,
  '',
  '| Módulo | Endpoints | Documento |',
  '|---|---:|---|',
  ...indexRows.map(
    (row) =>
      `| ${code(row.moduleName)} | ${row.count} | [Abrir referencia](endpoints/${row.filename}) |`,
  ),
  '',
  'Regenerar con `yarn docs:endpoints:generate` después de modificar rutas, DTOs, controladores o servicios.',
  '',
].join('\n');

fs.writeFileSync(path.join(ROOT, 'openapi', 'ENDPOINTS.md'), rootIndex, 'utf8');

if (documented !== endpoints.length) {
  throw new Error(
    `Cobertura incompleta: ${documented}/${endpoints.length} endpoints documentados`,
  );
}

console.log(
  `Documentación generada: ${documented} endpoints, ${byModule.size} módulos, ${indexRows.length + 1} archivos Markdown.`,
);
