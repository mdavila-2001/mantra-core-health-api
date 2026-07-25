import { ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { MikroORM } from '@mikro-orm/postgresql';
import type { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { CONCEPTS, TokenService, createdBy } from '../../src/common';
import { Logger } from 'nestjs-pino';
import { Users, UserGlobalRoles } from '../../src/modules/iam/entities';

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
}

/** Id determinista del administrador de pruebas (FK válida para created_by). */
export const TEST_ADMIN_ID = '00000000-0000-4000-8000-000000000001';

export async function bootstrapTestApp(): Promise<TestContext> {
  process.env.ORM_SCHEMA_SYNC = process.env.ORM_SCHEMA_SYNC ?? 'off';

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

  const tokenService = app.get(TokenService);
  const adminToken = tokenService.signAccessToken(TEST_ADMIN_ID, 'test-session', [
    'SUPERADMIN',
    'SECURITY_ADMIN',
  ]);

  return { app, orm, adminUserId: TEST_ADMIN_ID, adminToken };
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
