import {
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PharmacyErpService } from './pharmacy-erp.service';
import type { MockProviderEnv } from '../common/env';

function build(env: Partial<MockProviderEnv> = {}) {
  const fullEnv: MockProviderEnv = {
    port: 4100,
    apiKey: undefined,
    notificationsFailureRate: 0,
    deletionsFailureRate: 0,
    simulatedLatencyMs: 0,
    identityVerificationDelayMs: 0,
    identityVerificationRejectionRate: 0,
    pharmacyErpFailureRate: 0,
    ...env,
  };
  return new PharmacyErpService(fullEnv);
}

describe('PharmacyErpService', () => {
  it('lista 12 productos con códigos propios ERP-…', async () => {
    const res = await build().products();

    expect(res.items).toHaveLength(12);
    expect(res.items.every((p) => /^ERP-\d{4}$/.test(p.code))).toBe(true);
    expect(new Set(res.items.map((p) => p.code)).size).toBe(12);
  });

  it('la misma sucursal da siempre el mismo stock', async () => {
    const service = build();

    const first = await service.stock('SEDE-CENTRAL');
    const second = await service.stock('SEDE-CENTRAL');

    expect(first.items).toEqual(second.items);
  });

  it('otra sucursal da otro stock', async () => {
    const service = build();

    const central = await service.stock('SEDE-CENTRAL');
    const norte = await service.stock('SUCURSAL-NORTE');

    expect(central.items).not.toEqual(norte.items);
  });

  it('dos farmacias con el mismo código de sede reciben stock distinto', async () => {
    const service = build();

    const a = await service.stock('SEDE-CENTRAL', 'FARMACIA-A');
    const b = await service.stock('SEDE-CENTRAL', 'FARMACIA-B');

    expect(a.items).not.toEqual(b.items);
    expect(a.pharmacyCode).toBe('FARMACIA-A');
  });

  it('la misma farmacia y sede dan siempre el mismo stock', async () => {
    const service = build();

    const first = await service.stock('SEDE-CENTRAL', 'FARMACIA-A');
    const second = await service.stock('SEDE-CENTRAL', ' FARMACIA-A ');

    expect(first.items).toEqual(second.items);
  });

  it('alguno queda en 0 y ninguno pasa de 40', async () => {
    const res = await build().stock('SEDE-CENTRAL');
    const quantities = res.items.map((line) => line.quantity);

    expect(quantities.some((q) => q === 0)).toBe(true);
    expect(quantities.every((q) => q >= 0 && q <= 40)).toBe(true);
  });

  it('sin siteCode responde 400', async () => {
    const service = build();

    await expect(service.stock('')).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.stock(undefined)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('con la tasa de falla en 1, responde 503', async () => {
    const service = build({ pharmacyErpFailureRate: 1 });

    await expect(service.products()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
