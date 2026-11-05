import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { LocationConsentPolicy } from './location-consent.policy';
import { CONCEPTS } from '../../../common';
import { CONS } from '../../consent/consent.concepts';
import { Consents, ProcessingPurposes } from '../../consent/entities';
import { Devices } from '../../iam/entities';
import { PersonAccountLinks } from '../../profiles/entities';
import { PROF } from '../../profiles/profiles.concepts';

const TENANT = '11111111-1111-1111-1111-111111111111';
const OTHER_TENANT = '99999999-9999-9999-9999-999999999999';
const CONSENT = '22222222-2222-2222-2222-222222222222';
const PATIENT = '33333333-3333-3333-3333-333333333333';
const OTHER_PATIENT = '44444444-4444-4444-4444-444444444444';
const PURPOSE = '55555555-5555-5555-5555-555555555555';
const USER = '66666666-6666-6666-6666-666666666666';
const DEVICE = '77777777-7777-7777-7777-777777777777';
const NOW = new Date('2026-06-15T12:00:00.000Z');

const INVALID = {
  status: 403,
  code: 'FORBIDDEN',
  reason: 'TIME_SERIES_LOCATION_CONSENT_INVALID',
};

/**
 * Consentimiento de ubicación vigente del paciente; `overrides` lo altera.
 *
 * @param overrides - Campos a sustituir.
 * @returns El consentimiento de prueba.
 */
function consent(overrides: Record<string, unknown> = {}): any {
  return {
    id: CONSENT,
    tenantId: TENANT,
    patientProfileId: PATIENT,
    processingPurposeId: PURPOSE,
    statusConceptId: CONS.CONSENT_ACTIVE,
    validFrom: new Date('2026-01-01T00:00:00.000Z'),
    validTo: new Date('2026-12-31T00:00:00.000Z'),
    ...overrides,
  };
}

/**
 * Construye la política con un EntityManager que responde por entidad.
 *
 * @param data - Filas que devuelve cada consulta.
 * @returns La política, el logger y el EntityManager de prueba.
 */
function build(
  data: {
    consent?: any;
    purpose?: any;
    links?: any[];
    devices?: any[];
  } = {},
) {
  const rows = {
    consent: 'consent' in data ? data.consent : consent(),
    purpose:
      'purpose' in data
        ? data.purpose
        : {
            id: PURPOSE,
            code: 'LOCATION_TRACKING',
            statusConceptId: CONCEPTS.STATE_ACTIVE,
          },
    links: data.links ?? [{ userId: USER, statusConceptId: 'x' }],
    devices: data.devices ?? [{ id: DEVICE, userId: USER }],
  };
  const em: any = {
    findOne: mockFn(async (entity: unknown) =>
      entity === Consents
        ? rows.consent
        : entity === ProcessingPurposes
          ? rows.purpose
          : null,
    ),
    find: mockFn(async (entity: unknown) =>
      entity === PersonAccountLinks
        ? rows.links
        : entity === Devices
          ? rows.devices
          : [],
    ),
  };
  const logger = { setContext: mockFn(), warn: mockFn() };
  return { policy: new LocationConsentPolicy(logger as any), em, logger };
}

const base = {
  tenantId: TENANT,
  consentId: CONSENT,
  subjectIds: [PATIENT],
  capturedFrom: new Date('2026-06-15T11:00:00.000Z'),
  capturedTo: new Date('2026-06-15T11:30:00.000Z'),
  now: NOW,
};

describe('LocationConsentPolicy (TS-01)', () => {
  it('correcto: consentimiento activo del titular para ubicación', async () => {
    const d = build();
    await expect(d.policy.assertAllowed(d.em, base)).resolves.toBeUndefined();
  });

  it('correcto: un dispositivo de la cuenta vinculada al titular es sujeto válido', async () => {
    const d = build();
    await expect(
      d.policy.assertAllowed(d.em, { ...base, subjectIds: [DEVICE, PATIENT] }),
    ).resolves.toBeUndefined();
    expect(d.em.find).toHaveBeenCalledWith(Devices, {
      userId: { $in: [USER] },
    });
  });

  it('el vínculo de cuenta consultado es el vigente del titular', async () => {
    const d = build();
    await d.policy.assertAllowed(d.em, { ...base, subjectIds: [DEVICE] });
    expect(d.em.find).toHaveBeenCalledWith(PersonAccountLinks, {
      personId: PATIENT,
      statusConceptId: PROF.ACCOUNT_LINK_ACTIVE,
    });
  });

  it('límite: valid_to es exclusivo; un ping un milisegundo antes entra, uno exacto no', async () => {
    const validTo = new Date('2026-06-15T13:00:00.000Z');
    const d = build({ consent: consent({ validTo }) });

    await expect(
      d.policy.assertAllowed(d.em, {
        ...base,
        capturedTo: new Date(validTo.getTime() - 1),
      }),
    ).resolves.toBeUndefined();
    await expect(
      d.policy.assertAllowed(d.em, { ...base, capturedTo: validTo }),
    ).rejects.toMatchObject(INVALID);
  });

  it('límite: vence antes de la ingesta => rechaza aunque los pings fueran del periodo vigente', async () => {
    const d = build({
      consent: consent({ validTo: new Date('2026-06-15T11:45:00.000Z') }),
    });
    await expect(d.policy.assertAllowed(d.em, base)).rejects.toMatchObject(
      INVALID,
    );
  });

  it('límite: un ping anterior a valid_from no está amparado', async () => {
    const d = build({
      consent: consent({ validFrom: new Date('2026-06-15T11:10:00.000Z') }),
    });
    await expect(d.policy.assertAllowed(d.em, base)).rejects.toMatchObject(
      INVALID,
    );
  });

  it.each([
    ['inexistente', { consent: null }],
    ['de otro tenant', { consent: consent({ tenantId: OTHER_TENANT }) }],
    ['sin tenant', { consent: consent({ tenantId: undefined }) }],
    [
      'revocado',
      {
        consent: consent({
          statusConceptId: CONS.CONSENT_WITHDRAWN,
          withdrawnAt: NOW,
        }),
      },
    ],
    ['con retiro registrado', { consent: consent({ withdrawnAt: NOW }) }],
    [
      'aún no vigente',
      { consent: consent({ validFrom: new Date('2026-07-01T00:00:00.000Z') }) },
    ],
    [
      'de un propósito que no es ubicación',
      {
        purpose: {
          id: PURPOSE,
          code: 'GENERAL_CARE',
          statusConceptId: CONCEPTS.STATE_ACTIVE,
        },
      },
    ],
    [
      'con propósito inactivo',
      {
        purpose: {
          id: PURPOSE,
          code: 'LOCATION_TRACKING',
          statusConceptId: CONCEPTS.STATE_REVOKED,
        },
      },
    ],
    ['sin propósito', { purpose: null }],
  ])('error: consentimiento %s => 403 uniforme', async (_label, data) => {
    const d = build(data as any);
    await expect(d.policy.assertAllowed(d.em, base)).rejects.toMatchObject(
      INVALID,
    );
  });

  it('error: sujeto de otra persona => 403 aunque el consentimiento sea válido', async () => {
    const d = build();
    await expect(
      d.policy.assertAllowed(d.em, { ...base, subjectIds: [OTHER_PATIENT] }),
    ).rejects.toMatchObject(INVALID);
  });

  it('error: un solo sujeto ajeno invalida todo el lote', async () => {
    const d = build();
    await expect(
      d.policy.assertAllowed(d.em, {
        ...base,
        subjectIds: [PATIENT, OTHER_PATIENT],
      }),
    ).rejects.toMatchObject(INVALID);
  });

  it('error: un vínculo de cuenta vencido no aporta dispositivos', async () => {
    const d = build({
      links: [{ userId: USER, validTo: new Date('2026-01-01T00:00:00.000Z') }],
    });
    await expect(
      d.policy.assertAllowed(d.em, { ...base, subjectIds: [DEVICE] }),
    ).rejects.toMatchObject(INVALID);
  });

  it('todas las denegaciones son idénticas y no revelan consentimiento ni sujeto', async () => {
    const failures = await Promise.all(
      [
        build({ consent: null }),
        build({ consent: consent({ tenantId: OTHER_TENANT }) }),
        build({ consent: consent({ withdrawnAt: NOW }) }),
      ].map((d) => d.policy.assertAllowed(d.em, base).catch((e: any) => e)),
    );
    const bodies = failures.map((e) => JSON.stringify(e.getResponse()));
    expect(new Set(bodies).size).toBe(1);
    expect(bodies[0]).not.toContain(CONSENT);
    expect(bodies[0]).not.toContain(PATIENT);
    expect(failures[0].details).toBeUndefined();
  });

  it('registra sólo el código estable y la comprobación, nunca ids', async () => {
    const d = build({ consent: null });
    await d.policy.assertAllowed(d.em, base).catch(() => undefined);
    const [context] = d.logger.warn.mock.calls[0];
    expect(context).toEqual({
      operation: 'ts.ingest.location',
      reason: 'TIME_SERIES_LOCATION_CONSENT_INVALID',
      check: 'consent',
    });
  });
});
