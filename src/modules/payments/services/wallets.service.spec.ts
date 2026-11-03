import { jest } from '@jest/globals';
import { WalletsService } from './wallets.service';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const actor = { id: 'user-1', roles: ['SYSTEM'] } as any;
const tx = {} as any;

/** Servicio con un repositorio en memoria: una billetera con `balance`. */
function build(balance: string | undefined) {
  const wallet: any = { id: 'wallet-1', availableBalance: balance };
  const walletsRepo = {
    findWalletLedgerEntryByKey: mockFn(() => Promise.resolve(null)),
    findWalletForUpdate: mockFn(() => Promise.resolve(wallet)),
    createWallet: mockFn(() => wallet),
    createWalletLedgerEntry: mockFn((_tx: unknown, data: any) => ({
      id: 'entry-1',
      ...data,
    })),
  };
  return {
    service: new WalletsService(walletsRepo as any),
    wallet,
    walletsRepo,
  };
}

const credit = (amount: string) => ({
  tenantId: 'tenant-1',
  ownerTypeConceptId: 'owner-type',
  ownerRefId: 'owner-1',
  walletTypeConceptId: 'wallet-type',
  currencyConceptId: 'bob',
  walletStatusConceptId: 'active',
  amount,
  directionConceptId: 'credit',
  entryTypeConceptId: 'entry-type',
  idempotencyKey: `k-${amount}`,
});

describe('WalletsService.creditWallet (PAY-01)', () => {
  it('suma 0.10 + 0.20 como 0.30 exacto', async () => {
    const d = build('0.10');

    const res = await d.service.creditWallet(tx, credit('0.20'), actor);

    expect(res.balanceAfter).toBe('0.30');
    expect(d.wallet.availableBalance).toBe('0.30');
  });

  it('no pierde centavos con saldos grandes', async () => {
    const d = build('99999999999999.98');

    const res = await d.service.creditWallet(tx, credit('0.01'), actor);

    expect(res.balanceAfter).toBe('99999999999999.99');
  });

  it('una billetera nueva (sin saldo) parte de cero', async () => {
    const d = build(undefined);

    const res = await d.service.creditWallet(tx, credit('12.50'), actor);

    expect(res.balanceAfter).toBe('12.50');
  });

  it('redondea half-up a 2 decimales con tres decimales de entrada', async () => {
    const d = build('0.00');

    const res = await d.service.creditWallet(tx, credit('0.125'), actor);

    expect(res.balanceAfter).toBe('0.13');
  });

  it('un reintento con la misma clave devuelve el asiento sin abonar de nuevo', async () => {
    const d = build('1.00');
    d.walletsRepo.findWalletLedgerEntryByKey.mockResolvedValue({
      id: 'entry-prev',
      walletId: 'wallet-1',
      balanceAfter: '1.50',
    });

    const res = await d.service.creditWallet(tx, credit('0.50'), actor);

    expect(res).toMatchObject({ duplicate: true, balanceAfter: '1.50' });
    expect(d.walletsRepo.createWalletLedgerEntry).not.toHaveBeenCalled();
  });
});
