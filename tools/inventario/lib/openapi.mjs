// Lectura del contrato OpenAPI compartida por los generadores de documentación.
//   - tools/docs/generate-endpoint-markdown.mjs (referencia por endpoint)
//   - tools/inventario/* (inventario de endpoints, flujos y catálogo de datos)
// Sólo lee `openapi/openapi.json`: no mira el código fuente. Lo que depende del AST
// (roles, delegación, tablas) vive en `ast.mjs`.
import fs from 'node:fs';
import path from 'node:path';

export const HTTP_METHODS = new Set([
  'get',
  'post',
  'put',
  'patch',
  'delete',
  'head',
  'options',
]);

export function schemaName(schema) {
  return schema?.$ref?.split('/').at(-1);
}

export function schemaType(schema) {
  if (!schema) return 'desconocido';
  if (schema.$ref) return schemaName(schema);
  if (schema.oneOf) return schema.oneOf.map(schemaType).join(' | ');
  if (schema.anyOf) return schema.anyOf.map(schemaType).join(' | ');
  if (schema.allOf) return schema.allOf.map(schemaType).join(' & ');
  if (schema.type === 'array') return `array<${schemaType(schema.items)}>`;
  return schema.type ?? (schema.properties ? 'object' : 'desconocido');
}

export function requestBody(operation) {
  const entries = Object.entries(operation.requestBody?.content ?? {});
  if (!entries.length) return {};
  const [contentType, media] = entries[0];
  return {
    contentType,
    schema: media.schema,
    required: Boolean(operation.requestBody.required),
  };
}

/**
 * Carga el contrato y devuelve sus lecturas.
 *
 * `schemas` es el mismo objeto que `spec.components.schemas` y los llamadores
 * pueden completarlo (el generador de endpoints le agrega los DTO que sólo existen
 * en el código); `dereference` y `mergedSchema` leen siempre esa referencia.
 *
 * @param {string} root - Raíz del repositorio de la API.
 */
export function loadContract(root = process.cwd()) {
  const specPath = path.join(root, 'openapi', 'openapi.json');
  const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
  const schemas = spec.components?.schemas ?? {};

  function dereference(schema) {
    if (!schema) return {};
    if (schema.$ref) return schemas[schema.$ref.split('/').at(-1)] ?? {};
    return schema;
  }

  function mergedSchema(schema) {
    if (!schema) return {};
    if (schema.$ref) return mergedSchema(dereference(schema));
    if (schema.allOf) {
      return schema.allOf.reduce(
        (acc, item) => {
          const current = mergedSchema(item);
          return {
            ...acc,
            ...current,
            properties: {
              ...(acc.properties ?? {}),
              ...(current.properties ?? {}),
            },
            required: [
              ...new Set([
                ...(acc.required ?? []),
                ...(current.required ?? []),
              ]),
            ],
          };
        },
        { ...schema, allOf: undefined },
      );
    }
    return schema;
  }

  /** Una entrada por operación HTTP, en el orden del contrato. */
  function operations() {
    const result = [];
    for (const [route, pathItem] of Object.entries(spec.paths ?? {})) {
      for (const [method, operation] of Object.entries(pathItem)) {
        if (!HTTP_METHODS.has(method)) continue;
        result.push({ route, method, operation });
      }
    }
    return result;
  }

  return { spec, specPath, schemas, dereference, mergedSchema, operations };
}
