import { jest } from '@jest/globals';
import { InvoicesRepository } from './invoices.repository';
import { InvoiceLines } from '../entities';
import { ClaimDisputes, InsuranceClaimLines } from '../../insurance/entities';
import { INS } from '../../insurance/domain/insurance.concepts';

const fn = () => jest.fn<(...args: any[]) => any>();

/**
 * Pausa derivada del cobro (carril 16, REQ-16-032): una factura está en pausa
 * mientras un reclamo vinculado a sus líneas tenga una objeción del paciente
 * sin resolver. La consulta se prueba con una base falsa que registra qué se
 * pregunta; la prueba contra PostgreSQL real está en el spec de integración.
 */
describe('InvoicesRepository.hasOpenPatientObjection', () => {
  function build(options: {
    invoiceLines?: Array<{ insuranceClaimLineId: string }>;
    claimLines?: Array<{ id: string; insuranceClaimId: string }>;
    openDisputes?: number;
  }) {
    const em = {
      find: fn().mockImplementation(async (entity: unknown) => {
        if (entity === InvoiceLines) return options.invoiceLines ?? [];
        if (entity === InsuranceClaimLines) return options.claimLines ?? [];
        return [];
      }),
      count: fn().mockResolvedValue(options.openDisputes ?? 0),
    };
    return { em, repository: new InvoicesRepository() };
  }

  it('una factura sin líneas vinculadas a un reclamo no está en pausa y no consulta disputas', async () => {
    const { em, repository } = build({ invoiceLines: [] });
    await expect(
      repository.hasOpenPatientObjection(em as never, 'inv-1'),
    ).resolves.toBe(false);
    expect(em.count).not.toHaveBeenCalled();
    expect(em.find).toHaveBeenCalledTimes(1);
  });

  it('busca sólo las líneas de esa factura que tienen vínculo', async () => {
    const { em, repository } = build({});
    await repository.hasOpenPatientObjection(em as never, 'inv-1');
    expect(em.find).toHaveBeenCalledWith(InvoiceLines, {
      invoiceId: 'inv-1',
      insuranceClaimLineId: { $ne: null },
    });
  });

  it('con objeción abierta del paciente: en pausa', async () => {
    const { em, repository } = build({
      invoiceLines: [{ insuranceClaimLineId: 'cl-1' }],
      claimLines: [{ id: 'cl-1', insuranceClaimId: 'claim-1' }],
      openDisputes: 1,
    });
    await expect(
      repository.hasOpenPatientObjection(em as never, 'inv-1'),
    ).resolves.toBe(true);
  });

  it('sin objeciones abiertas: no está en pausa', async () => {
    const { em, repository } = build({
      invoiceLines: [{ insuranceClaimLineId: 'cl-1' }],
      claimLines: [{ id: 'cl-1', insuranceClaimId: 'claim-1' }],
      openDisputes: 0,
    });
    await expect(
      repository.hasOpenPatientObjection(em as never, 'inv-1'),
    ).resolves.toBe(false);
  });

  it('sólo cuentan las objeciones del paciente sin resolver, no las apelaciones del prestador', async () => {
    const { em, repository } = build({
      invoiceLines: [{ insuranceClaimLineId: 'cl-1' }],
      claimLines: [{ id: 'cl-1', insuranceClaimId: 'claim-1' }],
      openDisputes: 1,
    });
    await repository.hasOpenPatientObjection(em as never, 'inv-1');
    expect(em.count).toHaveBeenCalledWith(ClaimDisputes, {
      insuranceClaimId: { $in: ['claim-1'] },
      disputeTypeConceptId: INS.DISPUTE_TYPE_PATIENT_OBJECTION,
      statusConceptId: { $ne: INS.DISPUTE_RESOLVED },
    });
  });

  it('varias líneas del mismo reclamo consultan ese reclamo una sola vez', async () => {
    const { em, repository } = build({
      invoiceLines: [
        { insuranceClaimLineId: 'cl-1' },
        { insuranceClaimLineId: 'cl-2' },
      ],
      claimLines: [
        { id: 'cl-1', insuranceClaimId: 'claim-1' },
        { id: 'cl-2', insuranceClaimId: 'claim-1' },
      ],
    });
    await repository.hasOpenPatientObjection(em as never, 'inv-1');
    expect(em.count.mock.calls[0][1].insuranceClaimId).toEqual({
      $in: ['claim-1'],
    });
  });

  it('vínculos que apuntan a líneas inexistentes no dan pausa', async () => {
    const { em, repository } = build({
      invoiceLines: [{ insuranceClaimLineId: 'cl-fantasma' }],
      claimLines: [],
    });
    await expect(
      repository.hasOpenPatientObjection(em as never, 'inv-1'),
    ).resolves.toBe(false);
    expect(em.count).not.toHaveBeenCalled();
  });
});
