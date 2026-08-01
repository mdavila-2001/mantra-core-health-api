import { ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { MikroORM } from '@mikro-orm/postgresql';
import type { INestApplication } from '@nestjs/common';
import pg from 'pg';
import { AppModule } from '../../src/app.module';
import { CONCEPTS, SEED, TokenService, createdBy } from '../../src/common';
import { Logger } from 'nestjs-pino';
import { Users, UserGlobalRoles } from '../../src/modules/iam/entities';
import {
  HttpDispatcherService,
  type OutboundDispatchResult,
} from '../../src/common';

/**
 * Vacía todos los datos de negocio antes de un arranque, dejando la base limpia
 * para que la corrida sea reproducible: sin esto, los recursos con constraints
 * de unicidad (p. ej. una farmacia por tenant, una política por recurso) chocan
 * en la segunda ejecución del smoke. El seed de conceptos/tenant/propósito y el
 * admin se rematerializan en el arranque, así que truncar es seguro.
 *
 * Trunca toda tabla de los esquemas de negocio (no del sistema) con CASCADE para
 * respetar las FK. Solo debe usarse contra la base de pruebas del `.env`.
 */
export async function resetBusinessData(): Promise<void> {
  const client = new pg.Client({
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5434),
    user: process.env.DB_USER ?? 'mantra',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME ?? 'mantra_redesa_health',
  });
  await client.connect();
  try {
    const { rows } = await client.query<{
      /**
       * Valor de qualified mantenido por la instancia.
       */
      qualified: string;
    }>(
      `select format('%I.%I', table_schema, table_name) as qualified
         from information_schema.tables
        where table_type = 'BASE TABLE'
          and table_schema not in ('pg_catalog', 'information_schema', 'public', 'pg_toast')
          and table_schema !~ '^_'
          and table_schema not in (
            'timescaledb_experimental',
            'timescaledb_information',
            'toolkit_experimental'
          )`,
    );
    if (rows.length > 0) {
      const list = rows.map((r) => r.qualified).join(', ');
      await client.query(`TRUNCATE ${list} RESTART IDENTITY CASCADE`);
    }
  } finally {
    await client.end();
  }
}

/**
 * Arranque de una instancia real de NestJS para las pruebas de integración.
 *
 * Levanta el `AppModule` completo -mismos guards, pipes y filtro que producción-
 * contra la base configurada en el entorno. Fija `ORM_SCHEMA_SYNC=off` porque el
 * esquema ya está materializado; el seed de conceptos corre solo vía
 * `OnApplicationBootstrap`. Además siembra un usuario administrador determinista
 * y devuelve su token para poder ejercer los endpoints protegidos.
 */
export interface TestContext {
  /**
   * Valor de app mantenido por la instancia.
   */
  app: INestApplication;
  /**
   * Valor de orm mantenido por la instancia.
   */
  orm: MikroORM;
  /**
   * Identificador asociado a admin user.
   */
  adminUserId: string;
  /**
   * Valor de admin token mantenido por la instancia.
   */
  adminToken: string;
  /** Token privilegiado sin membresías, reservado para pruebas fail-closed. */
  tenantlessAdminToken: string;
}

/** Id determinista del administrador de pruebas (FK válida para created_by). */
export const TEST_ADMIN_ID = '00000000-0000-4000-8000-000000000001';

/**
 * Ejecuta la operación bootstrap test app.
 *
 * @param opts - Valor de opts requerido por la operación.
 * @returns Resultado de bootstrap test app conforme al contrato `Promise<TestContext>`.
 */
export async function bootstrapTestApp(
  opts: {
    /**
     * Valor de reset mantenido por la instancia.
     */
    reset?: boolean;
    /** Sustituto determinista del transporte HTTP para pruebas de contrato. */
    httpDispatch?: (input: unknown) => Promise<OutboundDispatchResult>;
  } = {},
): Promise<TestContext> {
  process.env.ORM_SCHEMA_SYNC = process.env.ORM_SCHEMA_SYNC ?? 'off';
  // Las pruebas disparan muchas peticiones desde el mismo IP; sin esto el
  // ThrottlerGuard global las cortaría con 429.
  process.env.RATE_LIMIT_DISABLED = 'true';

  // Reset opcional (lo usa el smoke) para una corrida reproducible desde cero.
  if (opts.reset) {
    await resetBusinessData();
  }

  const builder = Test.createTestingModule({
    imports: [AppModule],
  });
  if (opts.httpDispatch) {
    builder.overrideProvider(HttpDispatcherService).useValue({
      post: opts.httpDispatch,
    });
  }
  const moduleRef = await builder.compile();

  const app = moduleRef.createNestApplication({ bufferLogs: true });
  // Mismo logger que producción (nestjs-pino). El filtro global de excepciones ya
  // está registrado como APP_FILTER en AppModule, así que no se vuelve a añadir.
  app.useLogger(app.get(Logger));
  app.flushLogs();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  await app.init();

  // Sin el parámetro de tipo explícito, `app.get` infiere el genérico con una
  // tupla `readonly` de entidades que no es asignable al `MikroORM` mutable que
  // declaran `TestApp.orm` y `seedAdmin`. Es varianza pura del contenedor, sin
  // efecto en runtime; fijar `TResult` lo resuelve sin recurrir a una aserción.
  const orm = app.get<MikroORM>(MikroORM);
  await seedAdmin(orm);

  const tokenService = app.get(TokenService);
  const adminToken = tokenService.signAccessToken(
    TEST_ADMIN_ID,
    'test-session',
    ['SUPERADMIN', 'SECURITY_ADMIN'],
    [SEED.tenantId],
  );
  const tenantlessAdminToken = tokenService.signAccessToken(
    TEST_ADMIN_ID,
    'test-session-tenantless',
    ['SUPERADMIN', 'SECURITY_ADMIN'],
  );

  return {
    app,
    orm,
    adminUserId: TEST_ADMIN_ID,
    adminToken,
    tenantlessAdminToken,
  };
}

/**
 * Materializa un administrador de seguridad determinista. Su id es una FK válida
 * para las columnas `created_by_user_id`/`recorded_by_user_id` que pueblan los
 * servicios, evitando violaciones de clave foránea al ejercer los endpoints.
 */
async function seedAdmin(orm: MikroORM): Promise<void> {
  const em = orm.em.fork();
  if (await em.findOne(Users, { id: TEST_ADMIN_ID })) {
    return;
  }
  em.create(
    Users,
    {
      id: TEST_ADMIN_ID,
      statusConceptId: CONCEPTS.USER_ACTIVE,
      displayName: 'Integration Test Admin',
      mfaStatusConceptId: CONCEPTS.MFA_DISABLED,
      emailVerified: true,
      phoneVerified: false,
      ...createdBy(),
    },
    { partial: true },
  );
  await em.flush();
  em.create(
    UserGlobalRoles,
    {
      userId: TEST_ADMIN_ID,
      roleConceptId: CONCEPTS.ROLE_SECURITY_ADMIN,
      stateConceptId: CONCEPTS.STATE_ACTIVE,
      ...createdBy(TEST_ADMIN_ID),
    },
    { partial: true },
  );
  await em.flush();
}

/** Authorization header helper. */
export function bearer(token: string): {
  /**
   * Valor de authorization mantenido por la instancia.
   */
  Authorization: string;
} {
  return { Authorization: `Bearer ${token}` };
}
