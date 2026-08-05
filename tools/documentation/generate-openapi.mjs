import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import yaml from 'yaml';

/**
 * Generador headless de la especificación OpenAPI (JSON y YAML) desde artefactos compilados en dist/.
 * Se ejecuta mediante `yarn openapi:generate`.
 */
async function generateOpenApi() {
  process.env.NODE_ENV = 'development';
  process.env.RATE_LIMIT_DISABLED = 'true';
  process.env.ORM_SCHEMA_SYNC = 'off';

  const distAppModulePath = path.join(process.cwd(), 'dist', 'src', 'app.module.js');
  if (!fs.existsSync(distAppModulePath)) {
    console.error('[OpenAPI] ERROR: dist/src/app.module.js no existe. Ejecute `yarn build` primero.');
    process.exit(1);
  }

  const moduleUrl = pathToFileURL(distAppModulePath).href;
  const imported = await import(moduleUrl);
  const AppModule = imported.AppModule || imported.default?.AppModule;

  if (!AppModule) {
    console.error('[OpenAPI] ERROR: No se pudo exportar AppModule desde el artefacto compilado.');
    process.exit(1);
  }

  const app = await NestFactory.create(AppModule, { logger: false });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('REDESA Health API')
    .setDescription('Mantra Core Technologies - REDESA Health Ecosystem')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);

  const outputDir = path.join(process.cwd(), 'docs', 'endpoints');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const jsonPath = path.join(outputDir, 'openapi.json');
  const yamlPath = path.join(outputDir, 'openapi.yaml');

  fs.writeFileSync(jsonPath, JSON.stringify(document, null, 2), 'utf-8');
  fs.writeFileSync(yamlPath, yaml.stringify(document), 'utf-8');

  console.log('[OpenAPI] Especificación generada exitosamente:');
  console.log(`  - JSON: ${jsonPath}`);
  console.log(`  - YAML: ${yamlPath}`);

  await app.close();
}

generateOpenApi().catch((err) => {
  console.error('[OpenAPI] Error al generar especificación OpenAPI:', err);
  process.exit(1);
});
