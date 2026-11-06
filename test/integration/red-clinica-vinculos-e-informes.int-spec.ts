import 'reflect-metadata';
import { randomUUID } from 'node:crypto';
import type { MikroORM } from '@mikro-orm/postgresql';
import pg from 'pg';
import { CONCEPTS } from '../../src/common';
import { HistoryRepository } from '../../src/modules/audit/repositories/history.repository';
import { CLIN } from '../../src/modules/clinical/clinical.concepts';
import { ClinicalErrorReason } from '../../src/modules/clinical/clinical.error-reasons';
import type { ClinicalReadScope } from '../../src/modules/clinical/domain/clinical-read-scope';
import {
  ConditionsRepository,
  EncountersRepository,
  ServiceRequestsRepository,
} from '../../src/modules/clinical/repositories';
import { ClinicalScopeRepository } from '../../src/modules/clinical/repositories/clinical-scope.repository';
import { categoryConceptIdFor } from '../../src/modules/clinical/service-request-category';
import { ClinicalScopeFilterService } from '../../src/modules/clinical/services/clinical-scope-filter.service';
import { ConditionsService } from '../../src/modules/clinical/services/conditions.service';
import { PerformerSelectionValidator } from '../../src/modules/clinical/services/performer-selection.validator';
import { ServiceRequestsService } from '../../src/modules/clinical/services/service-requests.service';
import { CEXT } from '../../src/modules/clinical_ext/clinical_ext.concepts';
import { ClinicalExtErrorReason } from '../../src/modules/clinical_ext/clinical_ext.error-reasons';
import { ReferralsRepository } from '../../src/modules/clinical_ext/repositories';
import { ReferralsService } from '../../src/modules/clinical_ext/services/referrals.service';
import {
  FileVersionsRepository,
  FilesRepository,
} from '../../src/modules/common/repositories';
import { AttachableFileService } from '../../src/modules/common/services/attachable-file.service';
import { FileUploadService } from '../../src/modules/common/services/file-upload.service';
import { DiagnosticsOrdersController } from '../../src/modules/diagnostics/controllers/diagnostics-orders.controller';
import { DIAG } from '../../src/modules/diagnostics/diagnostics.concepts';
import { DiagnosticsErrorReason } from '../../src/modules/diagnostics/diagnostics.error-reasons';
import {
  ClinicalRefsRepository,
  DiagnosticOrdersRepository,
  ReportsRepository,
} from '../../src/modules/diagnostics/repositories';
import { DiagnosticsOrdersService } from '../../src/modules/diagnostics/services/diagnostics-orders.service';
import { DiagnosticsPractitionerResultsService } from '../../src/modules/diagnostics/services/diagnostics-practitioner-results.service';
import { RequesterReportsReader } from '../../src/modules/diagnostics/services/requester-reports.reader';
import {
  PersonAccountLinksRepository,
  PractitionerSpecialtiesRepository,
} from '../../src/modules/profiles/infrastructure/repositories';
import { PROF } from '../../src/modules/profiles/profiles.concepts';
import {
  OWNER,
  Seeder,
  asTenant,
  rejectionOf,
  runtimeOrm,
} from './red-clinica.fixture';
import { seedNetwork, type Network } from './red-clinica.network';

/**
 * Patient clinical network (v4.2.94) against PostgreSQL with FORCED RLS and a
 * runtime role (no BYPASSRLS): the three links and their 422s, and the
 * released result a practitioner opens by id, which must follow exactly the
 * visibility of `GET /diagnostics/patients/:id/orders` (read scope, and the
 * laboratory-custodied report of an own order) with the single 404 otherwise.
 *
 * Applies `2026-11-06_v4294_red_clinica_vinculos.sql` (idempotent). Fixture
 * rows are synthetic, marked with `RED-<suffix>`, and removed at the end.
 * Prerequisites in `red-clinica.fixture.ts`.
 */
const quiet = {
  setContext: () => undefined,
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined,
} as never;
const FULL: ClinicalReadScope = { kind: 'FULL' };

describe('red clínica v4.2.94 · vínculos e informe del profesional (RLS forzado)', () => {
  const mark = `RED-${randomUUID().slice(0, 8)}`;
  const previous = [process.env.RLS_ENFORCE, process.env.DB_APP_USER];
  let owner: pg.Client;
  let seed: Seeder;
  let orm: MikroORM;
  let drop: () => Promise<void>;
  let net: Network;
  const written: { table: string; key: string; id: string }[] = [];

  const scopeOf = (ids: string[]): ClinicalReadScope => ({
    kind: 'SPECIALTIES',
    specialtyConceptIds: ids,
  });

  const build = () => {
    const em = orm.em as never;
    const scopeFilter = new ClinicalScopeFilterService(
      new PractitionerSpecialtiesRepository(),
      new PersonAccountLinksRepository(),
      new ClinicalScopeRepository(),
    );
    const reader = new RequesterReportsReader(em, new ReportsRepository());
    const storage = { retrieve: async () => Buffer.from('%PDF-1.4 red') };
    const attachable = new AttachableFileService(
      new FilesRepository(),
      new FileVersionsRepository(),
      quiet,
    );
    const upload = new FileUploadService(
      em,
      storage as never,
      undefined as never,
      new FilesRepository(),
      new FileVersionsRepository(),
      attachable,
      quiet,
    );
    const results = new DiagnosticsPractitionerResultsService(
      em,
      new ReportsRepository(),
      new ClinicalRefsRepository(),
      scopeFilter,
      reader,
      quiet,
      upload,
    );
    const list = new DiagnosticsOrdersService(
      em,
      new DiagnosticOrdersRepository(),
      { namesFor: async () => new Map() } as never,
      quiet,
      { noteIdsFor: async () => new Map() } as never,
      scopeFilter,
      new ClinicalScopeRepository(),
      reader,
    );
    return {
      results,
      list,
      controller: new DiagnosticsOrdersController(list, results),
    };
  };

  beforeAll(async () => {
    process.env.DOTENV_CONFIG_PATH = 'no-such-file.env';
    process.env.RLS_ENFORCE = 'true';
    owner = new pg.Client(OWNER);
    await owner.connect();
    seed = new Seeder(owner, mark);
    await seed.patch('2026-11-06_v4294_red_clinica_vinculos.sql');
    const { rows } = await owner.query(
      'select 1 from terminology.catalog_concepts where id = any($1)',
      [
        [
          CLIN.CONDITION_REFUTED,
          CEXT.REFERRAL_ACCEPTED,
          PROF.ACCOUNT_LINK_ACTIVE,
        ],
      ],
    );
    if (rows.length < 3) {
      throw new Error(
        'The database needs the terminology seed (catalog_concepts)',
      );
    }
    ({ orm, drop } = await runtimeOrm(owner));
    net = await seedNetwork(seed, mark);
  });

  afterAll(async () => {
    try {
      await seed?.cleanup(written);
    } finally {
      await drop?.();
      await owner?.end();
      process.env.RLS_ENFORCE = previous[0];
      if (previous[1] === undefined) delete process.env.DB_APP_USER;
      else process.env.DB_APP_USER = previous[1];
    }
  });

  describe('vínculos', () => {
    const actor = () =>
      ({
        id: net.userA,
        roles: ['PRACTITIONER'],
        practitionerProfileId: net.hpA,
      }) as never;
    const noop = async () => undefined;
    const orders = () =>
      new ServiceRequestsService(
        orm.em as never,
        new ServiceRequestsRepository(),
        new EncountersRepository(),
        undefined as never,
        undefined as never,
        quiet,
        { publishDomainEvent: noop } as never,
        { serviceRequestPlaced: noop } as never,
        undefined as never,
        new PerformerSelectionValidator(undefined as never),
        undefined as never,
        undefined as never,
        {
          prepare: async (_tx: unknown, d: { categoryConceptId: string }) => ({
            categoryConceptId: d.categoryConceptId,
            componentConceptIds: [],
          }),
          describe: async () => new Map(),
        } as never,
      );
    const order = (reasonConditionId: string) =>
      asTenant(orm, net.tenantA, () =>
        orders().create(
          {
            custodianTenantId: net.tenantA,
            patientProfileId: net.patient,
            codeConceptId: CONCEPTS.STATE_ACTIVE,
            category: 'LAB',
            requesterProfileId: net.hpA,
            reasonConditionId,
          } as never,
          actor(),
          { duplicatePolicy: 'skip' } as never,
        ),
      );

    it('reasonConditionId: un diagnóstico del paciente queda guardado en la orden', async () => {
      const created = await order(net.condition.base);
      written.push({
        table: 'clinical.service_requests',
        key: 'id',
        id: created.id,
      });
      const { rows } = await owner.query(
        'select reason_condition_id, category_concept_id from clinical.service_requests where id = $1',
        [created.id],
      );
      expect(rows[0]).toEqual({
        reason_condition_id: net.condition.base,
        category_concept_id: categoryConceptIdFor('LAB'),
      });
    });

    it.each([
      ['de otro paciente', 'otherPatient'],
      ['de otra organización', 'otherTenant'],
      ['inexistente', 'missing'],
    ] as const)('reasonConditionId %s → 422 sin escribir', async (_l, key) => {
      const before = await owner.query(
        'select count(*)::int n from clinical.service_requests where patient_profile_id = $1',
        [net.patient],
      );
      const error = await rejectionOf(order(net.condition[key]));
      expect(error.getStatus()).toBe(422);
      expect(error.reason).toBe(
        ClinicalErrorReason.SERVICE_REQUEST_REASON_CONDITION_INVALID,
      );
      const after = await owner.query(
        'select count(*)::int n from clinical.service_requests where patient_profile_id = $1',
        [net.patient],
      );
      expect(after.rows[0].n).toBe(before.rows[0].n);
    });

    const u = undefined as never;
    // Only the repositories `respond` touches are real; the rest is never reached.
    const referrals = () =>
      new ReferralsService(
        orm.em as never,
        new ReferralsRepository(),
        u,
        u,
        u,
        new EncountersRepository(),
        u,
        u,
        quiet,
        u,
        u,
        u,
        u,
        u,
        u,
      );
    const respond = (dto: Record<string, unknown>) =>
      asTenant(orm, net.tenantB, () =>
        referrals().respond(
          net.referral,
          dto as never,
          {
            id: net.userB,
            roles: ['PRACTITIONER'],
          } as never,
        ),
      );

    it('targetEncounterId sólo con ACCEPT; ajeno o de otro tenant → 422; al aceptar queda guardado', async () => {
      const reject = await rejectionOf(
        respond({
          decision: 'REJECT',
          rejectReason: 'x',
          targetEncounterId: net.encounter.b,
        }),
      );
      expect([reject.getStatus(), reject.reason]).toEqual([
        422,
        ClinicalExtErrorReason.REFERRAL_TARGET_ENCOUNTER_NOT_ALLOWED,
      ]);
      for (const foreign of [net.encounter.otherPatient, net.encounter.a]) {
        const error = await rejectionOf(
          respond({ decision: 'ACCEPT', targetEncounterId: foreign }),
        );
        expect([error.getStatus(), error.reason]).toEqual([
          422,
          ClinicalExtErrorReason.REFERRAL_TARGET_ENCOUNTER_INVALID,
        ]);
      }
      const ok = await respond({
        decision: 'ACCEPT',
        targetEncounterId: net.encounter.b,
      });
      expect(ok.targetEncounterId).toBe(net.encounter.b);
      const { rows } = await owner.query(
        'select target_encounter_id, status_concept_id from clinical_ext.referrals where id = $1',
        [net.referral],
      );
      expect(rows[0]).toEqual({
        target_encounter_id: net.encounter.b,
        status_concept_id: CEXT.REFERRAL_ACCEPTED,
      });
    });

    const conditions = () =>
      new ConditionsService(
        orm.em as never,
        new ConditionsRepository(),
        new EncountersRepository(),
        { record: noop } as never,
        new HistoryRepository(),
        quiet,
        undefined as never,
        {
          assertCanWriteHistory: noop,
          resolveReadScope: async () => FULL,
        } as never,
        undefined as never,
      );
    const verify = (id: string, dto: Record<string, unknown>) =>
      asTenant(orm, net.tenantA, () =>
        conditions().verify(
          id,
          { reasonText: 'Diferencial', ...dto } as never,
          actor(),
        ),
      );

    it('replacedByConditionId sólo con REFUTED, nunca a sí mismo ni ajeno (422); al descartar queda guardado', async () => {
      const cases: [string, Record<string, unknown>, string][] = [
        [
          net.condition.toConfirm,
          { outcome: 'CONFIRMED', replacedByConditionId: net.condition.base },
          ClinicalErrorReason.CONDITION_REPLACEMENT_REQUIRES_REFUTED,
        ],
        [
          net.condition.toRefute,
          { outcome: 'REFUTED', replacedByConditionId: net.condition.toRefute },
          ClinicalErrorReason.CONDITION_REPLACEMENT_SELF,
        ],
        [
          net.condition.toRefute,
          {
            outcome: 'REFUTED',
            replacedByConditionId: net.condition.otherPatient,
          },
          ClinicalErrorReason.CONDITION_REPLACEMENT_INVALID,
        ],
        [
          net.condition.toRefute,
          {
            outcome: 'REFUTED',
            replacedByConditionId: net.condition.otherTenant,
          },
          ClinicalErrorReason.CONDITION_REPLACEMENT_INVALID,
        ],
      ];
      for (const [id, dto, reason] of cases) {
        const error = await rejectionOf(verify(id, dto));
        expect([error.getStatus(), error.reason]).toEqual([422, reason]);
      }
      const done = await verify(net.condition.toRefute, {
        outcome: 'REFUTED',
        replacedByConditionId: net.condition.base,
      });
      expect(done.replacedByConditionId).toBe(net.condition.base);
      written.push({
        table: 'audit.conditions_history',
        key: 'condition_id',
        id: net.condition.toRefute,
      });
      const { rows } = await owner.query(
        'select replaced_by_condition_id, verification_status_concept_id from clinical.conditions where id = $1',
        [net.condition.toRefute],
      );
      expect(rows[0]).toEqual({
        replaced_by_condition_id: net.condition.base,
        verification_status_concept_id: CLIN.CONDITION_REFUTED,
      });
    });
  });

  describe('informe liberado para quien atiende', () => {
    const read = (
      reportId: string,
      scope: ClinicalReadScope = FULL,
      patient = net.patient,
    ) =>
      asTenant(orm, net.tenantA, () =>
        build().results.getReleasedResult(
          net.tenantA,
          patient,
          reportId,
          scope,
        ),
      );
    const listed = (scope: ClinicalReadScope = FULL) =>
      asTenant(orm, net.tenantA, () =>
        build().list.getPatientOrders(net.tenantA, net.patient, 50, scope),
      ).then((out) => out.reports.map((r) => r.id));
    const expect404 = async (promise: Promise<unknown>) => {
      const error = await rejectionOf(promise);
      expect([error.getStatus(), error.reason]).toEqual([
        404,
        DiagnosticsErrorReason.DIAGNOSTICS_RESOURCE_NOT_AVAILABLE,
      ]);
    };

    it('liberado propio: valores y archivo; sin liberar, de otro paciente u organización → 404', async () => {
      const result = await read(net.report.own);
      expect(result).toMatchObject({
        reportId: net.report.own,
        versionId: net.version.own,
      });
      expect(result.values.map((v) => v.value)).toEqual(['126.0']);
      expect(result.files.map((f) => f.fileId)).toEqual([net.file.own]);
      await expect404(read(net.report.draft));
      await expect404(read(net.report.own, FULL, net.otherPatient));
      await expect404(read(net.report.otherPatient));
      await expect404(read(net.report.otherTenant));
    });

    it('fuera del alcance de lectura: la lista lo oculta y por id es el mismo 404', async () => {
      const cardio = scopeOf([net.specialty]);
      const shown = await listed(cardio);
      expect(shown).toContain(net.report.own);
      expect(shown).not.toContain(net.report.otherSpecialty);
      expect(shown).not.toContain(net.report.labOtherSpecialty);
      await read(net.report.own, cardio);
      await expect404(read(net.report.otherSpecialty, cardio));
      await expect404(read(net.report.labOtherSpecialty, cardio));
      // With the whole record the same reports open.
      await read(net.report.otherSpecialty);
      await read(net.report.labOtherSpecialty);
    });

    it('custodiado por el laboratorio de una orden propia: visible como en la lista; de una orden ajena → 404', async () => {
      const shown = await listed();
      expect(shown).toContain(net.report.lab);
      expect(shown).not.toContain(net.report.labForeignOrder);
      const result = await read(net.report.lab);
      expect(result).toMatchObject({
        reportId: net.report.lab,
        versionId: net.version.lab,
      });
      await expect404(read(net.report.labForeignOrder));
    });

    it('la descarga sirve los bytes del laboratorio con nosniff y no-store; un archivo ajeno a la versión → 404', async () => {
      const headers = new Map<string, string>();
      let body: Buffer | undefined;
      const res = {
        setHeader: (k: string, v: string) => headers.set(k, v),
        send: (b: Buffer) => (body = b),
      };
      await asTenant(orm, net.tenantA, () =>
        build().controller.getReleasedResultFileContent(
          net.patient,
          net.report.lab,
          net.file.lab,
          res as never,
          FULL,
        ),
      );
      expect(body?.toString()).toBe('%PDF-1.4 red');
      expect(headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(headers.get('Cache-Control')).toBe('private, no-store');
      expect(headers.get('Content-Type')).toBe('application/pdf');
      await expect404(
        asTenant(orm, net.tenantA, () =>
          build().results.getReleasedResultFileContent(
            net.tenantA,
            net.patient,
            net.report.lab,
            net.file.own,
            FULL,
          ),
        ),
      );
    });
  });
});
