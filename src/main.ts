import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
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

async function bootstrap() {
  process.stdout.write(BANNER);

  // `bufferLogs: true` retiene todo lo que se registre durante la inicialización
  // -incluida la materialización del DDL, que ocurre en OnApplicationBootstrap-
  // hasta que se fija el logger definitivo. Sin esto, esos primeros logs saldrían
  // por el logger por defecto de Nest y no por pino.
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // Sustituye el logger por defecto de Nest por pino. A partir de aquí, todas las
  // capas emiten por el mismo transporte estructurado: no solo lo que inyecta
  // `PinoLogger`, también cada `Logger` de `@nestjs/common` (arranque del ORM,
  // servicios) queda enrutado a pino.
  app.useLogger(app.get(Logger));
  app.flushLogs();

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

  // OpenAPI/Swagger en /docs. La misma especificación que documenta README y
  // Postman: contrato único de la API. Bearer JWT declarado como esquema global.
  const swaggerConfig = new DocumentBuilder()
    .setTitle('REDESA Health API')
    .setDescription('Mantra Core Technologies - REDESA Health Ecosystem')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
