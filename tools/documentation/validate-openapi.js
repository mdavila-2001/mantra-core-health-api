const fs = require('fs');
const path = require('path');

/**
 * Validador de la especificación OpenAPI generada.
 * Se ejecuta mediante `yarn openapi:validate`.
 */
function validateOpenApi() {
  const outputDir = path.join(process.cwd(), 'docs', 'endpoints');
  const jsonPath = path.join(outputDir, 'openapi.json');
  const yamlPath = path.join(outputDir, 'openapi.yaml');

  if (!fs.existsSync(jsonPath) || !fs.existsSync(yamlPath)) {
    console.error(
      '[OpenAPI Validation] ERROR: No se encontraron los archivos openapi.json o openapi.yaml en docs/endpoints/. Ejecute `yarn openapi:generate` primero.',
    );
    process.exit(1);
  }

  const rawJson = fs.readFileSync(jsonPath, 'utf-8');
  let spec;

  try {
    spec = JSON.parse(rawJson);
  } catch (e) {
    console.error(
      '[OpenAPI Validation] ERROR: openapi.json no es un JSON válido:',
      e,
    );
    process.exit(1);
  }

  if (!spec.openapi?.startsWith('3.')) {
    console.error(
      '[OpenAPI Validation] ERROR: La versión de OpenAPI debe ser 3.x.',
    );
    process.exit(1);
  }

  const pathCount = Object.keys(spec.paths ?? {}).length;
  if (pathCount === 0) {
    console.error(
      '[OpenAPI Validation] ERROR: La especificación OpenAPI no contiene ninguna ruta (paths).',
    );
    process.exit(1);
  }

  console.log(
    `[OpenAPI Validation] ÉXITO: Especificación OpenAPI válida para "${spec.info?.title ?? 'API'}". Se validaron ${pathCount} rutas HTTP.`,
  );
}

validateOpenApi();
