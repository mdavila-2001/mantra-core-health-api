import { jest } from '@jest/globals';
import { CONCEPTS } from '../../../common';
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
