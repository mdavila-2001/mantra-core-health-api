// PRIMERA IMPORTACIÓN DEL PROCESO, y debe seguir siéndolo. Las instrumentaciones
// automáticas de OpenTelemetry parchean `http`, `express`, `pg` e `ioredis` en el
// momento en que Node los carga; si NestJS se importa antes, el parcheo llega
// tarde y no se emite ni un span. Ver `src/observability/telemetry.bootstrap.ts`.
import './observability/telemetry.bootstrap';

import type { Server } from 'node:http';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import { Logger, PinoLogger } from 'nestjs-pino';
import helmet from 'helmet';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';
import {
  describeBuild,
  installProcessGuards,
  installShutdownWatchdog,
  loadBuildInfo,
} from './common';

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
  MANTRA CORE TECHNOLOGIES - REDSAT HEALTH API
 =============================================================================
`;

/**
 * Ejecuta la operación bootstrap.
 * @returns Resultado de bootstrap.
 */
async function bootstrap() {
  process.stdout.write(BANNER);

  // `bufferLogs: true` retiene la totalidad de lo registrado durante la inicialización
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

  // Lo primero que se dice por el logger definitivo es QUÉ artefacto arrancó.
  // Va antes que cualquier otra cosa a propósito: si algo del arranque falla,
  // esta línea ya quedó escrita y el diagnóstico empieza sabiendo qué código
  // corría, en vez de tener que inspeccionar el `dist/` del contenedor.
  const build = loadBuildInfo();
  app.get(Logger).log({ event: 'app.build', ...build }, describeBuild(build));

  const logger = await app.resolve(PinoLogger);
  logger.setContext('bootstrap');

  // Red de seguridad del proceso: una excepción no capturada o una promesa
  // rechazada sin manejador matan el proceso igual, pero sin esto lo hacen
  // escribiendo texto suelto en `stderr` —sin `trace_id`, sin servicio, sin
  // indexar— y perdiendo los spans que quedaban en el búfer del exportador.
  // Un contenedor que se reinicia en bucle sin dejar rastro de por qué es el
  // peor punto de partida posible para un incidente. Ver `common/runtime`.
  installProcessGuards({
    logger,
    processName: 'api',
    onFatal: async () => {
      await app.close().catch(() => undefined);
    },
  });

  // Y el otro extremo: un `SIGTERM` cuyo drenaje se atasca. Sin plazo, el
  // proceso se queda a medio apagar hasta que Docker lo mata con `SIGKILL` a
  // los 10 s, sin decir qué lo bloqueaba. El vigilante fuerza la salida
  // **dejando escrito** qué seguía pendiente.
  installShutdownWatchdog({
    logger,
    processName: 'api',
    timeoutMs: Number(process.env.API_SHUTDOWN_TIMEOUT_MS ?? 30_000),
  });

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

  // Mensajería en tiempo real (`CommunityMessagingGateway`). Sin este adaptador
  // el `@WebSocketGateway` del módulo `community` queda declarado pero nunca
  // escucha: Nest no monta socket.io sobre el servidor HTTP por defecto. Mismo
  // criterio deny-by-default que el CORS de arriba — el gateway declara su
  // propio `cors: { origin: false }`.
  app.useWebSocketAdapter(new IoAdapter(app));

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
      .setTitle('REDSAT Health API')
      .setDescription('Mantra Core Technologies - REDSAT Health Ecosystem')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document);

    app.use(
      '/reference',
      (
        apiReference as (
          options: unknown,
        ) => (req: unknown, res: unknown) => void
      )({
        content: document,
        pageTitle: 'REDSAT Health API — Referencia',
        theme: 'default',
        metaData: {
          title: 'REDSAT Health API',
          description:
            'Referencia interactiva del contrato OpenAPI real, generado desde los decoradores del backend.',
        },
      }),
    );
  }

  // `app.listen` está tipado como `Promise<any>` en Nest porque el servidor
  // depende del adaptador. Se acota al `Server` de Node, que es lo que devuelve
  // el adaptador de Express que usa esta aplicación, para poder tocar sus
  // plazos con el tipo puesto.
  const server = (await app.listen(process.env.PORT ?? 3000)) as Server;

  // Plazos del servidor HTTP. Son la defensa contra el agotamiento de
  // descriptores de fichero por conexiones que no progresan (el patrón
  // "slowloris": abrir muchas conexiones y mandar las cabeceras de una en una).
  //
  // `keepAliveTimeout` debe quedar **por encima** del idle timeout del
  // balanceador que tenga delante. Es una condición de carrera clásica y muy
  // difícil de diagnosticar: si el servidor cierra la conexión primero, el
  // balanceador puede haber enviado ya una petición por ella y el cliente
  // recibe un 502 esporádico sin nada anómalo en los logs de la aplicación.
  // 65 s cubre el default de 60 s de ALB/nginx.
  server.keepAliveTimeout = Number(
    process.env.HTTP_KEEPALIVE_TIMEOUT_MS ?? 65_000,
  );
  // Siempre mayor que `keepAliveTimeout`, o Node cerraría la conexión antes de
  // considerar completas las cabeceras.
  server.headersTimeout = Number(process.env.HTTP_HEADERS_TIMEOUT_MS ?? 70_000);
  // Techo absoluto de una petición completa. Deliberadamente generoso: hay
  // endpoints legítimamente largos (generación de informes, expansión de
  // conjuntos de valores) y recortarlo a ciegas rompería funcionalidad real.
  // Acota el abuso, no el uso.
  server.requestTimeout = Number(
    process.env.HTTP_REQUEST_TIMEOUT_MS ?? 120_000,
  );
}

void bootstrap();
