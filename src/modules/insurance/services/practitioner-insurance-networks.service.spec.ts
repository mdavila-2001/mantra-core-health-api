import { jest } from '@jest/globals';
import { INS } from '../insurance.concepts';
import { PRAC } from '../../practice/practice.concepts';
import { PractitionerInsuranceNetworksService } from './practitioner-insurance-networks.service';

function build(rows: unknown[]) {
  const execute = jest
    .fn<(sql: string, params: unknown[]) => Promise<unknown[]>>()
    .mockResolvedValue(rows);
  const em = { fork: () => ({ getConnection: () => ({ execute }) }) };
  return {
    service: new PractitionerInsuranceNetworksService(em as never),
    execute,
  };
}

describe('PractitionerInsuranceNetworksService', () => {
  it('pide sólo membresías y redes activas de las vinculaciones activas del médico', async () => {
    const { service, execute } = build([]);

    await service.listForPractitioner('perfil-1');

    expect(execute).toHaveBeenCalledWith(expect.any(String), [
      'perfil-1',
      PRAC.ROLE_ASSIGNMENT_ACTIVE,
      INS.MEMBERSHIP_ACTIVE,
      INS.NETWORK_ACTIVE,
    ]);
  });

  it('sin membresías devuelve una lista vacía, no un error', async () => {
    const { service } = build([]);

    await expect(service.listForPractitioner('perfil-1')).resolves.toEqual([]);
  });

  it('traduce cada fila al contrato, con las fechas como YYYY-MM-DD', async () => {
    const { service } = build([
      {
        membership_id: 'm-1',
        carrier_id: 'c-1',
        carrier_name: 'Nacional Seguros',
        network_name: 'Red de prestadores Nacional Seguros',
        effective_from: new Date('2026-01-15T00:00:00.000Z'),
        effective_to: null,
      },
      {
        membership_id: 'm-2',
        carrier_id: 'c-2',
        carrier_name: 'Alianza',
        network_name: 'Red Alianza',
        effective_from: '2026-03-01',
        effective_to: '2026-12-31',
      },
    ]);

    await expect(service.listForPractitioner('perfil-1')).resolves.toEqual([
      {
        membershipId: 'm-1',
        carrierId: 'c-1',
        carrierName: 'Nacional Seguros',
        networkName: 'Red de prestadores Nacional Seguros',
        effectiveFrom: '2026-01-15',
        effectiveTo: null,
      },
      {
        membershipId: 'm-2',
        carrierId: 'c-2',
        carrierName: 'Alianza',
        networkName: 'Red Alianza',
        effectiveFrom: '2026-03-01',
        effectiveTo: '2026-12-31',
      },
    ]);
  });
});
