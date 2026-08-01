#!/usr/bin/env node
/**
 * bootstrap-admin.mjs — Siembra el primer SECURITY_ADMIN con contraseña.
 *
 * `POST /iam/users` exige rol SECURITY_ADMIN y el seed de arranque solo materializa terminología,
 * mensajería e identidad: sin esto no existe ningún administrador y desde Postman solo se pueden
 * ejercer los 13 endpoints públicos. El script abre un contexto Nest (sin servidor HTTP) y llama
 * al mismo `IamUsersService.createUser` que usa el controller, así que la credencial se hashea
 * con argon2id y el rol global queda registrado igual que por API — no escribe SQL a mano.
 *
 * Es idempotente: si el email ya tiene credencial activa, informa y sale sin tocar nada.
 *
 * Uso:  yarn build && yarn postman:bootstrap
 *       ADMIN_EMAIL=otro@dominio.test ADMIN_PASSWORD='…' yarn postman:bootstrap
 */
import { NestFactory } from '@nestjs/core';
import { MikroORM } from '@mikro-orm/postgresql';

const dist = (path) => new URL(`../../dist/src/${path}`, import.meta.url).href;

const { AppModule } = await import(dist('app.module.js'));
const { CONCEPTS, SEED, createdBy } = await import(dist('common/index.js'));
const { Users, UserGlobalRoles, AuthenticationCredentials } = await import(
  dist('modules/iam/entities/index.js')
);
const { TenantMemberships } = await import(dist('modules/directory/entities/index.js'));
const { DIR } = await import(dist('modules/directory/directory.concepts.js'));
const { IamUsersService } = await import(dist('modules/iam/services/iam-users.service.js'));

/** Actor determinista al que apuntan las columnas `created_by_user_id` del alta. */
const BOOTSTRAP_ACTOR_ID = '00000000-0000-0000-0000-0000000000a1';

const email = process.env.ADMIN_EMAIL ?? 'admin@redesa.test';
const password = process.env.ADMIN_PASSWORD ?? 'S3cret-passw0rd';

const ctx = await NestFactory.createApplicationContext(AppModule, {
  logger: ['error', 'warn'],
});

try {
  const orm = ctx.get(MikroORM);
  const em = orm.em.fork();

  // El alta escribe `created_by_user_id = actor.id`, que es FK a iam.users: el actor tiene que
  // existir antes. Se autorreferencia, igual que el admin del harness de integración.
  if (!(await em.findOne(Users, { id: BOOTSTRAP_ACTOR_ID }))) {
    em.create(
      Users,
      {
        id: BOOTSTRAP_ACTOR_ID,
        displayName: 'Bootstrap Postman',
        statusConceptId: CONCEPTS.USER_ACTIVE,
        mfaStatusConceptId: CONCEPTS.MFA_DISABLED,
        emailVerified: true,
        phoneVerified: false,
        ...createdBy(BOOTSTRAP_ACTOR_ID),
      },
      { partial: true },
    );
    await em.flush();
    console.log(`Actor de arranque creado: ${BOOTSTRAP_ACTOR_ID}`);
  }

  const users = ctx.get(IamUsersService);
  let adminId;
  try {
    const created = await users.createUser(
      {
        displayName: 'Administrador Postman',
        email,
        password,
        initialRole: 'SECURITY_ADMIN',
      },
      { id: BOOTSTRAP_ACTOR_ID, roles: ['SECURITY_ADMIN'] },
    );
    adminId = created.id;
    console.log(`Administrador creado: ${adminId}`);
  } catch (error) {
    if (error?.status !== 409) throw error;
    // Reejecución: la credencial ya existe, se reutiliza el usuario y se completan los pasos
    // que falten. El arranque tiene que converger, no abortar a medias.
    const credential = await em.findOne(AuthenticationCredentials, {
      externalSubject: email,
    });
    adminId = credential?.userId;
    if (!adminId) throw error;
    console.log(`Administrador ya existente: ${adminId}`);
  }

  // El JWT solo lleva `SUPERADMIN` si hay fila de rol global: es el único rol que puede declarar
  // `X-Tenant-Id` de cualquier tenant (PRIVILEGED_TENANT_ROLES en tenant-context.interceptor).
  const hasSuperadmin = await em.findOne(UserGlobalRoles, {
    userId: adminId,
    roleConceptId: CONCEPTS.ROLE_SUPERADMIN,
  });
  if (!hasSuperadmin) {
    em.create(
      UserGlobalRoles,
      {
        userId: adminId,
        roleConceptId: CONCEPTS.ROLE_SUPERADMIN,
        stateConceptId: CONCEPTS.STATE_ACTIVE,
        ...createdBy(BOOTSTRAP_ACTOR_ID),
      },
      { partial: true },
    );
    await em.flush();
    console.log('Rol global SUPERADMIN concedido.');
  }

  // Sin membresía activa el token viaja sin `tenants` y el interceptor responde 403
  // ("El actor no pertenece a ningún tenant"), aunque el login sí devuelva token.
  const hasMembership = await em.findOne(TenantMemberships, {
    userId: adminId,
    tenantId: SEED.tenantId,
  });
  if (!hasMembership) {
    em.create(
      TenantMemberships,
      {
        userId: adminId,
        tenantId: SEED.tenantId,
        tenantRoleConceptId: DIR.ROLE_STAFF,
        statusConceptId: DIR.MEMBERSHIP_ACTIVE,
        accessScopeConceptId: DIR.SCOPE_ALL_TENANT,
        startDate: new Date(),
        ...createdBy(BOOTSTRAP_ACTOR_ID),
      },
      { partial: true },
    );
    await em.flush();
    console.log(`Membresía creada en el tenant sembrado ${SEED.tenantId}.`);
  }

  console.log('\nListo para Postman.');
  console.log(`  email:    ${email}`);
  console.log(`  password: ${password}`);
  console.log(`  tenantId: ${SEED.tenantId}`);
  console.log('\nEntorno "SALUD Local" → `email`, `password` y `tenantId`,');
  console.log('luego «00 · Empezar aquí (sesión)» → POST /iam/auth/login.');
} catch (error) {
  console.error('Falló el arranque del administrador:', error?.message ?? error);
  process.exitCode = 1;
} finally {
  await ctx.close();
}
