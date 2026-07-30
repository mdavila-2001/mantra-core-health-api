require('dotenv').config();
require('reflect-metadata');
const fs = require('fs');
const path = require('path');
const yaml = require('yaml');

process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT EXCEPTION]:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('[UNHANDLED REJECTION]:', reason);
  process.exit(1);
});

async function generateOpenApi() {
  try {
    process.env.NODE_ENV = 'development';
    process.env.RATE_LIMIT_DISABLED = 'true';
    process.env.ORM_SCHEMA_SYNC = 'off';

    const distAppModulePath = path.join(process.cwd(), 'dist', 'src', 'app.module.js');
    if (!fs.existsSync(distAppModulePath)) {
      console.error('[OpenAPI] ERROR: dist/src/app.module.js no existe. Ejecute `yarn build` primero.');
      process.exit(1);
    }

    console.log('[OpenAPI] Cargando AppModule...');
    const { AppModule } = require(distAppModulePath);
    console.log('[OpenAPI] AppModule cargado. Creando aplicación NestJS...');

    const { NestFactory } = require('@nestjs/core');
    const { DocumentBuilder, SwaggerModule } = require('@nestjs/swagger');

    const app = await NestFactory.create(AppModule, {
      logger: false,
      abortOnError: false,
    });
    console.log('[OpenAPI] Aplicación NestJS creada. Generando documento Swagger...');

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
  } catch (err) {
    console.error('[OpenAPI] ERROR CAPTURADO EN CATCH:', err);
    process.exit(1);
  }
}

generateOpenApi();
