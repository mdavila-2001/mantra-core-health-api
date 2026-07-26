import { ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { MikroORM } from '@mikro-orm/postgresql';
import type { INestApplication } from '@nestjs/common';
import pg from 'pg';
import { AppModule } from '../../src/app.module';
import { CONCEPTS, TokenService, createdBy } from '../../src/common';
import { Logger } from 'nestjs-pino';
import { Users, UserGlobalRoles } from '../../src/modules/iam/entities';
import {
  Persons,
  HealthPractitionerProfiles,
  SecretaryProfiles,
  PatientProfiles,
} from '../../src/modules/profiles/entities';
import { SpecialtyChartTemplates } from '../../src/modules/chart/entities';

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
    const { rows } = await client.query<{ qualified: string }>(
      `select format('%I.%I', table_schema, table_name) as qualified
         from information_schema.tables
        where table_type = 'BASE TABLE'
          and table_schema not in ('pg_catalog', 'information_schema', 'public', 'pg_toast')`,
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
  app: INestApplication;
  orm: MikroORM;
  adminUserId: string;
  adminToken: string;
  /** Fixtures cross-módulo: ids de subtipos de profiles y una plantilla de chart. */
  practitionerSubtypeId: string;
  secretaryProfileId: string;
  patientSubtypeId: string;
  chartTemplateId: string;
}

/** Id determinista del administrador de pruebas (FK válida para created_by). */
export const TEST_ADMIN_ID = '00000000-0000-4000-8000-000000000001';

/**
 * Ids deterministas de los fixtures cross-módulo. Los subtipos de profiles usan
 * `profile_id` (= id de la persona) como CLAVE PRIMARIA, así que el "id del
 * subtipo" es el id de la persona una vez existe la fila del subtipo.
 */
export const FIX = {
  practPerson: '00000000-0000-4000-8000-0000000f1001',
  secPerson: '00000000-0000-4000-8000-0000000f1003',
  patPerson: '00000000-0000-4000-8000-0000000f1005',
  chartTemplate: '00000000-0000-4000-8000-0000000f1007',
};

export async function bootstrapTestApp(
  opts: { reset?: boolean } = {},
): Promise<TestContext> {
  process.env.ORM_SCHEMA_SYNC = process.env.ORM_SCHEMA_SYNC ?? 'off';

  // Reset opcional (lo usa el smoke) para una corrida reproducible desde cero.
  if (opts.reset) {
    await resetBusinessData();
  }

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

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

  // `app.get(MikroORM)` infiere el genérico con una tupla `readonly` de entidades
  // que no es asignable al `MikroORM` mutable esperado; es una varianza puramente
  // de tipos del contenedor, sin efecto en runtime. Se afirma el tipo en la frontera.
  const orm = app.get(MikroORM) as unknown as MikroORM;
  await seedAdmin(orm);
  await seedFixtures(orm);

  const tokenService = app.get(TokenService);
  const adminToken = tokenService.signAccessToken(TEST_ADMIN_ID, 'test-session', [
    'SUPERADMIN',
    'SECURITY_ADMIN',
  ]);

  return {
    app,
    orm,
    adminUserId: TEST_ADMIN_ID,
    adminToken,
    practitionerSubtypeId: FIX.practPerson,
    secretaryProfileId: FIX.secPerson,
    patientSubtypeId: FIX.patPerson,
    chartTemplateId: FIX.chartTemplate,
  };
}

/**
 * Materializa fixtures cross-módulo que varios smokes necesitan como FK reales y
 * que ningún endpoint expone directamente: los subtipos de profiles
 * (`health_practitioner_profiles`, `secretary_profiles`, `patient_profiles`) van
 * sobre `persons`, y una plantilla de chart. Determinista e idempotente. Los
 * `*_concept_id` requeridos usan un concepto ya sembrado (`STATE_ACTIVE`).
 */
async function seedFixtures(orm: MikroORM): Promise<void> {
  const em = orm.em.fork();
  if (await em.findOne(HealthPractitionerProfiles, { profileId: FIX.practPerson })) {
    return;
  }
  const audit = createdBy(TEST_ADMIN_ID);
  const active = CONCEPTS.STATE_ACTIVE;

  // Personas base (padres de los subtipos; su id es la PK del subtipo).
  for (const personId of [FIX.practPerson, FIX.secPerson, FIX.patPerson]) {
    em.create(Persons, { id: personId, personStatusConceptId: active, ...audit }, { partial: true });
  }
  await em.flush();

  em.create(
    HealthPractitionerProfiles,
    {
      profileId: FIX.practPerson,
      practitionerCode: 'FIX-HP-1',
      practitionerCategoryConceptId: active,
      verificationStatusConceptId: active,
      practiceStatusConceptId: active,
      ...audit,
    },
    { partial: true },
  );
  em.create(SecretaryProfiles, { profileId: FIX.secPerson, ...audit }, { partial: true });
  em.create(
    PatientProfiles,
    { profileId: FIX.patPerson, patientCode: 'FIX-PAT-1', ...audit },
    { partial: true },
  );
  em.create(
    SpecialtyChartTemplates,
    {
      id: FIX.chartTemplate,
      specialtyConceptId: active,
      code: 'FIX-TPL-1',
      name: 'Fixture template',
      version: 1,
      statusConceptId: active,
      ...audit,
    },
    { partial: true },
  );
  await em.flush();
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
export function bearer(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}
