import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';

/**
 * Splash de arranque. Se escribe directo a stdout, no por el logger: es un
 * cartel decorativo de una sola vez, anterior a que exista el logger, no una
 * línea de log de ninguna capa.
 */
const BANNER = `
  __  __             _             ____                  _____           _
 |  \\/  | __ _ _ __ | |_ _ __ __ _/ ___|___  _ __ ___   |_   _|__  ___| |__
 | |\\/| |/ _\` | '_ \\| __| '__/ _\` | |   / _ \\| '__/ _ \\    | |/ _ \\/ __| '_ \\
 | |  | | (_| | | | | |_| | | (_| | |__| (_) | | |  __/    | |  __/ (__| | | |
 |_|  |_|\\__,_|_| |_|\\__|_|  \\__,_|\\____\\___/|_|  \\___|    |_|\\___|\\___|_| |_|
 =============================================================================
  MANTRA CORE TECHNOLOGIES - REDESA HEALTH API
 =============================================================================
`;

/**
 * Ejecuta la operación bootstrap.
 * @returns Resultado de bootstrap.
 */
async function bootstrap() {
  process.stdout.write(BANNER);

  // `bufferLogs: true` retiene todo lo que se registre durante la inicialización
  // -incluida la materialización del DDL, que ocurre en OnApplicationBootstrap-
  // hasta que se fija el logger definitivo. Sin esto, esos primeros logs saldrían
  // por el logger por defecto de Nest y no por pino.
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // Sin esto, Nest ignora SIGTERM/SIGINT y no dispara `onModuleDestroy` /
  // `beforeApplicationShutdown` (cierre de conexiones de MikroORM, Redis,
  // etc.) — `docker stop`/`docker compose down` cortarían el proceso en seco
  // en vez de drenar las requests en vuelo. Los 20 workers ya lo hacían
  // (`worker/bootstrap.ts`); a la API le faltaba.
  app.enableShutdownHooks();

  // Sustituye el logger por defecto de Nest por pino. A partir de aquí, todas las
  // capas emiten por el mismo transporte estructurado: no solo lo que inyecta
  // `PinoLogger`, también cada `Logger` de `@nestjs/common` (arranque del ORM,
  // servicios) queda enrutado a pino.
  app.useLogger(app.get(Logger));
  app.flushLogs();

  // Cabeceras de seguridad HTTP (HSTS, X-Content-Type-Options, X-Frame-Options,
  // Referrer-Policy, etc.). Imprescindible en un backend de salud expuesto.
  app.use(helmet());

  // Límite explícito de tamaño de payload. El default de Express (100 kb) queda
  // documentado aquí de forma intencional; las cargas grandes (imágenes, DICOM)
  // van por el flujo de almacenamiento de objetos, no por el body JSON.
  app.use(json({ limit: '1mb' }));
  app.use(urlencoded({ extended: true, limit: '1mb' }));

  // CORS deshabilitado por defecto de forma explícita (deny-by-default). Cuando
  // haya un frontend con origen conocido, declarar aquí la allowlist de orígenes.
  app.enableCors({ origin: false });

  // Validación global de DTO. `whitelist` + `forbidNonWhitelisted` cierran el
  // mass-assignment: cualquier propiedad no declarada en el DTO se rechaza en
  // lugar de filtrarse a la capa de dominio. `transform` habilita la coerción de
  // tipos declarada con class-transformer (p. ej. query params numéricos).
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // OpenAPI/Swagger en /docs y referencia interactiva Scalar en /reference.
  // Solo fuera de producción: en producción publicarían el mapa completo de
  // endpoints y esquemas (divulgación de superficie de ataque). La estrategia
  // de exposición en producción (Scalar protegido, entorno separado, etc.) es
  // una decisión pendiente — ver `SEC-002` en
  // `docs/governance/traceability-matrix.md` y `docs/api/conventions.md`.
  if (process.env.NODE_ENV !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('REDESA Health API')
      .setDescription('Mantra Core Technologies - REDESA Health Ecosystem')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document);

    app.use(
      '/reference',
      apiReference({
        content: document,
        pageTitle: 'REDESA Health API — Referencia',
        theme: 'default',
        metaData: {
          title: 'REDESA Health API',
          description:
            'Referencia interactiva del contrato OpenAPI real, generado desde los decoradores del backend.',
        },
      }),
    );
  }

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
