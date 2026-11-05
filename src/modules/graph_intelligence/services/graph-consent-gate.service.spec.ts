import { jest } from '@jest/globals';
import { GraphConsentGate } from './graph-consent-gate.service';
import { CONS } from '../../consent/consent.concepts';
import {
  Consents,
  PrivacyRestrictions,
  ProcessingPurposes,
} from '../../consent/entities';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const TENANT = '11111111-1111-1111-1111-111111111111';
const OTHER_TENANT = '99999999-9999-9999-9999-999999999999';
const PATIENT = '88888888-8888-8888-8888-888888888888';
const PURPOSE_ID = '77777777-7777-7777-7777-777777777777';
const ACTOR = 'user-1';
const NOW = new Date('2026-06-01T12:00:00Z');
const PAST = new Date('2026-01-01T00:00:00Z');
const FUTURE = new Date('2027-01-01T00:00:00Z');

const QUERY = {
  tenantId: TENANT,
  patientProfileId: PATIENT,
  purposeOfUse: 'FRAUD_INVESTIGATION',
  actorId: ACTOR,
  now: NOW,
};

/**
 * Construye una EntityManager falso con las filas de consent indicadas.
 *
 * @param rows - Propósito, consentimientos y restricciones persistidos.
 * @returns EntityManager falso y espías de sus consultas.
 */
function build(rows: {
  purpose?: unknown;
  consents?: any[];
  restrictions?: any[];
}) {
  const em = {
    findOne: mockFn(async (entity: unknown) =>
      entity === ProcessingPurposes ? (rows.purpose ?? null) : null,
    ),
    find: mockFn(async (entity: unknown, where: any) => {
      if (entity === Consents) {
        return (rows.consents ?? []).filter(
          (row) =>
            row.tenantId === where.tenantId &&
            row.patientProfileId === where.patientProfileId &&
            row.processingPurposeId === where.processingPurposeId &&
            row.statusConceptId === where.statusConceptId,
        );
      }
      if (entity === PrivacyRestrictions) {
        return (rows.restrictions ?? []).filter(
          (row) =>
            row.tenantId === where.tenantId &&
            row.patientProfileId === where.patientProfileId &&
            row.statusConceptId === where.statusConceptId,
        );
      }
      return [];
    }),
  };
  return { gate: new GraphConsentGate(), em };
}

const purpose = { id: PURPOSE_ID, code: 'FRAUD_INVESTIGATION' };

/**
 * Fila de consentimiento activo del paciente en el tenant.
 *
 * @param overrides - Campos a sobreescribir.
 * @returns Consentimiento de prueba.
 */
function consent(overrides: any = {}) {
  return {
    patientProfileId: PATIENT,
    tenantId: TENANT,
    processingPurposeId: PURPOSE_ID,
    statusConceptId: CONS.CONSENT_ACTIVE,
    validFrom: PAST,
    validTo: FUTURE,
    ...overrides,
  };
}

/**
 * Fila de restricción de privacidad activa del paciente en el tenant.
 *
 * @param overrides - Campos a sobreescribir.
 * @returns Restricción de prueba.
 */
function restriction(overrides: any = {}) {
  return {
    patientProfileId: PATIENT,
    tenantId: TENANT,
    statusConceptId: CONS.RESTRICTION_ACTIVE,
    ...overrides,
  };
}

/**
 * Afirma la denegación única: 403, FORBIDDEN, `GRAPH_CONSENT_REQUIRED`, sin details.
 *
 * @param promise - Evaluación de la compuerta.
 */
async function expectDenied(promise: Promise<unknown>): Promise<void> {
  const error: any = await promise.then(
    () => undefined,
    (e: unknown) => e,
  );
  expect(error).toBeDefined();
  expect(error.getStatus()).toBe(403);
  expect(error.code).toBe('FORBIDDEN');
  expect(error.reason).toBe('GRAPH_CONSENT_REQUIRED');
  expect(error.details).toBeUndefined();
}

describe('GraphConsentGate (GRAPH-02)', () => {
  it('permite con consentimiento activo para el propósito y sin restricciones', async () => {
    const d = build({ purpose, consents: [consent()] });
    await expect(
      d.gate.assertAllowed(d.em as any, QUERY),
    ).resolves.toBeUndefined();
  });

  it('permite un consentimiento sin ventana de vigencia declarada', async () => {
    const d = build({
      purpose,
      consents: [consent({ validFrom: undefined, validTo: undefined })],
    });
    await expect(
      d.gate.assertAllowed(d.em as any, QUERY),
    ).resolves.toBeUndefined();
  });

  it('niega si el paciente no tiene consentimiento activo (revocado o inexistente)', async () => {
    const d = build({
      purpose,
      consents: [consent({ statusConceptId: CONS.CONSENT_WITHDRAWN })],
    });
    await expectDenied(d.gate.assertAllowed(d.em as any, QUERY));
  });

  it('niega si el consentimiento tiene retiro registrado aunque el estado siga activo', async () => {
    const d = build({
      purpose,
      consents: [consent({ withdrawnAt: PAST })],
    });
    await expectDenied(d.gate.assertAllowed(d.em as any, QUERY));
  });

  it('niega un consentimiento vencido o que aún no rige', async () => {
    await expectDenied(
      (() => {
        const d = build({ purpose, consents: [consent({ validTo: PAST })] });
        return d.gate.assertAllowed(d.em as any, QUERY);
      })(),
    );
    const early = build({
      purpose,
      consents: [consent({ validFrom: FUTURE, validTo: undefined })],
    });
    await expectDenied(early.gate.assertAllowed(early.em as any, QUERY));
  });

  it('niega el consentimiento de otro propósito (restricción específica de propósito)', async () => {
    const d = build({
      purpose,
      consents: [consent({ processingPurposeId: 'otro-proposito' })],
    });
    await expectDenied(d.gate.assertAllowed(d.em as any, QUERY));
  });

  it('niega si el propósito declarado no existe en el catálogo', async () => {
    const d = build({ purpose: null, consents: [consent()] });
    await expectDenied(d.gate.assertAllowed(d.em as any, QUERY));
    expect(d.em.find).not.toHaveBeenCalled();
  });

  it('niega el consentimiento de otro tenant o sin tenant (deny by default)', async () => {
    const foreign = build({
      purpose,
      consents: [consent({ tenantId: OTHER_TENANT })],
    });
    await expectDenied(foreign.gate.assertAllowed(foreign.em as any, QUERY));
    const untenanted = build({
      purpose,
      consents: [consent({ tenantId: undefined })],
    });
    await expectDenied(
      untenanted.gate.assertAllowed(untenanted.em as any, QUERY),
    );
  });

  it('niega si hay una restricción de privacidad activa sin destinatario', async () => {
    const d = build({
      purpose,
      consents: [consent()],
      restrictions: [restriction()],
    });
    await expectDenied(d.gate.assertAllowed(d.em as any, QUERY));
  });

  it('niega si la restricción activa está dirigida al propio actor', async () => {
    const d = build({
      purpose,
      consents: [consent()],
      restrictions: [restriction({ targetActorId: ACTOR })],
    });
    await expectDenied(d.gate.assertAllowed(d.em as any, QUERY));
  });

  it('no aplica una restricción dirigida a otro actor, ni una vencida o revocada', async () => {
    const d = build({
      purpose,
      consents: [consent()],
      restrictions: [
        restriction({ targetActorId: 'otro-actor' }),
        restriction({ validTo: PAST }),
        restriction({ statusConceptId: CONS.RESTRICTION_REVOKED }),
      ],
    });
    await expect(
      d.gate.assertAllowed(d.em as any, QUERY),
    ).resolves.toBeUndefined();
  });

  it('todas las denegaciones responden igual (no revelan el motivo)', async () => {
    const revoked = build({
      purpose,
      consents: [consent({ statusConceptId: CONS.CONSENT_WITHDRAWN })],
    });
    const restricted = build({
      purpose,
      consents: [consent()],
      restrictions: [restriction()],
    });
    const a: any = await revoked.gate
      .assertAllowed(revoked.em as any, QUERY)
      .catch((e: unknown) => e);
    const b: any = await restricted.gate
      .assertAllowed(restricted.em as any, QUERY)
      .catch((e: unknown) => e);
    expect(a.getResponse()).toEqual(b.getResponse());
  });
});
