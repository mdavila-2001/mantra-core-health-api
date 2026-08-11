import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import type { Server } from 'node:http';
import { MikroORM } from '@mikro-orm/postgresql';
import { bootstrapTestApp, type TestContext } from '../integration/harness';
import { CatalogConcepts } from '../../src/modules/terminology/entities';
import { SEED } from '../../src/common';
import { ALL_SMOKE } from './registry';
import type { SmokeCase, SmokeCtx } from './smoke-kit';

/**
 * Smoke test de los 30 endpoints implementados (IAM 12, Common 11, Terminology 7).
 *
 * Para cada endpoint ejercita un caso "feliz" con datos de prueba completos y uno
 * o más casos límite (sin autenticación, validación de entrada, recurso
 * inexistente, conflicto/duplicado, UUID inválido). Cada resultado se registra y,
 * al finalizar, se vuelca a `output.smoke.test.json` y `output.smoke.test.csv` en
 * la raíz del repositorio. No sustituye a las pruebas de integración; es una
 * batería rápida de verificación de contrato sobre la aplicación real.
 */

interface CaseResult {
  /**
   * Valor de module mantenido por la instancia.
   */
  module: string;
  /**
   * Valor de endpoint mantenido por la instancia.
   */
  endpoint: string;
  /**
   * Valor de test case mantenido por la instancia.
   */
  testCase: string;
  /**
   * Valor de method mantenido por la instancia.
   */
  method: string;
  /**
   * Valor de path mantenido por la instancia.
   */
  path: string;
  /**
   * Valor de expected status mantenido por la instancia.
   */
  expectedStatus: number;
  /**
   * Valor de actual status mantenido por la instancia.
   */
  actualStatus: number;
  /**
   * Valor de pass mantenido por la instancia.
   */
  pass: boolean;
  /**
   * Valor de error code mantenido por la instancia.
   */
  errorCode: string | null;
  /**
   * Valor de duration ms mantenido por la instancia.
   */
  durationMs: number;
  /**
   * Valor de note mantenido por la instancia.
   */
  note: string;
}

const results: CaseResult[] = [];
const UUID_ABSENT = '00000000-0000-4000-8000-0000000000ff';
const UUID_BAD = 'not-a-uuid';

/** Resume el error HTTP en el reporte sin volcar cuerpos completos o secretos. */
function responseMessage(body: unknown): string {
  if (typeof body !== 'object' || body === null) return String(body ?? '');
  const message = (body as Record<string, unknown>).message;
  const details = (body as Record<string, unknown>).details;
  const serialized = Array.isArray(message)
    ? message.map(String).join('; ')
    : typeof message === 'string'
      ? message
      : '';
  const serializedDetails =
    details === undefined ? '' : JSON.stringify(details);
  const combined = [
    serialized ? `mensaje=${serialized}` : '',
    serializedDetails ? `detalles=${serializedDetails}` : '',
  ]
    .filter(Boolean)
    .join('; ');
  return combined ? `; ${combined.slice(0, 500)}` : '';
}

describe('Smoke test — 30 endpoints', () => {
  let ctx: TestContext;
  let orm: MikroORM;
  let server: Server;

  beforeAll(async () => {
    // reset: parte de una base limpia para que el smoke sea reproducible entre
    // corridas (evita colisiones de unicidad por datos acumulados).
    ctx = await bootstrapTestApp({
      reset: true,
      httpDispatch: async () => ({
        ok: false,
        httpStatus: 503,
        latencyMs: 1,
        signature: 'smoke-signature',
        responseBody: { error: 'deterministic smoke transport' },
        errorText: 'deterministic smoke transport',
      }),
    });
    orm = ctx.orm;
    server = ctx.app.getHttpServer();
  });

  afterAll(async () => {
    writeReports();
    await ctx.app.close();
  });

  /** Ejecuta un caso y registra su resultado sin abortar la batería ante un fallo. */
  async function runCase(
    module: string,
    endpoint: string,
    testCase: string,
    method: 'post' | 'delete' | 'get' | 'patch',
    path: string,
    opts: {
      /**
       * Valor de body mantenido por la instancia.
       */
      body?: unknown;
      /**
       * Valor de token mantenido por la instancia.
       */
      token?: string;
      /**
       * Valor de expected status mantenido por la instancia.
       */
      expectedStatus: number;
      /**
       * Valor de expected code mantenido por la instancia.
       */
      expectedCode?: string;
    },
  ): Promise<request.Response | null> {
    const started = Date.now();
    try {
      let req = request(server)[method](path);
      req = req.timeout({ response: 10_000, deadline: 15_000 });
      if (opts.token) req = req.set('Authorization', `Bearer ${opts.token}`);
      if (opts.body !== undefined) req = req.send(opts.body as object);
      const res = await req;
      const durationMs = Date.now() - started;
      const codeOk = opts.expectedCode
        ? res.body?.code === opts.expectedCode
        : true;
      const pass = res.status === opts.expectedStatus && codeOk;
      results.push({
        module,
        endpoint,
        testCase,
        method: method.toUpperCase(),
        path,
        expectedStatus: opts.expectedStatus,
        actualStatus: res.status,
        pass,
        errorCode: res.body?.code ?? null,
        durationMs,
        note: pass
          ? ''
          : `esperaba ${opts.expectedStatus}${opts.expectedCode ? '/' + opts.expectedCode : ''}, recibió ${res.status}/${res.body?.code ?? '-'}${responseMessage(res.body)}`,
      });
      return res;
    } catch (error) {
      results.push({
        module,
        endpoint,
        testCase,
        method: method.toUpperCase(),
        path,
        expectedStatus: opts.expectedStatus,
        actualStatus: 0,
        pass: false,
        errorCode: null,
        durationMs: Date.now() - started,
        note: `excepción: ${error instanceof Error ? error.message : String(error)}`,
      });
      return null;
    }
  }

  /** Ejecuta un `SmokeCase` del registro (módulos 04+) compartiendo `ctx.vars`. */
  async function runRegistryCase(
    smokeCtx: SmokeCtx,
    c: SmokeCase,
  ): Promise<void> {
    const started = Date.now();
    let path = '<setup pendiente>';
    try {
      if (c.setup) await c.setup(smokeCtx);
      path = c.path(smokeCtx);
      let req = request(server)[c.method](path);
      req = req.timeout({ response: 10_000, deadline: 15_000 });
      if (c.auth !== false) {
        // `c.token` deja que el caso actúe como el titular (paciente, profesional) en vez del
        // admin: los endpoints `/me` resuelven de quién son los datos leyendo el JWT.
        const token = c.token?.(smokeCtx) ?? smokeCtx.adminToken;
        req = req.set('Authorization', `Bearer ${token}`);
      }
      if (c.body) req = req.send(c.body(smokeCtx) as object);
      const res = await req;
      const durationMs = Date.now() - started;
      const codeOk = c.expectedCode ? res.body?.code === c.expectedCode : true;
      const pass = res.status === c.expectedStatus && codeOk;
      if (pass && c.capture && res.body) c.capture(res.body, smokeCtx);
      results.push({
        module: c.module,
        endpoint: c.endpoint,
        testCase: c.name,
        method: c.method.toUpperCase(),
        path,
        expectedStatus: c.expectedStatus,
        actualStatus: res.status,
        pass,
        errorCode: res.body?.code ?? null,
        durationMs,
        note: pass
          ? ''
          : `esperaba ${c.expectedStatus}${c.expectedCode ? '/' + c.expectedCode : ''}, recibió ${res.status}/${res.body?.code ?? '-'}${responseMessage(res.body)}`,
      });
    } catch (error) {
      results.push({
        module: c.module,
        endpoint: c.endpoint,
        testCase: c.name,
        method: c.method.toUpperCase(),
        path,
        expectedStatus: c.expectedStatus,
        actualStatus: 0,
        pass: false,
        errorCode: null,
        durationMs: Date.now() - started,
        note: `excepción: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }

  it('ejercita los 30 endpoints con casos felices y límite', async () => {
    const u = Date.now();
    const admin = ctx.adminToken;
    /**
     * Ejecuta la operación b.
     *
     * @param t - Valor de t requerido por la operación.
     * @returns Resultado de b.
     */
    const B = (t?: string) => ({ token: t });

    // ------------------------------------------------------------------
    // IAM
    // ------------------------------------------------------------------
    const mainEmail = `smoke-main-${u}@example.com`;
    const password = 'Str0ng-Passw0rd!';

    // UC-01-01 crear usuario
    const created = await runCase(
      'IAM',
      'POST /iam/users',
      'happy: datos completos',
      'post',
      '/iam/users',
      {
        token: admin,
        body: {
          displayName: 'Smoke Main',
          email: mainEmail,
          password,
          timeZone: 'America/Lima',
          initialRole: 'USER',
        },
        expectedStatus: 201,
      },
    );
    const mainUserId: string = created?.body?.id ?? UUID_ABSENT;
    await runCase(
      'IAM',
      'POST /iam/users',
      'límite: sin autenticación',
      'post',
      '/iam/users',
      {
        body: { displayName: 'x', email: `x-${u}@e.com`, password },
        expectedStatus: 401,
      },
    );
    await runCase(
      'IAM',
      'POST /iam/users',
      'límite: body inválido (falta email/password)',
      'post',
      '/iam/users',
      {
        token: admin,
        body: { displayName: 'x' },
        expectedStatus: 400,
      },
    );
    await runCase(
      'IAM',
      'POST /iam/users',
      'límite: email duplicado',
      'post',
      '/iam/users',
      {
        token: admin,
        body: { displayName: 'dup', email: mainEmail, password },
        expectedStatus: 409,
        expectedCode: 'CONFLICT',
      },
    );

    // Usuario "víctima" para operaciones destructivas.
    const victimEmail = `smoke-victim-${u}@example.com`;
    const victim = await runCase(
      'IAM',
      'POST /iam/users',
      'happy: segundo usuario (destructivo)',
      'post',
      '/iam/users',
      {
        token: admin,
        body: {
          displayName: 'Smoke Victim',
          email: victimEmail,
          password,
          initialRole: 'USER',
        },
        expectedStatus: 201,
      },
    );
    const victimUserId: string = victim?.body?.id ?? UUID_ABSENT;

    // UC-01-04 login
    const login = await runCase(
      'IAM',
      'POST /iam/auth/login',
      'happy: credenciales válidas',
      'post',
      '/iam/auth/login',
      {
        body: { email: mainEmail, password },
        expectedStatus: 200,
      },
    );
    const mainRefresh: string = login?.body?.refreshToken ?? '';
    await runCase(
      'IAM',
      'POST /iam/auth/login',
      'límite: contraseña incorrecta',
      'post',
      '/iam/auth/login',
      {
        body: { email: mainEmail, password: 'wrong-pass' },
        expectedStatus: 401,
      },
    );
    await runCase(
      'IAM',
      'POST /iam/auth/login',
      'límite: body inválido (falta password)',
      'post',
      '/iam/auth/login',
      {
        body: { email: mainEmail },
        expectedStatus: 400,
      },
    );
    await runCase(
      'IAM',
      'POST /iam/auth/login',
      'límite: email inexistente',
      'post',
      '/iam/auth/login',
      {
        body: { email: `nope-${u}@e.com`, password },
        expectedStatus: 401,
      },
    );

    // UC-01-02 credencial federada
    const fed = await runCase(
      'IAM',
      'POST /iam/users/:id/credentials/federated',
      'happy: vincula OIDC',
      'post',
      `/iam/users/${victimUserId}/credentials/federated`,
      {
        token: admin,
        body: {
          identityProvider: 'google',
          externalSubject: `google|${victimUserId}`,
        },
        expectedStatus: 201,
      },
    );
    const victimCredentialId: string = fed?.body?.id ?? UUID_ABSENT;
    await runCase(
      'IAM',
      'POST /iam/users/:id/credentials/federated',
      'límite: usuario inexistente',
      'post',
      `/iam/users/${UUID_ABSENT}/credentials/federated`,
      {
        token: admin,
        body: {
          identityProvider: 'google',
          externalSubject: `google|ghost-${u}`,
        },
        expectedStatus: 404,
      },
    );
    await runCase(
      'IAM',
      'POST /iam/users/:id/credentials/federated',
      'límite: UUID inválido',
      'post',
      `/iam/users/${UUID_BAD}/credentials/federated`,
      {
        token: admin,
        body: { identityProvider: 'google', externalSubject: 'x' },
        expectedStatus: 400,
      },
    );

    // UC-01-03 MFA
    await runCase(
      'IAM',
      'POST /iam/users/:id/mfa-factors',
      'happy: inscribe TOTP',
      'post',
      `/iam/users/${mainUserId}/mfa-factors`,
      {
        token: admin,
        body: { factorType: 'TOTP', label: 'Authenticator' },
        expectedStatus: 201,
      },
    );
    await runCase(
      'IAM',
      'POST /iam/users/:id/mfa-factors',
      'límite: factorType inválido',
      'post',
      `/iam/users/${mainUserId}/mfa-factors`,
      {
        token: admin,
        body: { factorType: 'CARRIER_PIGEON' },
        expectedStatus: 400,
      },
    );
    await runCase(
      'IAM',
      'POST /iam/users/:id/mfa-factors',
      'límite: sin autenticación',
      'post',
      `/iam/users/${mainUserId}/mfa-factors`,
      {
        body: { factorType: 'TOTP' },
        expectedStatus: 401,
      },
    );

    // UC-01-05 dispositivo
    await runCase(
      'IAM',
      'POST /iam/users/:id/devices',
      'happy: dispositivo de confianza',
      'post',
      `/iam/users/${mainUserId}/devices`,
      {
        token: admin,
        body: {
          deviceFingerprint: `fp-${u}`,
          platform: 'WEB',
          name: 'Chrome',
          trust: true,
        },
        expectedStatus: 201,
      },
    );
    await runCase(
      'IAM',
      'POST /iam/users/:id/devices',
      'límite: sin autenticación',
      'post',
      `/iam/users/${mainUserId}/devices`,
      {
        body: { deviceFingerprint: `fp2-${u}` },
        expectedStatus: 401,
      },
    );

    // UC-01-06 refresh
    await runCase(
      'IAM',
      'POST /iam/auth/token/refresh',
      'happy: rota el token',
      'post',
      '/iam/auth/token/refresh',
      {
        body: { refreshToken: mainRefresh },
        expectedStatus: 200,
      },
    );
    await runCase(
      'IAM',
      'POST /iam/auth/token/refresh',
      'límite: reuso del token rotado',
      'post',
      '/iam/auth/token/refresh',
      {
        body: { refreshToken: mainRefresh },
        expectedStatus: 401,
      },
    );
    await runCase(
      'IAM',
      'POST /iam/auth/token/refresh',
      'límite: token inexistente',
      'post',
      '/iam/auth/token/refresh',
      {
        body: { refreshToken: randomUUID() },
        expectedStatus: 401,
      },
    );

    // UC-01-10 roles globales (sobre víctima)
    await runCase(
      'IAM',
      'POST /iam/users/:id/global-roles',
      'happy: concede rol',
      'post',
      `/iam/users/${victimUserId}/global-roles`,
      {
        token: admin,
        body: { role: 'SECURITY_ADMIN', action: 'GRANT' },
        expectedStatus: 200,
      },
    );
    await runCase(
      'IAM',
      'POST /iam/users/:id/global-roles',
      'límite: rol inválido',
      'post',
      `/iam/users/${victimUserId}/global-roles`,
      {
        token: admin,
        body: { role: 'WIZARD', action: 'GRANT' },
        expectedStatus: 400,
      },
    );

    // UC-01-09 revocar credencial (sobre víctima)
    await runCase(
      'IAM',
      'POST /iam/users/:id/credentials/:cid/revoke',
      'happy: revoca credencial',
      'post',
      `/iam/users/${victimUserId}/credentials/${victimCredentialId}/revoke`,
      {
        token: admin,
        expectedStatus: 200,
      },
    );
    await runCase(
      'IAM',
      'POST /iam/users/:id/credentials/:cid/revoke',
      'límite: credencial inexistente',
      'post',
      `/iam/users/${victimUserId}/credentials/${UUID_ABSENT}/revoke`,
      {
        token: admin,
        expectedStatus: 404,
      },
    );

    // UC-01-11 purga de sesiones
    await runCase(
      'IAM',
      'POST /iam/auth/sessions/purge',
      'happy: purga expiradas',
      'post',
      '/iam/auth/sessions/purge',
      {
        token: admin,
        expectedStatus: 200,
      },
    );
    await runCase(
      'IAM',
      'POST /iam/auth/sessions/purge',
      'límite: sin autenticación',
      'post',
      '/iam/auth/sessions/purge',
      {
        expectedStatus: 401,
      },
    );

    // UC-01-07 bloqueo (sobre víctima)
    await runCase(
      'IAM',
      'POST /iam/users/:id/lock',
      'happy: bloquea cuenta',
      'post',
      `/iam/users/${victimUserId}/lock`,
      {
        token: admin,
        body: { reason: 'smoke test' },
        expectedStatus: 200,
      },
    );
    await runCase(
      'IAM',
      'POST /iam/users/:id/lock',
      'límite: usuario inexistente',
      'post',
      `/iam/users/${UUID_ABSENT}/lock`,
      {
        token: admin,
        body: { reason: 'x' },
        expectedStatus: 404,
      },
    );

    // UC-01-12 anonimización (sobre víctima)
    await runCase(
      'IAM',
      'POST /iam/users/:id/anonymize',
      'happy: DSAR',
      'post',
      `/iam/users/${victimUserId}/anonymize`,
      {
        token: admin,
        expectedStatus: 200,
      },
    );
    await runCase(
      'IAM',
      'POST /iam/users/:id/anonymize',
      'límite: usuario inexistente',
      'post',
      `/iam/users/${UUID_ABSENT}/anonymize`,
      {
        token: admin,
        expectedStatus: 404,
      },
    );

    // UC-01-08 logout global (admin, al final para no invalidar la sesión antes)
    await runCase(
      'IAM',
      'POST /iam/auth/logout-all',
      'happy: cierra todas las sesiones',
      'post',
      '/iam/auth/logout-all',
      {
        token: admin,
        expectedStatus: 200,
      },
    );
    await runCase(
      'IAM',
      'POST /iam/auth/logout-all',
      'límite: sin autenticación',
      'post',
      '/iam/auth/logout-all',
      {
        expectedStatus: 401,
      },
    );

    // ------------------------------------------------------------------
    // COMMON
    // ------------------------------------------------------------------
    const owner = { ownerType: 'USER', ownerId: ctx.adminUserId };

    // UC-02-01 identificador
    await runCase(
      'Common',
      'POST /common/identifiers',
      'happy: identificador oficial',
      'post',
      '/common/identifiers',
      {
        token: admin,
        body: {
          ...owner,
          type: 'NATIONAL_ID',
          system: `urn:pe:dni:${u}`,
          value: '12345678',
          use: 'OFFICIAL',
        },
        expectedStatus: 201,
      },
    );
    await runCase(
      'Common',
      'POST /common/identifiers',
      'límite: duplicado',
      'post',
      '/common/identifiers',
      {
        token: admin,
        body: {
          ...owner,
          type: 'NATIONAL_ID',
          system: `urn:pe:dni:${u}`,
          value: '12345678',
        },
        expectedStatus: 409,
        expectedCode: 'CONFLICT',
      },
    );
    await runCase(
      'Common',
      'POST /common/identifiers',
      'límite: sin autenticación',
      'post',
      '/common/identifiers',
      {
        body: { ...owner, type: 'MRN', value: 'x' },
        expectedStatus: 401,
      },
    );

    // UC-02-02 contacto
    const cp = await runCase(
      'Common',
      'POST /common/contact-points',
      'happy: email',
      'post',
      '/common/contact-points',
      {
        token: admin,
        body: {
          ...owner,
          system: 'EMAIL',
          value: `c-${u}@example.com`,
          use: 'HOME',
        },
        expectedStatus: 201,
      },
    );
    const contactPointId: string = cp?.body?.id ?? UUID_ABSENT;
    await runCase(
      'Common',
      'POST /common/contact-points',
      'límite: body inválido (sin value)',
      'post',
      '/common/contact-points',
      {
        token: admin,
        body: { ...owner, system: 'EMAIL' },
        expectedStatus: 400,
      },
    );

    // UC-02-03 verificar contacto
    await runCase(
      'Common',
      'POST /common/contact-points/:id/verify',
      'happy: verifica',
      'post',
      `/common/contact-points/${contactPointId}/verify`,
      {
        token: admin,
        body: { code: '123456' },
        expectedStatus: 200,
      },
    );
    await runCase(
      'Common',
      'POST /common/contact-points/:id/verify',
      'límite: inexistente',
      'post',
      `/common/contact-points/${UUID_ABSENT}/verify`,
      {
        token: admin,
        body: { code: '123456' },
        expectedStatus: 404,
      },
    );

    // UC-02-04 dirección
    await runCase(
      'Common',
      'POST /common/addresses',
      'happy: dirección completa',
      'post',
      '/common/addresses',
      {
        token: admin,
        body: {
          ...owner,
          lines: ['Av. Siempre Viva 742'],
          city: 'Lima',
          postalCode: '15001',
          country: 'PE',
        },
        expectedStatus: 201,
      },
    );
    await runCase(
      'Common',
      'POST /common/addresses',
      'límite: sin autenticación',
      'post',
      '/common/addresses',
      {
        body: { ...owner, lines: ['x'] },
        expectedStatus: 401,
      },
    );

    // UC-02-05 archivo
    const file = await runCase(
      'Common',
      'POST /common/files',
      'happy: sube archivo + v1',
      'post',
      '/common/files',
      {
        token: admin,
        body: {
          originalName: 'report.pdf',
          category: 'DOCUMENT',
          sensitivity: 'PHI',
          mimeType: 'application/pdf',
          sizeBytes: 20480,
          contentHash: 'a'.repeat(64),
          storageUri: `s3://bucket/r-${u}.pdf`,
        },
        expectedStatus: 201,
      },
    );
    const fileId: string = file?.body?.id ?? UUID_ABSENT;
    const versionId: string = file?.body?.currentVersionId ?? UUID_ABSENT;
    await runCase(
      'Common',
      'POST /common/files',
      'límite: body inválido (sin mimeType)',
      'post',
      '/common/files',
      {
        token: admin,
        body: {
          originalName: 'x',
          category: 'DOCUMENT',
          sensitivity: 'NORMAL',
          sizeBytes: 1,
          contentHash: 'a'.repeat(64),
          storageUri: 's3://x',
        },
        expectedStatus: 400,
      },
    );

    // UC-02-09 escaneo (interno)
    await runCase(
      'Common',
      'POST /internal/files/versions/:vid/scan-result',
      'happy: CLEAN',
      'post',
      `/internal/files/versions/${versionId}/scan-result`,
      {
        token: admin,
        body: { result: 'CLEAN' },
        expectedStatus: 200,
      },
    );
    await runCase(
      'Common',
      'POST /internal/files/versions/:vid/scan-result',
      'límite: versión inexistente',
      'post',
      `/internal/files/versions/${UUID_ABSENT}/scan-result`,
      {
        token: admin,
        body: { result: 'CLEAN' },
        expectedStatus: 404,
      },
    );

    // UC-02-07 derivado (requiere versión limpia)
    await runCase(
      'Common',
      'POST /common/files/:id/versions/:vid/derivatives',
      'happy: thumbnail desde versión limpia',
      'post',
      `/common/files/${fileId}/versions/${versionId}/derivatives`,
      {
        token: admin,
        body: {
          derivativeType: 'THUMBNAIL',
          storageUri: `s3://bucket/thumb-${u}.png`,
          mimeType: 'image/png',
          sizeBytes: 2048,
          contentHash: 'c'.repeat(64),
        },
        expectedStatus: 201,
      },
    );

    // UC-02-08 vínculo
    await runCase(
      'Common',
      'POST /common/files/:id/links',
      'happy: vincula a entidad',
      'post',
      `/common/files/${fileId}/links`,
      {
        token: admin,
        body: {
          ownerType: 'PATIENT',
          ownerId: ctx.adminUserId,
          linkRole: 'ATTACHMENT',
          visibility: 'INTERNAL',
        },
        expectedStatus: 201,
      },
    );
    await runCase(
      'Common',
      'POST /common/files/:id/links',
      'límite: archivo inexistente',
      'post',
      `/common/files/${UUID_ABSENT}/links`,
      {
        token: admin,
        body: { ownerType: 'PATIENT', ownerId: ctx.adminUserId },
        expectedStatus: 404,
      },
    );

    // UC-02-11 URL firmada (versión actual limpia)
    await runCase(
      'Common',
      'POST /common/files/:id/download-url',
      'happy: URL firmada',
      'post',
      `/common/files/${fileId}/download-url`,
      {
        token: admin,
        expectedStatus: 201,
      },
    );

    // UC-02-06 nueva versión
    await runCase(
      'Common',
      'POST /common/files/:id/versions',
      'happy: nueva versión',
      'post',
      `/common/files/${fileId}/versions`,
      {
        token: admin,
        body: {
          mimeType: 'application/pdf',
          sizeBytes: 20500,
          contentHash: 'b'.repeat(64),
          storageUri: `s3://bucket/r2-${u}.pdf`,
        },
        expectedStatus: 201,
      },
    );
    await runCase(
      'Common',
      'POST /common/files/:id/versions',
      'límite: archivo inexistente',
      'post',
      `/common/files/${UUID_ABSENT}/versions`,
      {
        token: admin,
        body: {
          mimeType: 'application/pdf',
          sizeBytes: 1,
          contentHash: 'b'.repeat(64),
          storageUri: 's3://x',
        },
        expectedStatus: 404,
      },
    );

    // UC-02-10 borrado lógico
    await runCase(
      'Common',
      'DELETE /common/files/:id',
      'happy: soft-delete',
      'delete',
      `/common/files/${fileId}`,
      {
        token: admin,
        expectedStatus: 200,
      },
    );
    await runCase(
      'Common',
      'DELETE /common/files/:id',
      'límite: inexistente',
      'delete',
      `/common/files/${UUID_ABSENT}`,
      {
        token: admin,
        expectedStatus: 404,
      },
    );

    // ------------------------------------------------------------------
    // TERMINOLOGY
    // ------------------------------------------------------------------
    const cs = await runCase(
      'Terminology',
      'POST /terminology/code-systems',
      'happy: code system',
      'post',
      '/terminology/code-systems',
      {
        token: admin,
        body: {
          internalCode: `icd10-${u}`,
          name: 'ICD-10 Local',
          canonicalUrl: `http://x/icd10/${u}`,
          sourceCode: `WHO-${u}`,
          sourceName: 'WHO',
        },
        expectedStatus: 201,
      },
    );
    const codeSystemId: string = cs?.body?.id ?? UUID_ABSENT;
    await runCase(
      'Terminology',
      'POST /terminology/code-systems',
      'límite: internalCode duplicado',
      'post',
      '/terminology/code-systems',
      {
        token: admin,
        body: {
          internalCode: `icd10-${u}`,
          name: 'dup',
          canonicalUrl: 'http://y',
          sourceCode: 'WHO',
          sourceName: 'WHO',
        },
        expectedStatus: 409,
        expectedCode: 'CONFLICT',
      },
    );
    await runCase(
      'Terminology',
      'POST /terminology/code-systems',
      'límite: sin autenticación',
      'post',
      '/terminology/code-systems',
      {
        body: {
          internalCode: 'x',
          name: 'x',
          canonicalUrl: 'x',
          sourceCode: 'x',
          sourceName: 'x',
        },
        expectedStatus: 401,
      },
    );

    const ver = await runCase(
      'Terminology',
      'POST /terminology/code-systems/:id/versions',
      'happy: versión DRAFT',
      'post',
      `/terminology/code-systems/${codeSystemId}/versions`,
      {
        token: admin,
        body: { version: '2024', isDefault: true },
        expectedStatus: 201,
      },
    );
    const versionTermId: string = ver?.body?.id ?? UUID_ABSENT;
    await runCase(
      'Terminology',
      'POST /terminology/code-systems/:id/versions',
      'límite: code system inexistente',
      'post',
      `/terminology/code-systems/${UUID_ABSENT}/versions`,
      {
        token: admin,
        body: { version: '2024' },
        expectedStatus: 404,
      },
    );

    await runCase(
      'Terminology',
      'POST /terminology/versions/:versionId/import',
      'happy: import batch',
      'post',
      `/terminology/versions/${versionTermId}/import`,
      {
        token: admin,
        body: {
          concepts: [
            { code: 'A00', display: 'Cholera' },
            { code: 'A01', display: 'Typhoid fever' },
          ],
        },
        expectedStatus: 201,
      },
    );
    await runCase(
      'Terminology',
      'POST /terminology/versions/:versionId/import',
      'límite: body inválido (concepts vacío)',
      'post',
      `/terminology/versions/${versionTermId}/import`,
      {
        token: admin,
        body: { concepts: [] },
        expectedStatus: 400,
      },
    );

    // Recuperar ids de concepto persistidos.
    const em = orm.em.fork();
    const concepts = await em.find(CatalogConcepts, {
      codeSystemVersionId: versionTermId,
    });
    const conceptA = concepts.find((c) => c.code === 'A00')?.id ?? UUID_ABSENT;
    const conceptB = concepts.find((c) => c.code === 'A01')?.id ?? UUID_ABSENT;

    await runCase(
      'Terminology',
      'POST /terminology/versions/:versionId/publish',
      'happy: DRAFT -> ACTIVE',
      'post',
      `/terminology/versions/${versionTermId}/publish`,
      {
        token: admin,
        expectedStatus: 200,
      },
    );
    await runCase(
      'Terminology',
      'POST /terminology/versions/:versionId/publish',
      'límite: re-publicar versión activa',
      'post',
      `/terminology/versions/${versionTermId}/publish`,
      {
        token: admin,
        expectedStatus: 409,
      },
    );

    await runCase(
      'Terminology',
      'POST /terminology/concepts/:conceptId/designations',
      'happy: designación preferida',
      'post',
      `/terminology/concepts/${conceptA}/designations`,
      {
        token: admin,
        body: {
          value: 'Cólera',
          language: 'ES',
          designationType: 'PREFERRED',
          preferred: true,
        },
        expectedStatus: 201,
      },
    );
    await runCase(
      'Terminology',
      'POST /terminology/concepts/:conceptId/designations',
      'límite: concepto inexistente',
      'post',
      `/terminology/concepts/${UUID_ABSENT}/designations`,
      {
        token: admin,
        body: { value: 'x' },
        expectedStatus: 404,
      },
    );

    await runCase(
      'Terminology',
      'POST /terminology/concepts/:conceptId/relationships',
      'happy: IS_A',
      'post',
      `/terminology/concepts/${conceptA}/relationships`,
      {
        token: admin,
        body: { targetConceptId: conceptB, relationshipType: 'IS_A' },
        expectedStatus: 201,
      },
    );
    await runCase(
      'Terminology',
      'POST /terminology/concepts/:conceptId/relationships',
      'límite: target inexistente',
      'post',
      `/terminology/concepts/${conceptA}/relationships`,
      {
        token: admin,
        body: { targetConceptId: UUID_ABSENT, relationshipType: 'IS_A' },
        expectedStatus: 404,
      },
    );

    await runCase(
      'Terminology',
      'POST /terminology/value-sets',
      'happy: value set con reglas',
      'post',
      '/terminology/value-sets',
      {
        token: admin,
        body: {
          internalCode: `vs-${u}`,
          name: 'Infectious',
          canonicalUrl: `http://x/vs/${u}`,
          rules: [
            {
              codeSystemId,
              operator: 'IS_A',
              property: 'concept',
              value: 'A00',
              included: true,
            },
          ],
        },
        expectedStatus: 201,
      },
    );
    await runCase(
      'Terminology',
      'POST /terminology/value-sets',
      'límite: internalCode duplicado',
      'post',
      '/terminology/value-sets',
      {
        token: admin,
        body: {
          internalCode: `vs-${u}`,
          name: 'dup',
          canonicalUrl: 'http://y',
        },
        expectedStatus: 409,
        expectedCode: 'CONFLICT',
      },
    );

    // ------------------------------------------------------------------
    // Módulos adicionales (04+): registro de casos aportado por cada módulo.
    // ------------------------------------------------------------------
    const smokeCtx: SmokeCtx = {
      server,
      orm,
      adminToken: admin,
      adminUserId: ctx.adminUserId,
      tenantId: SEED.tenantId,
      practitionerSubtypeId: ctx.practitionerSubtypeId,
      secretaryProfileId: ctx.secretaryProfileId,
      patientSubtypeId: ctx.patientSubtypeId,
      chartTemplateId: ctx.chartTemplateId,
      vars: {},
      u,
    };
    for (const smokeCase of ALL_SMOKE) {
      await runRegistryCase(smokeCtx, smokeCase);
    }

    // Señal de salud global: la batería no debe tener fallos.
    //
    // Esto TIENE que aseverar. Antes solo se emitía un `console.warn` y la suite
    // pasaba en verde con los 761 casos rotos: un semáforo que nunca se pone en
    // rojo hace más daño que no tener semáforo, porque se lee como cobertura.
    // El detalle completo sigue viviendo en el JSON/CSV que escribe writeReports().
    expect(results.length).toBeGreaterThan(0);

    const failed = results.filter((r) => !r.pass);
    const detail = failed
      .map(
        (r) =>
          `  ${r.module} · ${r.testCase}: ${r.method} ${r.path} ` +
          `esperaba ${r.expectedStatus}, obtuvo ${r.actualStatus}`,
      )
      .join('\n');

    expect(
      failed.length === 0
        ? ''
        : `Smoke: ${failed.length}/${results.length} casos fallaron\n${detail}`,
    ).toBe('');
  });
});

/** Vuelca los resultados a JSON y CSV en la raíz del repositorio. */
function writeReports(): void {
  const passed = results.filter((r) => r.pass).length;
  const byModule: Record<
    string,
    {
      /**
       * Valor de total mantenido por la instancia.
       */
      total: number; /**
       * Valor de passed mantenido por la instancia.
       */
      passed: number; /**
       * Valor de failed mantenido por la instancia.
       */
      failed: number;
    }
  > = {};
  for (const r of results) {
    const m = (byModule[r.module] ??= { total: 0, passed: 0, failed: 0 });
    m.total++;
    r.pass ? m.passed++ : m.failed++;
  }

  const report = {
    generatedAtEpochMs: Date.now(),
    summary: {
      total: results.length,
      passed,
      failed: results.length - passed,
      endpointsCovered: new Set(results.map((r) => r.endpoint)).size,
      byModule,
    },
    results,
  };

  const root = process.cwd();
  writeFileSync(
    resolve(root, 'output.smoke.test.json'),
    JSON.stringify(report, null, 2),
    'utf8',
  );
  writeFileSync(resolve(root, 'output.smoke.test.csv'), toCsv(results), 'utf8');
}

/** Serializa los resultados a CSV con escape RFC-4180. */
function toCsv(rows: CaseResult[]): string {
  const headers = [
    'module',
    'endpoint',
    'testCase',
    'method',
    'path',
    'expectedStatus',
    'actualStatus',
    'pass',
    'errorCode',
    'durationMs',
    'note',
  ];
  /**
   * Ejecuta la operación escape.
   *
   * @param v - Valor de v requerido por la operación.
   * @returns Resultado de escape conforme al contrato `string`.
   */
  const escape = (v: unknown): string => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.join(',')];
  for (const r of rows) {
    lines.push(
      headers
        .map((h) => escape((r as unknown as Record<string, unknown>)[h]))
        .join(','),
    );
  }
  return lines.join('\n') + '\n';
}
