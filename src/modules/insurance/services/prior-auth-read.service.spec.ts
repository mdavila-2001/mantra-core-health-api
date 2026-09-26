import { jest } from '@jest/globals';
import { ForbiddenException } from '@nestjs/common';
import { PriorAuthReadService } from './prior-auth-read.service';
import { InsurancePlans, PatientCoverages } from '../entities';
import { Persons, PatientProfiles } from '../../profiles/entities';
import { PharmacyProducts } from '../../pharmacy/entities';
import { CatalogConcepts } from '../../terminology/entities';
import { INS } from '../insurance.concepts';

const fn = (implementation?: any): any => (jest.fn as any)(implementation);
const actor = { id: 'user', roles: ['USER'] };

function fixture() {
  const request = {
    id: 'prior',
    patientCoverageId: 'coverage',
    inventoryReservationId: 'order',
    statusConceptId: INS.PRIOR_AUTH_DETERMINED,
    submittedAt: new Date('2026-09-20T10:00:00Z'),
  };
  const items = [
    {
      id: 'item-1',
      priorAuthorizationRequestId: 'prior',
      itemSequence: 1,
      pharmacyProductId: 'product',
      requestedQuantity: '2',
      requestedAmount: '100.00',
      currencyConceptId: 'bob',
    },
    {
      id: 'item-2',
      priorAuthorizationRequestId: 'prior',
      itemSequence: 2,
      serviceConceptId: 'service',
      requestedQuantity: '1',
      requestedAmount: '40.00',
      currencyConceptId: 'bob',
    },
  ];
  const decidedAt = new Date('2026-09-21T10:00:00Z');
  const determinations = [
    // versión 2 (vigente), de más nueva a más vieja como la da el repositorio
    {
      priorAuthorizationRequestId: 'prior',
      determinationVersion: 2,
      decisionConceptId: INS.DECISION_PARTIAL,
      decidedAt,
    },
    {
      priorAuthorizationRequestId: 'prior',
      priorAuthorizationItemId: 'item-1',
      determinationVersion: 2,
      decisionConceptId: INS.DECISION_APPROVED,
      approvedAmount: '100.00',
      approvedQuantity: '2',
      decidedAt,
    },
    {
      priorAuthorizationRequestId: 'prior',
      priorAuthorizationItemId: 'item-2',
      determinationVersion: 2,
      decisionConceptId: INS.DECISION_DENIED,
      policyClauseReference: 'Cláusula 12.3',
      denialRationale: 'No cubierto',
      decidedAt,
    },
    {
      priorAuthorizationRequestId: 'prior',
      priorAuthorizationItemId: 'item-2',
      determinationVersion: 1,
      decisionConceptId: INS.DECISION_APPROVED,
      decidedAt: new Date('2026-09-20T12:00:00Z'),
    },
  ];
  const em = {
    fork: () => em,
    findOne: fn(async (entity: unknown) =>
      entity === PatientCoverages
        ? { id: 'coverage', insurancePlanId: 'plan' }
        : null,
    ),
    find: fn(async (entity: unknown) => {
      if (entity === PatientCoverages)
        return [
          {
            id: 'coverage',
            insurancePlanId: 'plan',
            patientProfileId: 'person',
            memberIdentifier: 'M-1',
          },
        ];
      if (entity === InsurancePlans) return [{ id: 'plan', name: 'Plan Oro' }];
      if (entity === Persons) return [{ id: 'person', displayName: 'Ana' }];
      if (entity === PatientProfiles)
        return [{ profileId: 'person', patientCode: 'P-1' }];
      if (entity === PharmacyProducts)
        return [{ id: 'product', brandName: 'Amoxil', strengthText: '500 mg' }];
      if (entity === CatalogConcepts)
        return [
          { id: 'bob', code: 'BOB', display: 'Boliviano' },
          { id: 'service', code: 'X', display: 'Consulta' },
        ];
      return [];
    }),
  };
  const repo = {
    findIdsForCarrier: fn().mockResolvedValue(['prior']),
    findRequestsByIds: fn().mockResolvedValue([request]),
    findRequest: fn().mockResolvedValue(request),
    findItemsByRequestIds: fn().mockResolvedValue(items),
    findDeterminationsByRequestIds: fn().mockResolvedValue(determinations),
  };
  const catalog = {
    findCarrierByTenantId: fn().mockResolvedValue({ id: 'carrier' }),
    findPlan: fn().mockResolvedValue({ insuranceProductId: 'product-ins' }),
    findProduct: fn().mockResolvedValue({ insuranceCarrierId: 'carrier' }),
  };
  const access = { assertAdministrator: fn().mockResolvedValue('tenant') };
  const service = new PriorAuthReadService(
    em as never,
    repo as never,
    catalog as never,
    access as never,
  );
  return { service, repo, catalog, access };
}

describe('PriorAuthReadService (bandeja de la aseguradora)', () => {
  it('lista sólo lo de la aseguradora del tenant y filtra pendientes', async () => {
    const f = fixture();
    const list = await f.service.listInbox({ status: 'PENDING' }, actor);
    expect(f.repo.findIdsForCarrier).toHaveBeenCalledWith(
      expect.anything(),
      'carrier',
      [INS.PRIOR_AUTH_SUBMITTED, INS.PRIOR_AUTH_IN_REVIEW],
      200,
    );
    expect(list.items).toHaveLength(1);
    expect(list.items[0]).toMatchObject({
      id: 'prior',
      origin: 'PHARMACY',
      status: 'DETERMINED',
      decision: 'PARTIAL',
      planName: 'Plan Oro',
      currencyCode: 'BOB',
      itemCount: 2,
      totalRequestedAmount: '140.00',
      patient: {
        displayName: 'Ana',
        patientCode: 'P-1',
        memberIdentifier: 'M-1',
      },
    });
    expect(list.items[0]).not.toHaveProperty('items');
  });

  it('el detalle trae la decisión vigente de cada ítem con su cláusula', async () => {
    const f = fixture();
    const detail = await f.service.getForInsurer('prior', actor);
    expect(detail.items.map((item) => item.description)).toEqual([
      'Amoxil 500 mg',
      'Consulta',
    ]);
    expect(detail.items[0].decision).toMatchObject({
      decision: 'APPROVED',
      approvedAmount: '100.00',
    });
    // la versión 1 (aprobada) quedó reemplazada por la 2 (no aprobada)
    expect(detail.items[1].decision).toMatchObject({
      decision: 'DENIED',
      policyClauseReference: 'Cláusula 12.3',
      denialRationale: 'No cubierto',
    });
    expect(detail.decidedAt).toBe('2026-09-21T10:00:00.000Z');
  });

  it('un tenant que no es aseguradora recibe 403 y no lee nada', async () => {
    const f = fixture();
    f.catalog.findCarrierByTenantId.mockResolvedValue(null);
    await expect(f.service.listInbox({}, actor)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(f.repo.findIdsForCarrier).not.toHaveBeenCalled();
  });

  it('quien no administra el tenant recibe 403', async () => {
    const f = fixture();
    f.access.assertAdministrator.mockRejectedValue(new ForbiddenException());
    await expect(
      f.service.getForInsurer('prior', actor),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(f.repo.findRequest).not.toHaveBeenCalled();
  });

  it('la solicitud de otra aseguradora es el mismo 403', async () => {
    const f = fixture();
    f.catalog.findProduct.mockResolvedValue({ insuranceCarrierId: 'otra' });
    await expect(
      f.service.getForInsurer('prior', actor),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
