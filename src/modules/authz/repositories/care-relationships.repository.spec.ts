import { jest } from '@jest/globals';
import { CONCEPTS } from '../../../common';
import { AUTHZ } from '../authz.concepts';
import { CareRelationships } from '../entities';
import { CareRelationshipsRepository } from './care-relationships.repository';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const AT = new Date('2026-10-26T12:00:00.000Z');
const PAYMENT = 'purpose-payment';

function build(rows: number) {
  const em = { count: mockFn(() => Promise.resolve(rows)) };
  return { em, repo: new CareRelationshipsRepository() };
}

describe('CareRelationshipsRepository.hasActiveInTenantAt', () => {
  it('hay relación vigente en el tenant: true', async () => {
    const d = build(1);
    await expect(
      d.repo.hasActiveInTenantAt(d.em as any, {
        patientProfileId: 'pat-1',
        tenantId: 't1',
        at: AT,
      }),
    ).resolves.toBe(true);
  });

  it('ninguna fila: false', async () => {
    const d = build(0);
    await expect(
      d.repo.hasActiveInTenantAt(d.em as any, {
        patientProfileId: 'pat-1',
        tenantId: 't1',
        at: AT,
      }),
    ).resolves.toBe(false);
  });

  it('filtra por paciente, tenant propio de la fila, estado ACTIVE y ventana [validFrom, validTo)', async () => {
    const d = build(1);
    await d.repo.hasActiveInTenantAt(d.em as any, {
      patientProfileId: 'pat-1',
      tenantId: 't1',
      at: AT,
    });
    expect(d.em.count).toHaveBeenCalledWith(CareRelationships, {
      patientProfileId: 'pat-1',
      tenantId: 't1',
      statusConceptId: CONCEPTS.STATE_ACTIVE,
      validFrom: { $lte: AT },
      $and: [
        { $or: [{ validTo: null }, { validTo: { $gt: AT } }] },
        { $or: [{ purposeConceptId: null }] },
      ],
    });
  });

  it('sin propósito pedido sólo cuentan las relaciones sin acotar', async () => {
    const d = build(1);
    await d.repo.hasActiveInTenantAt(d.em as any, {
      patientProfileId: 'pat-1',
      tenantId: 't1',
      at: AT,
    });
    const filter = d.em.count.mock.calls[0][1];
    expect(filter.$and[1]).toEqual({ $or: [{ purposeConceptId: null }] });
  });

  it('con propósito pedido cuentan las sin acotar y las acotadas a ese propósito', async () => {
    const d = build(1);
    await d.repo.hasActiveInTenantAt(d.em as any, {
      patientProfileId: 'pat-1',
      tenantId: 't1',
      at: AT,
      purposeConceptId: PAYMENT,
    });
    const filter = d.em.count.mock.calls[0][1];
    expect(filter.$and[1]).toEqual({
      $or: [{ purposeConceptId: null }, { purposeConceptId: PAYMENT }],
    });
  });
});

describe('CareRelationshipsRepository.findAllByPatient', () => {
  it('«quién ve mi historia» no trae las pendientes ni las rechazadas, que nunca concedieron nada', async () => {
    const em = { find: mockFn(() => Promise.resolve([])) };

    await new CareRelationshipsRepository().findAllByPatient(
      em as any,
      'pat-1',
    );

    expect(em.find).toHaveBeenCalledWith(
      CareRelationships,
      {
        patientProfileId: 'pat-1',
        statusConceptId: {
          $nin: [CONCEPTS.STATE_PENDING, AUTHZ.CARE_REL_STATUS_DECLINED],
        },
      },
      expect.any(Object),
    );
  });
});

describe('CareRelationshipsRepository cabecera', () => {
  it('las cabeceras activas se buscan por paciente y tenant', async () => {
    const em = { find: mockFn(() => Promise.resolve([])) };

    await new CareRelationshipsRepository().findActivePrimaryInTenant(
      em as any,
      'pat-1',
      't1',
    );

    expect(em.find).toHaveBeenCalledWith(CareRelationships, {
      patientProfileId: 'pat-1',
      tenantId: 't1',
      relationshipTypeConceptId: AUTHZ.CARE_REL_PRIMARY,
      statusConceptId: CONCEPTS.STATE_ACTIVE,
    });
  });

  it('un duplicado de cabecera es una PRIMARY activa o pendiente del mismo par, no cualquier tipo', async () => {
    const em = { findOne: mockFn(() => Promise.resolve(null)) };

    await new CareRelationshipsRepository().findOpenPrimaryOfPair(
      em as any,
      'pat-1',
      'prac-1',
      't1',
    );

    expect(em.findOne).toHaveBeenCalledWith(CareRelationships, {
      patientProfileId: 'pat-1',
      practitionerProfileId: 'prac-1',
      tenantId: 't1',
      relationshipTypeConceptId: AUTHZ.CARE_REL_PRIMARY,
      statusConceptId: { $in: [CONCEPTS.STATE_ACTIVE, CONCEPTS.STATE_PENDING] },
    });
  });
});
