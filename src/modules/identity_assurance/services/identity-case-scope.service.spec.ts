import { jest } from '@jest/globals';
import { IdentityCaseScope } from './identity-case-scope.service';
import { ResourceNotFoundException } from '../../../common';
import { Files } from '../../common/entities/files.entity';
import { Consents } from '../../consent/entities/consents.entity';
import { TenantMemberships } from '../../directory/entities/tenant_memberships.entity';
import { JurisdictionAuthorizations } from '../../profiles/entities/jurisdiction_authorizations.entity';
import { PersonAccountLinks } from '../../profiles/entities/person_account_links.entity';
import { IdentityAuthorities } from '../entities/identity_authorities.entity';
import { IDA } from '../identity_assurance.concepts';
import { IdentityAssuranceErrorReason } from '../identity_assurance.error-reasons';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const T1 = '11111111-1111-4111-8111-111111111111';
const T2 = '22222222-2222-4222-8222-222222222222';
const PERSON = 'person-1';
const USER = 'user-1';
const PAST = new Date('2020-01-01');
const FUTURE = new Date('2099-01-01');

/**
 * Construye la política con una base falsa.
 *
 * @param rows - Filas que ve cada consulta.
 * @returns Política, transacción falsa y repositorio de casos falso.
 */
function build(
  rows: {
    links?: any[];
    memberships?: any[];
    authorization?: any;
    file?: any;
    consent?: any;
    authority?: any;
    kase?: any;
  } = {},
) {
  const tx = {
    find: mockFn(async (entity: unknown, where: any) => {
      if (entity === PersonAccountLinks) {
        return (rows.links ?? []).filter((l) => l.personId === where.personId);
      }
      if (entity === TenantMemberships) {
        return (rows.memberships ?? []).filter(
          (m) =>
            where.userId.$in.includes(m.userId) &&
            m.tenantId === where.tenantId,
        );
      }
      return [];
    }),
    findOne: mockFn(async (entity: unknown) => {
      if (entity === JurisdictionAuthorizations) return rows.authorization;
      if (entity === Files) return rows.file;
      if (entity === Consents) return rows.consent;
      if (entity === IdentityAuthorities) return rows.authority;
      return null;
    }),
  };
  const casesRepo = { findById: mockFn(async () => rows.kase ?? null) };
  return { scope: new IdentityCaseScope(casesRepo as any), tx, casesRepo };
}

const link = (overrides: any = {}) => ({
  personId: PERSON,
  userId: USER,
  validFrom: PAST,
  validTo: FUTURE,
  ...overrides,
});
const membership = (overrides: any = {}) => ({
  userId: USER,
  tenantId: T1,
  startDate: PAST,
  endDate: FUTURE,
  ...overrides,
});
const patientCase = (overrides: any = {}) => ({
  id: 'k1',
  subjectTypeConceptId: IDA.SUBJECT_PATIENT_IDENTITY,
  subjectEntityId: PERSON,
  ...overrides,
});

/**
 * Afirma que la promesa falla como "no existe": 404, el `reason` dado y sin `details`.
 *
 * @param promise - Operación bajo prueba.
 * @param reason - Sub-código esperado.
 */
async function expectNotAvailable(
  promise: Promise<unknown>,
  reason: IdentityAssuranceErrorReason,
): Promise<void> {
  const error: any = await promise.then(
    () => undefined,
    (e: unknown) => e,
  );
  expect(error).toBeInstanceOf(ResourceNotFoundException);
  expect(error.getStatus()).toBe(404);
  expect(error.code).toBe('NOT_FOUND');
  expect(error.reason).toBe(reason);
  expect(error.details).toBeUndefined();
}

describe('IdentityCaseScope (IDA-01)', () => {
  describe('subjectInTenant', () => {
    it('un tenant es sujeto de sí mismo y de ningún otro', async () => {
      const d = build();
      const subject = {
        subjectTypeConceptId: IDA.SUBJECT_TENANT_IDENTITY,
        subjectEntityId: T1,
      };
      await expect(
        d.scope.subjectInTenant(d.tx as any, subject, T1),
      ).resolves.toBe(true);
      await expect(
        d.scope.subjectInTenant(d.tx as any, subject, T2),
      ).resolves.toBe(false);
    });

    it('una persona pertenece al tenant si su cuenta activa tiene membresía vigente allí', async () => {
      const d = build({ links: [link()], memberships: [membership()] });
      await expect(
        d.scope.subjectInTenant(d.tx as any, patientCase(), T1),
      ).resolves.toBe(true);
    });

    it('una persona con membresía sólo en T2 no pertenece a T1', async () => {
      const d = build({
        links: [link()],
        memberships: [membership({ tenantId: T2 })],
      });
      await expect(
        d.scope.subjectInTenant(d.tx as any, patientCase(), T1),
      ).resolves.toBe(false);
    });

    it('no cuenta una cuenta vencida ni una membresía vencida', async () => {
      const expiredLink = build({
        links: [link({ validTo: PAST })],
        memberships: [membership()],
      });
      await expect(
        expiredLink.scope.subjectInTenant(
          expiredLink.tx as any,
          patientCase(),
          T1,
        ),
      ).resolves.toBe(false);
      const expiredMembership = build({
        links: [link()],
        memberships: [membership({ endDate: PAST })],
      });
      await expect(
        expiredMembership.scope.subjectInTenant(
          expiredMembership.tx as any,
          patientCase(),
          T1,
        ),
      ).resolves.toBe(false);
    });

    it('una persona sin cuenta enlazada queda fuera de alcance', async () => {
      const d = build({ memberships: [membership()] });
      await expect(
        d.scope.subjectInTenant(d.tx as any, patientCase(), T1),
      ).resolves.toBe(false);
    });

    it('una matrícula profesional se resuelve a su profesional', async () => {
      const d = build({
        authorization: { id: 'auth-1', practitionerProfileId: PERSON },
        links: [link()],
        memberships: [membership()],
      });
      await expect(
        d.scope.subjectInTenant(
          d.tx as any,
          {
            subjectTypeConceptId: IDA.SUBJECT_PRACTITIONER_LICENSE,
            subjectEntityId: 'auth-1',
          },
          T1,
        ),
      ).resolves.toBe(true);
    });

    it('una matrícula inexistente o una clase de sujeto desconocida se deniegan', async () => {
      const d = build({ links: [link()], memberships: [membership()] });
      await expect(
        d.scope.subjectInTenant(
          d.tx as any,
          {
            subjectTypeConceptId: IDA.SUBJECT_PRACTITIONER_LICENSE,
            subjectEntityId: 'missing',
          },
          T1,
        ),
      ).resolves.toBe(false);
      await expect(
        d.scope.subjectInTenant(
          d.tx as any,
          { subjectTypeConceptId: 'otro', subjectEntityId: PERSON },
          T1,
        ),
      ).resolves.toBe(false);
    });
  });

  describe('loadAuthorizedCase', () => {
    it('devuelve el caso del tenant', async () => {
      const kase = patientCase();
      const d = build({
        kase,
        links: [link()],
        memberships: [membership()],
      });
      await expect(
        d.scope.loadAuthorizedCase(d.tx as any, 'k1', T1),
      ).resolves.toBe(kase);
    });

    it('un caso de T2 pedido por T1 responde 404 / IDENTITY_CASE_NOT_AVAILABLE', async () => {
      const d = build({
        kase: patientCase(),
        links: [link()],
        memberships: [membership({ tenantId: T2 })],
      });
      await expectNotAvailable(
        d.scope.loadAuthorizedCase(d.tx as any, 'k1', T1),
        IdentityAssuranceErrorReason.CASE_NOT_AVAILABLE,
      );
    });

    it('un caso ajeno y uno inexistente responden idéntico', async () => {
      const foreign = build({ kase: patientCase() });
      const missing = build({ kase: null });
      const a: any = await foreign.scope
        .loadAuthorizedCase(foreign.tx as any, 'k1', T1)
        .catch((e) => e);
      const b: any = await missing.scope
        .loadAuthorizedCase(missing.tx as any, 'k1', T1)
        .catch((e) => e);
      expect(a.getResponse()).toEqual(b.getResponse());
    });
  });

  describe('assertSubjectInTenant', () => {
    it('acepta el sujeto del tenant y rechaza el ajeno con IDENTITY_SUBJECT_NOT_AVAILABLE', async () => {
      const own = build({ links: [link()], memberships: [membership()] });
      await expect(
        own.scope.assertSubjectInTenant(own.tx as any, patientCase(), T1),
      ).resolves.toBeUndefined();
      const foreign = build();
      await expectNotAvailable(
        foreign.scope.assertSubjectInTenant(
          foreign.tx as any,
          patientCase(),
          T1,
        ),
        IdentityAssuranceErrorReason.SUBJECT_NOT_AVAILABLE,
      );
    });
  });

  describe('referencias de la evidencia', () => {
    it('acepta una autoridad del tenant, ninguna autoridad citada, y rechaza la de T2', async () => {
      const own = build({ authority: { id: 'a', tenantId: T1 } });
      await expect(
        own.scope.assertAuthorityInTenant(own.tx as any, 'a', T1),
      ).resolves.toBeUndefined();
      await expect(
        own.scope.assertAuthorityInTenant(own.tx as any, undefined, T1),
      ).resolves.toBeUndefined();
      const foreign = build({ authority: { id: 'a', tenantId: T2 } });
      await expectNotAvailable(
        foreign.scope.assertAuthorityInTenant(foreign.tx as any, 'a', T1),
        IdentityAssuranceErrorReason.AUTHORITY_NOT_AVAILABLE,
      );
    });

    it('un archivo de T2 no se puede enlazar como evidencia', async () => {
      const own = build({ file: { id: 'f', tenantId: T1 } });
      await expect(
        own.scope.assertEvidenceReferences(
          own.tx as any,
          patientCase(),
          { evidenceFileId: 'f' },
          T1,
        ),
      ).resolves.toBeUndefined();
      const foreign = build({ file: { id: 'f', tenantId: T2 } });
      await expectNotAvailable(
        foreign.scope.assertEvidenceReferences(
          foreign.tx as any,
          patientCase(),
          { evidenceFileId: 'f' },
          T1,
        ),
        IdentityAssuranceErrorReason.EVIDENCE_FILE_NOT_AVAILABLE,
      );
    });

    it('el consentimiento debe ser del tenant y, para un paciente, del propio sujeto', async () => {
      const ok = build({
        consent: { id: 'c', tenantId: T1, patientProfileId: PERSON },
      });
      await expect(
        ok.scope.assertEvidenceReferences(
          ok.tx as any,
          patientCase(),
          { collectedUnderConsentId: 'c' },
          T1,
        ),
      ).resolves.toBeUndefined();

      for (const consent of [
        { id: 'c', tenantId: T2, patientProfileId: PERSON },
        { id: 'c', tenantId: T1, patientProfileId: 'otro-paciente' },
        null,
      ]) {
        const bad = build({ consent });
        await expectNotAvailable(
          bad.scope.assertEvidenceReferences(
            bad.tx as any,
            patientCase(),
            { collectedUnderConsentId: 'c' },
            T1,
          ),
          IdentityAssuranceErrorReason.CONSENT_NOT_AVAILABLE,
        );
      }
    });
  });

  describe('filterToTenant', () => {
    it('deja los casos del tenant, conserva el orden y consulta una vez por sujeto', async () => {
      const d = build({ links: [link()], memberships: [membership()] });
      const own1 = patientCase({ id: 'a' });
      const own2 = patientCase({ id: 'b' });
      const foreign = patientCase({ id: 'c', subjectEntityId: 'otra-persona' });
      const kept = await d.scope.filterToTenant(
        d.tx as any,
        [own1, foreign, own2] as any,
        T1,
      );
      expect(kept.map((k) => k.id)).toEqual(['a', 'b']);
      const linkQueries = d.tx.find.mock.calls.filter(
        ([entity]: [unknown]) => entity === PersonAccountLinks,
      );
      expect(linkQueries).toHaveLength(2);
    });
  });
});
