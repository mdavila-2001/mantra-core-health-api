import { randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { PassportModule } from '@nestjs/passport';
import { EntityManager, MikroORM } from '@mikro-orm/postgresql';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import request from 'supertest';
import { CONCEPTS, createGlobalValidationPipe } from '../../src/common';
import { AuthTokenModule } from '../../src/common/auth/auth-token.module';
import { JwtAuthGuard } from '../../src/common/auth/jwt-auth.guard';
import { RolesGuard } from '../../src/common/auth/roles.guard';
import { JwtStrategy } from '../../src/common/auth/jwt.strategy';
import { TokenService } from '../../src/common/auth/token.service';
import { SessionValidator } from '../../src/common/auth/session-validator';
import { Sessions } from '../../src/modules/iam/entities';
import { AuditLog, DataAccessLog } from '../../src/modules/audit/entities';
import {
  AuditLogRepository,
  DataAccessLogRepository,
} from '../../src/modules/audit/repositories';
import { AuditTrailInterceptor } from '../../src/modules/audit/interceptors/audit-trail.interceptor';
import { ReportTemplatesController } from '../../src/modules/accounting/report-templates/report-templates.controller';
import { ReportTemplatesRepository } from '../../src/modules/accounting/report-templates/report-templates.repository';
import { ReportTemplatesService } from '../../src/modules/accounting/report-templates/report-templates.service';
import {
  isDisposableDatabaseName,
  resolveResetTarget,
} from './disposable-database';

/** HTTP, JWT/roles, servicio, PostgreSQL y cadena de auditoría reales; sesión sintética validada. */
describe('Plantillas de presentación contable (HTTP + PostgreSQL)', () => {
  let orm: MikroORM;
  let app: INestApplication;
  let tokens: TokenService;
  const actorId = randomUUID();
  const prefix = `/admin/accounting/report-templates`;
  const code = `TEST_${randomUUID().replaceAll('-', '').toUpperCase()}`;
  const body = {
    userType: 'PRACTITIONER',
    code,
    name: 'Balance de presentación',
    reportKind: 'TRIAL_BALANCE',
    columns: [
      { key: 'code', label: 'Código' },
      { key: 'balance', label: 'Saldo' },
    ],
  };
  const auth = (
    roles = ['SUPERADMIN'],
    scopedRoles?: Record<string, string[]>,
  ) => ({
    Authorization: `Bearer ${tokens.signAccessToken(actorId, 'synthetic-session', roles, [], { scopedRoles })}`,
  });
  const sql = (text: string, args: unknown[] = []) =>
    orm.em.fork().getConnection().execute(text, args);

  beforeAll(async () => {
    const target = resolveResetTarget(process.env);
    if (!isDisposableDatabaseName(target.database))
      throw new Error('La prueba exige una base descartable');
    orm = await MikroORM.init({
      host: target.host,
      port: target.port,
      dbName: target.database,
      user: process.env.DB_USER ?? 'postgres',
      password: process.env.DB_PASSWORD ?? '',
      entities: [AuditLog, DataAccessLog, Sessions],
      metadataProvider: TsMorphMetadataProvider,
    });
    const source = randomUUID(),
      system = randomUUID(),
      version = randomUUID();
    await sql(
      'insert into terminology.terminology_sources(id,code,name,created_at,updated_at) values(?::uuid,?, ?,now(),now())',
      [source, source, 'Synthetic templates'],
    );
    await sql(
      'insert into terminology.code_systems(id,source_id,internal_code,name,canonical_url,created_at,updated_at) values(?::uuid,?::uuid,?,?,?,now(),now())',
      [system, source, system, 'Synthetic templates', `urn:test:${system}`],
    );
    await sql(
      "insert into terminology.code_system_versions(id,code_system_id,version,created_at,updated_at) values(?::uuid,?::uuid,'test',now(),now())",
      [version, system],
    );
    for (const id of [
      CONCEPTS.USER_ACTIVE,
      CONCEPTS.OUTCOME_SUCCESS,
      CONCEPTS.OUTCOME_FAILURE,
    ])
      await sql(
        "insert into terminology.catalog_concepts(id,code_system_version_id,code,display,created_at,updated_at) values(?::uuid,?::uuid,?,'Synthetic templates',now(),now()) on conflict(id) do nothing",
        [id, version, id],
      );
    await sql(
      "insert into iam.users(id,status_concept_id,display_name,created_at,updated_at) values(?::uuid,?::uuid,'Synthetic template admin',now(),now())",
      [actorId, CONCEPTS.USER_ACTIVE],
    );
    const module = await Test.createTestingModule({
      imports: [PassportModule, AuthTokenModule],
      controllers: [ReportTemplatesController],
      providers: [
        ReportTemplatesService,
        ReportTemplatesRepository,
        JwtStrategy,
        AuditLogRepository,
        DataAccessLogRepository,
        { provide: EntityManager, useValue: orm.em.fork() },
        {
          provide: SessionValidator,
          useValue: { assertActive: async () => undefined },
        },
        { provide: APP_GUARD, useClass: JwtAuthGuard },
        { provide: APP_GUARD, useClass: RolesGuard },
        { provide: APP_INTERCEPTOR, useClass: AuditTrailInterceptor },
      ],
    }).compile();
    app = module.createNestApplication({ logger: false });
    app.useGlobalPipes(createGlobalValidationPipe());
    await app.init();
    tokens = module.get(TokenService);
  });
  afterAll(async () => {
    await app?.close();
    await orm?.close(true);
  });

  it('exige autenticación y limita escritura al SUPERADMIN global', async () => {
    await request(app.getHttpServer()).get(prefix).expect(401);
    for (const roles of [
      ['PRACTITIONER'],
      ['SECURITY_ADMIN'],
      ['PLATFORM_ADMIN'],
    ])
      await request(app.getHttpServer())
        .post(prefix)
        .set(auth(roles))
        .send(body)
        .expect(403);
    await request(app.getHttpServer())
      .post(prefix)
      .set(auth(['SUPERADMIN'], { 'synthetic-tenant': ['SUPERADMIN'] }))
      .send(body)
      .expect(403);
  });

  it('rechaza columnas arbitrarias, duplicadas y propiedades extra, incluso dentro de la presentación', async () => {
    for (const value of [
      { ...body, querySpec: 'select * from accounting.accounts' },
      {
        ...body,
        columns: [{ key: 'balance', label: 'Saldo', formula: 'sql' }],
      },
      { ...body, columns: [{ key: 'notAReportField', label: 'X' }] },
      {
        ...body,
        columns: [
          { key: 'balance', label: 'A' },
          { key: 'balance', label: 'B' },
        ],
      },
    ])
      await request(app.getHttpServer())
        .post(prefix)
        .set(auth())
        .send(value)
        .expect(400);
  });

  it('persiste, filtra por audiencia, controla conflictos y conserva historia sin tocar el mayor', async () => {
    const before = await sql(
      'select (select count(*) from accounting.accounts)::int as accounts,(select count(*) from accounting.journal_transactions)::int as transactions',
    );
    const created = await request(app.getHttpServer())
      .post(prefix)
      .set(auth())
      .send(body)
      .expect(201);
    const id = created.body.id as string;
    expect(created.body).toMatchObject({ code, rowVersion: 1, isActive: true });
    await request(app.getHttpServer())
      .post(prefix)
      .set(auth())
      .send(body)
      .expect(409);
    const read = await request(app.getHttpServer())
      .get(`${prefix}/${id}`)
      .set(auth(['PRACTITIONER']))
      .expect(200);
    expect(read.body.columns).toEqual(body.columns);
    const listed = await request(app.getHttpServer())
      .get(prefix)
      .query({ userType: 'PRACTITIONER' })
      .set(auth())
      .expect(200);
    expect(listed.body.items.some((r: { id: string }) => r.id === id)).toBe(
      true,
    );
    const otherAudience = await request(app.getHttpServer())
      .get(prefix)
      .query({ userType: 'INSURER' })
      .set(auth())
      .expect(200);
    expect(
      otherAudience.body.items.some((r: { id: string }) => r.id === id),
    ).toBe(false);
    const update = {
      name: 'Balance actualizado',
      reportKind: body.reportKind,
      columns: body.columns,
      isActive: true,
      expectedRowVersion: 1,
    };
    const results = await Promise.all(
      [1, 2].map(() =>
        request(app.getHttpServer())
          .put(`${prefix}/${id}`)
          .set(auth())
          .send(update),
      ),
    );
    expect(results.map((r) => r.status).sort()).toEqual([200, 409]);
    const ended = await request(app.getHttpServer())
      .post(`${prefix}/${id}/end`)
      .set(auth())
      .send({ expectedRowVersion: 2 })
      .expect(200);
    expect(ended.body).toMatchObject({ id, isActive: false, rowVersion: 3 });
    const repeat = await request(app.getHttpServer())
      .post(`${prefix}/${id}/end`)
      .set(auth())
      .send({ expectedRowVersion: 2 })
      .expect(200);
    expect(repeat.body.rowVersion).toBe(3);
    const stored = await sql(
      'select is_active,row_version from accounting.report_presentation_templates where id=?::uuid',
      [id],
    );
    expect(stored[0]).toMatchObject({ is_active: false, row_version: 3 });
    const audit = await sql(
      'select action,outcome_concept_id from audit.audit_log where entity_id=?::uuid order by recorded_at',
      [id],
    );
    expect(
      audit.some((r) => r.action === 'ACCOUNTING_REPORT_TEMPLATE_CREATED'),
    ).toBe(true);
    expect(
      audit.some((r) => r.action === 'ACCOUNTING_REPORT_TEMPLATE_UPDATED'),
    ).toBe(true);
    expect(
      audit.some((r) => r.action === 'ACCOUNTING_REPORT_TEMPLATE_ENDED'),
    ).toBe(true);
    expect(
      await sql(
        'select (select count(*) from accounting.accounts)::int as accounts,(select count(*) from accounting.journal_transactions)::int as transactions',
      ),
    ).toEqual(before);
  });

  it('valida UUID, límites y ausencia de recurso', async () => {
    await request(app.getHttpServer())
      .get(`${prefix}/invalid`)
      .set(auth())
      .expect(400);
    await request(app.getHttpServer())
      .get(`${prefix}/${randomUUID()}`)
      .set(auth())
      .expect(404);
    await request(app.getHttpServer())
      .get(prefix)
      .query({ limit: 101 })
      .set(auth())
      .expect(400);
  });
});
