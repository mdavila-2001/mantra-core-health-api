import { describe, expect, it, jest } from '@jest/globals';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  PatientProfilesRepository,
  PersonAccountLinksRepository,
} from '../../profiles/repositories';
import { PatientSettlementRepository } from '../repositories/patient-settlement.repository';
import { LinkedClaimOrderService } from './linked-claim-order.service';
import { PatientSettlementService } from './patient-settlement.service';

function fixture() {
  const repository = {
    ownedOrders: jest
      .fn<PatientSettlementRepository['ownedOrders']>()
      .mockResolvedValue([]),
    load: jest.fn<PatientSettlementRepository['load']>(),
    activeClaimForDispensation: jest
      .fn<PatientSettlementRepository['activeClaimForDispensation']>()
      .mockResolvedValue(undefined),
  };
  const orders = {
    loadSnapshots: jest
      .fn<LinkedClaimOrderService['loadSnapshots']>()
      .mockResolvedValue(new Map()),
  };
  const links = {
    findActiveByUser: jest
      .fn<PersonAccountLinksRepository['findActiveByUser']>()
      .mockResolvedValue(null),
  };
  const patients = {
    findById: jest
      .fn<PatientProfilesRepository['findById']>()
      .mockResolvedValue(null),
  };
  const tx = {} as EntityManager;
  const transactional = jest.fn(
    async (
      callback: (manager: EntityManager) => Promise<unknown>,
      _options?: unknown,
    ) => callback(tx),
  );
  const em = { transactional } as unknown as EntityManager;
  const service = new PatientSettlementService(
    repository as PatientSettlementRepository,
    orders as unknown as LinkedClaimOrderService,
    links as unknown as PersonAccountLinksRepository,
    patients as unknown as PatientProfilesRepository,
  );
  return {
    service,
    repository,
    orders,
    links,
    patients,
    em,
    tx,
    transactional,
  };
}

describe('Patient settlement authorization boundary', () => {
  it('does not query anything for an empty authorized list', async () => {
    const f = fixture();
    expect(await f.service.forOrders(f.em, 'account', 'PHARMACY', [])).toEqual(
      new Map(),
    );
    expect(f.transactional).not.toHaveBeenCalled();
  });
  it('does not read any policy or EOB when the account has no persistent link', async () => {
    const f = fixture();
    const result = await f.service.forOrders(f.em, 'account', 'PHARMACY', [
      'foreign',
    ]);
    expect(result.get('foreign')).toEqual({
      insuranceSettlement: null,
      insuranceSettlementAvailability: 'NOT_AVAILABLE',
    });
    expect(f.links.findActiveByUser).toHaveBeenCalledWith(f.tx, 'account');
    expect(f.repository.load).not.toHaveBeenCalled();
    expect(f.orders.loadSnapshots).not.toHaveBeenCalled();
  });
  it('authorizes the persistent patient before reading private insurance rows', async () => {
    const f = fixture();
    f.links.findActiveByUser.mockResolvedValue({ personId: 'person' } as never);
    f.patients.findById.mockResolvedValue({ profileId: 'patient' } as never);
    await f.service.forOrders(f.em, 'account', 'DIAGNOSTIC', ['foreign']);
    expect(f.repository.ownedOrders).toHaveBeenCalledWith(
      f.tx,
      'patient',
      'DIAGNOSTIC',
      ['foreign'],
    );
    expect(f.repository.load).not.toHaveBeenCalled();
  });
  it('scopes all private batches to the authorized subset', async () => {
    const f = fixture();
    f.links.findActiveByUser.mockResolvedValue({ personId: 'person' } as never);
    f.patients.findById.mockResolvedValue({ profileId: 'patient' } as never);
    f.repository.ownedOrders.mockResolvedValue(['mine']);
    f.repository.load.mockResolvedValue({ claims: [], lines: [] } as never);
    const result = await f.service.forOrders(f.em, 'account', 'PHARMACY', [
      'mine',
      'foreign',
    ]);
    expect(f.repository.load).toHaveBeenCalledWith(
      f.tx,
      'patient',
      'PHARMACY',
      ['mine'],
    );
    expect(result.get('foreign')?.insuranceSettlement).toBeNull();
    expect(f.transactional).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: 'repeatable read',
      readOnly: true,
    });
  });
  it('dispensation only reads the active claim link, without private insurance details', async () => {
    const f = fixture();
    f.repository.activeClaimForDispensation.mockResolvedValue('claim');
    expect(await f.service.activeClaimForDispensation(f.tx, 'order')).toBe(
      'claim',
    );
    expect(f.repository.load).not.toHaveBeenCalled();
    expect(f.links.findActiveByUser).not.toHaveBeenCalled();
  });
});
