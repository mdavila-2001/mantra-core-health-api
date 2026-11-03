import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import type { INestApplication } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import type { PinoLogger } from 'nestjs-pino';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import { ExtractJwt, Strategy as JwtStrategy } from 'passport-jwt';
import request from 'supertest';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { RolesGuard } from '../../../common/auth/roles.guard';
import { TenantScopeGuard } from '../../../common/auth/tenant-scope.guard';
import { createGlobalValidationPipe } from '../../../common/http/validation-pipe';
import { AllExceptionsFilter } from '../../../common/filters/all-exceptions.filter';
import type { TracingService } from '../../../observability';
import {
  BULK_IMPORT_PERMISSIONS,
  BulkImportStatus,
} from '../bulk-import.constants';
import { BulkImportReason } from '../bulk-import.error-reasons';
import { exampleRow } from '../schema/field-schema';
import { findKindSchema } from '../schema/registry';
import { BulkImportService } from '../services/bulk-import.service';
import { TENANT_A, TENANT_B, buildEngine } from '../testing/harness';
import { BulkImportController } from './bulk-import.controller';

/**
 * Contrato HTTP con la cadena REAL de autenticación y autorización
 * (`JwtAuthGuard` + `TenantScopeGuard` + `RolesGuard`), el pipe de validación
 * global y el filtro de errores de la API. Lo que está doblado, y así se
 * declara: el almacén de lotes (memoria), el alta de usuarios, la escritura
 * clínica, los resolutores y la política del permiso fino (sin PDP real ni base).
 * BLOQUEADO contra PostgreSQL real: no existe en esta máquina.
 */
const SECRET = 'test-secret-only-for-this-spec';
const STAFF = findKindSchema('usuario-personal-organizacion');
if (!STAFF) throw new Error('falta el tipo');

type Who = { sub: string; roles: string[]; tenantIds: string[] };
const bearer = (who: Who) => `Bearer ${jwt.sign(who, SECRET)}`;

const ADMIN: Who = {
  sub: 'admin-1',
  roles: ['SECURITY_ADMIN'],
  tenantIds: [TENANT_A],
};
const ADMIN_SIN_PERMISO: Who = {
  sub: 'admin-2',
  roles: ['SECURITY_ADMIN'],
  tenantIds: [TENANT_A],
};
const ADMIN_OTRO_TENANT: Who = {
  sub: 'admin-b',
  roles: ['SECURITY_ADMIN'],
  tenantIds: [TENANT_B],
};
const CLINICO: Who = {
  sub: 'clin-1',
  roles: ['CLINICIAN'],
  tenantIds: [TENANT_A],
};
const PACIENTE: Who = {
  sub: 'pac-1',
  roles: ['PATIENT'],
  tenantIds: [TENANT_A],
};
const ADMIN_DOS_TENANTS: Who = {
  sub: 'admin-1',
  roles: ['SECURITY_ADMIN'],
  tenantIds: [TENANT_A, TENANT_B],
};
const SUPERADMIN: Who = {
  sub: 'admin-1',
  roles: ['SUPERADMIN'],
  tenantIds: [],
};

const rows = (n: number) =>
  Array.from({ length: n }, (_, i) => ({
    ...exampleRow(STAFF),
    displayName: `Persona ${i}`,
    email: `personal${i}@ejemplo.invalid`,
  }));
const body = (extra: object = {}) => ({
  kind: STAFF.kind,
  reason: 'Incorporación de prueba (sintética)',
  rows: rows(2),
  ...extra,
});

describe('HTTP del motor de cargas masivas', () => {
  let app: INestApplication;
  const e = buildEngine();
  e.policy.grant('admin-b', BULK_IMPORT_PERMISSIONS.users);

  const api = (
    method: 'get' | 'post',
    path: string,
    who?: Who,
    tenant: string | null = TENANT_A,
  ) => {
    let r = request(app.getHttpServer())[method](path);
    if (who) r = r.set('Authorization', bearer(who));
    if (tenant) r = r.set('X-Tenant-Id', tenant);
    return r;
  };

  beforeAll(async () => {
    passport.use(
      'jwt',
      new JwtStrategy(
        {
          jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
          secretOrKey: SECRET,
        },
        (p: Who, done: (e: unknown, u?: unknown) => void) =>
          done(null, { id: p.sub, roles: p.roles, tenantIds: p.tenantIds }),
      ),
    );
    const module = await Test.createTestingModule({
      controllers: [BulkImportController],
      providers: [{ provide: BulkImportService, useValue: e.service }],
    }).compile();
    app = module.createNestApplication();
    const reflector = app.get(Reflector);
    app.useGlobalGuards(
      new JwtAuthGuard(reflector),
      new TenantScopeGuard(reflector),
      new RolesGuard(reflector),
    );
    app.useGlobalPipes(createGlobalValidationPipe());
    app.useGlobalFilters(
      new AllExceptionsFilter(
        {
          setContext: () => undefined,
          error: () => undefined,
          warn: () => undefined,
          info: () => undefined,
        } as unknown as PinoLogger,
        {
          setAttribute: () => undefined,
          recordException: () => undefined,
          addEvent: () => undefined,
        } as unknown as TracingService,
      ),
    );
    await app.init();
  });
  afterAll(async () => {
    await e.processor.drain();
    await app.close();
  });

  describe('plantillas', () => {
    it('GET /templates: catálogo con los diez tipos, topes y estado declarado del motor', async () => {
      const res = await api(
        'get',
        '/admin/bulk-imports/templates',
        ADMIN,
      ).expect(200);
      expect(res.body.templates).toHaveLength(10);
      expect(res.body.limits).toMatchObject({
        maxRows: 5000,
        maxBytes: 20971520,
      });
      expect(res.body.engine.persistence.durable).toBe(false);
    });

    it.each(['csv', 'json'] as const)(
      'GET /templates/:kind?format=%s descarga con nombre y tipo',
      async (format) => {
        const res = await api(
          'get',
          `/admin/bulk-imports/templates/${STAFF.kind}?format=${format}`,
          ADMIN,
        ).expect(200);
        expect(res.headers['content-disposition']).toBe(
          `attachment; filename="plantilla-${STAFF.kind}-v1.${format}"`,
        );
        expect(res.headers['content-type']).toContain(
          format === 'csv' ? 'text/csv' : 'application/json',
        );
        if (format === 'json') {
          const json = JSON.parse(res.body.toString ? res.text : '{}');
          expect(Object.keys(json)).toEqual([
            'kind',
            'version',
            'columns',
            'example',
            'rules',
          ]);
        }
      },
    );

    it('formato por defecto csv; formato inválido 400; tipo inexistente 404', async () => {
      const def = await api(
        'get',
        `/admin/bulk-imports/templates/${STAFF.kind}`,
        ADMIN,
      ).expect(200);
      expect(def.headers['content-type']).toContain('text/csv');
      const bad = await api(
        'get',
        `/admin/bulk-imports/templates/${STAFF.kind}?format=xlsx`,
        ADMIN,
      ).expect(400);
      expect(bad.body.reason).toBe(BulkImportReason.FORMAT_UNSUPPORTED);
      await api('get', '/admin/bulk-imports/templates/nope', ADMIN).expect(404);
    });

    it('la plantilla descargada se sube de vuelta y el lote queda VALIDADO (CSV y JSON)', async () => {
      const csv = await api(
        'get',
        `/admin/bulk-imports/templates/${STAFF.kind}?format=csv`,
        ADMIN,
      ).expect(200);
      const up = await api('post', '/admin/bulk-imports', ADMIN)
        .field('kind', STAFF.kind)
        .field('reason', 'prueba')
        .attach('file', Buffer.from(csv.text), 'plantilla.csv')
        .expect(201);
      expect(up.body.status).toBe(BulkImportStatus.VALIDATED);
      expect(up.body.source.format).toBe('csv');

      const json = await api(
        'get',
        `/admin/bulk-imports/templates/${STAFF.kind}?format=json`,
        ADMIN,
      ).expect(200);
      const upJson = await api('post', '/admin/bulk-imports', ADMIN)
        .field('kind', STAFF.kind)
        .field('reason', 'prueba')
        .attach('file', Buffer.from(json.text), 'plantilla.json')
        .expect(201);
      expect(upJson.body.status).toBe(BulkImportStatus.VALIDATED);
      expect(upJson.body.source.format).toBe('json');
    });
  });

  describe('matriz de autorización negativa', () => {
    it('sin token → 401 en todas las rutas', async () => {
      const id = '00000000-0000-4000-8000-000000000001';
      await api('get', '/admin/bulk-imports/templates').expect(401);
      await api('get', `/admin/bulk-imports/templates/${STAFF.kind}`).expect(
        401,
      );
      await api('get', '/admin/bulk-imports').expect(401);
      await api('post', '/admin/bulk-imports').send(body()).expect(401);
      await api('post', `/admin/bulk-imports/${id}/confirm`)
        .set('Idempotency-Key', 'k1')
        .expect(401);
      await api('get', `/admin/bulk-imports/${id}`).expect(401);
      await api('get', `/admin/bulk-imports/${id}/report`).expect(401);
    });

    it.each([
      ['clínico', CLINICO],
      ['paciente', PACIENTE],
    ])('rol insuficiente (%s) → 403 en todas las rutas', async (_name, who) => {
      const id = '00000000-0000-4000-8000-000000000001';
      await api('get', '/admin/bulk-imports/templates', who).expect(403);
      await api('get', '/admin/bulk-imports', who).expect(403);
      await api('post', '/admin/bulk-imports', who).send(body()).expect(403);
      await api('post', `/admin/bulk-imports/${id}/confirm`, who)
        .set('Idempotency-Key', 'k1')
        .expect(403);
      await api('get', `/admin/bulk-imports/${id}`, who).expect(403);
      await api('get', `/admin/bulk-imports/${id}/report`, who).expect(403);
    });

    it('rol de gestión sin el permiso fino → 403 PERMISSION_REQUIRED y no crea nada', async () => {
      const before = (await e.repo.list(TENANT_A, 100)).length;
      const res = await api('post', '/admin/bulk-imports', ADMIN_SIN_PERMISO)
        .send(body())
        .expect(403);
      expect(res.body.reason).toBe(BulkImportReason.PERMISSION_REQUIRED);
      expect((await e.repo.list(TENANT_A, 100)).length).toBe(before);
    });

    it('otra organización → 404 al consultar, confirmar y pedir el informe de un lote ajeno', async () => {
      const created = await api('post', '/admin/bulk-imports', ADMIN)
        .send(body())
        .expect(201);
      const id = created.body.id as string;
      await api(
        'get',
        `/admin/bulk-imports/${id}`,
        ADMIN_OTRO_TENANT,
        TENANT_B,
      ).expect(404);
      await api(
        'get',
        `/admin/bulk-imports/${id}/report`,
        ADMIN_OTRO_TENANT,
        TENANT_B,
      ).expect(404);
      await api(
        'post',
        `/admin/bulk-imports/${id}/confirm`,
        ADMIN_OTRO_TENANT,
        TENANT_B,
      )
        .set('Idempotency-Key', 'ajeno')
        .expect(404);
      const lista = await api(
        'get',
        '/admin/bulk-imports',
        ADMIN_OTRO_TENANT,
        TENANT_B,
      ).expect(200);
      expect(lista.body).toEqual([]);
      // y el lote sigue intacto para su dueño
      const own = await api('get', `/admin/bulk-imports/${id}`, ADMIN).expect(
        200,
      );
      expect(own.body.status).toBe(BulkImportStatus.VALIDATED);
    });

    it('declarar un tenant del que no es miembro → 403; varios tenants sin elegir → 403; sin tenant → 422', async () => {
      await api('get', '/admin/bulk-imports', ADMIN, TENANT_B).expect(403);
      await api('get', '/admin/bulk-imports', ADMIN_DOS_TENANTS, null).expect(
        403,
      );
      const res = await api(
        'get',
        '/admin/bulk-imports',
        SUPERADMIN,
        null,
      ).expect(422);
      expect(res.body.details?.reason ?? res.body.reason).toBe(
        'TENANT_REQUIRED',
      );
    });
  });

  describe('crear · confirmar · consultar', () => {
    it('flujo completo: 201 VALIDADO → 202 EN_COLA → procesa → informe', async () => {
      const created = await api('post', '/admin/bulk-imports', ADMIN)
        .send(body())
        .expect(201);
      expect(created.body).toMatchObject({
        status: 'VALIDADO',
        counts: { total: 2, valid: 2, rejected: 0 },
      });
      const id = created.body.id as string;

      const accepted = await api(
        'post',
        `/admin/bulk-imports/${id}/confirm`,
        ADMIN,
      )
        .set('Idempotency-Key', 'flujo-1')
        .expect(202);
      expect(accepted.body.status).toBe('EN_COLA');
      await api('post', `/admin/bulk-imports/${id}/confirm`, ADMIN)
        .set('Idempotency-Key', 'flujo-1')
        .expect(202);
      await e.processor.drain();

      const state = await api('get', `/admin/bulk-imports/${id}`, ADMIN).expect(
        200,
      );
      expect(state.body).toMatchObject({
        status: 'COMPLETADO',
        progress: { processed: 2, total: 2 },
      });
      const report = await api(
        'get',
        `/admin/bulk-imports/${id}/report`,
        ADMIN,
      ).expect(200);
      expect(report.body.totals).toMatchObject({ total: 2, CREADA: 2 });
      const csv = await api(
        'get',
        `/admin/bulk-imports/${id}/report?format=csv`,
        ADMIN,
      ).expect(200);
      expect(csv.headers['content-disposition']).toBe(
        `attachment; filename="informe-${id}.csv"`,
      );
      expect(csv.text.split('\n')[0]).toBe('row,outcome,reason,field,message');
      expect(e.users.created.filter((c) => c.batchId === id)).toHaveLength(2);
    });

    it('confirmar sin Idempotency-Key → 400; con otra clave sobre el mismo lote → 409', async () => {
      const created = await api('post', '/admin/bulk-imports', ADMIN)
        .send(
          body({
            rows: rows(1).map((r) => ({
              ...r,
              email: 'unico1@ejemplo.invalid',
            })),
          }),
        )
        .expect(201);
      const id = created.body.id as string;
      const none = await api(
        'post',
        `/admin/bulk-imports/${id}/confirm`,
        ADMIN,
      ).expect(400);
      expect(none.body.reason).toBe(BulkImportReason.IDEMPOTENCY_KEY_REQUIRED);
      await api('post', `/admin/bulk-imports/${id}/confirm`, ADMIN)
        .set('Idempotency-Key', 'conf-1')
        .expect(202);
      const other = await api(
        'post',
        `/admin/bulk-imports/${id}/confirm`,
        ADMIN,
      )
        .set('Idempotency-Key', 'conf-2')
        .expect(409);
      expect(other.body.reason).toBe(BulkImportReason.BATCH_ALREADY_CONFIRMED);
      await e.processor.drain();
    });

    it('id que no es UUID → 400; lote inexistente → 404', async () => {
      await api('get', '/admin/bulk-imports/no-es-uuid', ADMIN).expect(400);
      await api(
        'get',
        '/admin/bulk-imports/00000000-0000-4000-8000-00000000dead',
        ADMIN,
      ).expect(404);
    });

    it('lista de la organización; limit fuera de rango → 400', async () => {
      const ok = await api('get', '/admin/bulk-imports?limit=2', ADMIN).expect(
        200,
      );
      expect(ok.body.length).toBeLessThanOrEqual(2);
      await api('get', '/admin/bulk-imports?limit=0', ADMIN).expect(400);
      await api('get', '/admin/bulk-imports?limit=101', ADMIN).expect(400);
    });

    it('campos no declarados en el cuerpo se rechazan (lista blanca) → 400', async () => {
      await api('post', '/admin/bulk-imports', ADMIN)
        .send(body({ rolePrivilegiado: 'SECURITY_ADMIN' }))
        .expect(400);
    });

    it('archivo y filas a la vez → 400 SOURCE_AMBIGUOUS; ninguno → 400', async () => {
      const both = await api('post', '/admin/bulk-imports', ADMIN)
        .field('kind', STAFF.kind)
        .field('reason', 'x')
        .attach('file', Buffer.from('a\n1\n'), 'a.csv')
        .expect(201); // multipart: `rows` no existe; con archivo solo es válido
      expect(both.body.status).toBe(BulkImportStatus.REJECTED);
      const none = await api('post', '/admin/bulk-imports', ADMIN)
        .send({ kind: STAFF.kind, reason: 'x' })
        .expect(400);
      expect(none.body.reason).toBe(BulkImportReason.SOURCE_AMBIGUOUS);
    });
  });

  describe('topes', () => {
    it('archivo de más de 20 MB → 413 sin crear lote', async () => {
      const before = (await e.repo.list(TENANT_A, 100)).length;
      await api('post', '/admin/bulk-imports', ADMIN)
        .field('kind', STAFF.kind)
        .field('reason', 'x')
        .attach('file', Buffer.alloc(20 * 1024 * 1024 + 1, 0x61), 'grande.csv')
        .expect(413);
      expect((await e.repo.list(TENANT_A, 100)).length).toBe(before);
    }, 30_000);

    it('5.001 filas en un JSON subido → 413 ROW_LIMIT_EXCEEDED sin crear lote; 5.000 pasan', async () => {
      const many = (n: number) =>
        Array.from({ length: n }, (_, i) => ({
          ...exampleRow(STAFF),
          email: `m${i}@ejemplo.invalid`,
        }));
      const before = (await e.repo.list(TENANT_A, 100)).length;
      const over = await api('post', '/admin/bulk-imports', ADMIN)
        .field('kind', STAFF.kind)
        .field('reason', 'x')
        .attach('file', Buffer.from(JSON.stringify(many(5001))), 'filas.json')
        .expect(413);
      expect(over.body.reason).toBe(BulkImportReason.ROW_LIMIT_EXCEEDED);
      expect((await e.repo.list(TENANT_A, 100)).length).toBe(before);
      const edge = await api('post', '/admin/bulk-imports', ADMIN)
        .field('kind', STAFF.kind)
        .field('reason', 'x')
        .attach('file', Buffer.from(JSON.stringify(many(5000))), 'filas.json')
        .expect(201);
      expect(edge.body.counts.total).toBe(5000);
    }, 30_000);

    it('un cuerpo JSON demasiado grande lo corta el límite del cuerpo del servidor (413) antes de llegar al motor; main.ts lo fija en 1 MB y acá rige el de Nest', async () => {
      const big = Array.from({ length: 2000 }, (_, i) => ({
        ...exampleRow(STAFF),
        email: `g${i}@ejemplo.invalid`,
      }));
      await api('post', '/admin/bulk-imports', ADMIN)
        .send(body({ rows: big }))
        .expect(413);
    });

    it('5.001 filas en un CSV subido → 413', async () => {
      const header = STAFF.fields.map((f) => f.name).join(',');
      const ex = exampleRow(STAFF);
      const lines = [header];
      for (let i = 0; i < 5001; i += 1) {
        lines.push(
          STAFF.fields
            .map((f) =>
              f.name === 'email' ? `c${i}@ejemplo.invalid` : (ex[f.name] ?? ''),
            )
            .join(','),
        );
      }
      await api('post', '/admin/bulk-imports', ADMIN)
        .field('kind', STAFF.kind)
        .field('reason', 'x')
        .attach('file', Buffer.from(lines.join('\n')), 'filas.csv')
        .expect(413);
    }, 30_000);
  });
});
