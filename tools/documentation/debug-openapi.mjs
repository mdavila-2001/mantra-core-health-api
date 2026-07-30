import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

async function run() {
  const logPath = path.join(process.cwd(), 'debug.log');
  try {
    process.env.NODE_ENV = 'development';
    process.env.RATE_LIMIT_DISABLED = 'true';
    process.env.ORM_SCHEMA_SYNC = 'off';

    const distAppModulePath = path.join(process.cwd(), 'dist', 'src', 'app.module.js');
    const moduleUrl = pathToFileURL(distAppModulePath).href;
    const imported = await import(moduleUrl);
    const AppModule = imported.AppModule || imported.default?.AppModule;

    if (!AppModule) {
      fs.writeFileSync(logPath, 'ERROR: AppModule not found in dist', 'utf-8');
      return;
    }

    const { NestFactory } = await import('@nestjs/core');
    const { DocumentBuilder, SwaggerModule } = await import('@nestjs/swagger');
    const yaml = (await import('yaml')).default || (await import('yaml'));

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

    fs.writeFileSync(path.join(outputDir, 'openapi.json'), JSON.stringify(document, null, 2), 'utf-8');
    fs.writeFileSync(path.join(outputDir, 'openapi.yaml'), yaml.stringify(document), 'utf-8');

    fs.writeFileSync(logPath, 'SUCCESS: OpenAPI generated successfully', 'utf-8');
    await app.close();
  } catch (err) {
    fs.writeFileSync(logPath, `ERROR:\n${err.stack || err}`, 'utf-8');
  }
}

run();
