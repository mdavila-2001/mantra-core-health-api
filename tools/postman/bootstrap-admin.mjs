#!/usr/bin/env node
/**
 * bootstrap-admin.mjs — Siembra el primer SECURITY_ADMIN con contraseña.
 *
 * `POST /iam/users` exige rol SECURITY_ADMIN y una instalación nueva no tiene ninguno: sin esto
 * desde Postman sólo se pueden ejercer los endpoints públicos.
 *
 * La lógica vive en `BootstrapAdminSeedService` (`src/common/seed/`), que es también lo que corre
 * el arranque de la API cuando BOOTSTRAP_ADMIN_EMAIL y BOOTSTRAP_ADMIN_PASSWORD están definidas.
 * Este script es el mismo seed **disparado a mano**: no reimplementa nada, sólo abre un contexto
 * Nest (sin servidor HTTP) y lo invoca. Dos caminos con una sola implementación; si divergieran,
 * el administrador que crea Postman no sería el mismo que crea el despliegue.
 *
 * Es idempotente: converge sobre lo que ya exista en vez de abortar a medias.
 *
 * Uso:  yarn build && yarn postman:bootstrap
 *       ADMIN_EMAIL=otro@dominio.test ADMIN_PASSWORD='…' yarn postman:bootstrap
 */
import { NestFactory } from '@nestjs/core';

const dist = (path) => new URL(`../../dist/src/${path}`, import.meta.url).href;

const { AppModule } = await import(dist('app.module.js'));
const { SEED } = await import(dist('common/index.js'));
const { BootstrapAdminSeedService } = await import(
  dist('common/seed/bootstrap-admin-seed.service.js')
);

// Invocado a mano, el operador ya decidió: se acepta ADMIN_* además de BOOTSTRAP_ADMIN_*, y se
// autoriza producción, porque correr este script ES el permiso explícito que el seed automático
// pide por variable. Al arranque desatendido de la API esa autorización no se le regala.
// Buzón real por defecto (ver `tools/redesa/correos-reales.mjs`): con
// `@redesa.test` el correo de verificación no llegaba a ninguna parte.
const email =
  process.env.ADMIN_EMAIL ??
  process.env.BOOTSTRAP_ADMIN_EMAIL ??
  'cpacentropreparacionacademica@gmail.com';
const password =
  process.env.ADMIN_PASSWORD ?? process.env.BOOTSTRAP_ADMIN_PASSWORD ?? 'S3cret-passw0rd';

const ctx = await NestFactory.createApplicationContext(AppModule, {
  logger: ['error', 'warn'],
});

try {
  const seed = ctx.get(BootstrapAdminSeedService);
  const result = await seed.run({
    email,
    password,
    allowProduction: true,
    nodeEnv: process.env.NODE_ENV,
  });

  if (!result.provisioned) {
    console.error(`El seed no llegó a sembrar (motivo: ${result.skipped}).`);
    process.exitCode = 1;
  } else {
    console.log(`Administrador disponible: ${result.userId}`);
    console.log('\nListo para Postman.');
    console.log(`  email:    ${email}`);
    console.log(`  password: ${password}`);
    console.log(`  tenantId: ${SEED.tenantId}`);
    console.log('\nEntorno "SALUD Local" → `email`, `password` y `tenantId`,');
    console.log('luego «00 · Empezar aquí (sesión)» → POST /iam/auth/login.');
  }
} catch (error) {
  console.error('Falló el arranque del administrador:', error?.message ?? error);
  process.exitCode = 1;
} finally {
  await ctx.close();
}
