import { jest } from '@jest/globals';
import { ForbiddenException } from '@nestjs/common';
import { runWithTenant } from '../../../common';
import { InsurerContextService } from './insurer-context.service';

// Alias con tipado laxo: evita el 'never' que @jest/globals infiere para jest.fn() en ESM.
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const TENANT = 'tenant-1';
const CARRIER = 'carrier-1';
const DENIED = 'No hay acceso a esta consola';
const em = {} as never;

const dueño = { id: 'u-owner', roles: ['USER'] } as any;
const operadorDeOtroTenant = {
  id: 'u-op-otro',
  roles: ['USER', 'INSURANCE_OPERATOR'],
  scopedRoles: { 'tenant-2': ['INSURANCE_OPERATOR'] },
} as any;
const operadorDeEsteTenant = {
  id: 'u-op',
  roles: ['USER', 'INSURANCE_OPERATOR'],
  scopedRoles: { [TENANT]: ['INSURANCE_OPERATOR'] },
} as any;

function build(opciones: { aseguradora?: boolean; administra?: boolean }) {
  const catalogRepo = {
    findCarrierByTenantId: mockFn().mockResolvedValue(
      opciones.aseguradora === false ? null : { id: CARRIER },
    ),
  };
  const tenantAdministration = {
    canAdminister: mockFn().mockResolvedValue(opciones.administra ?? false),
  };
  const service = new InsurerContextService(
    catalogRepo as never,
    tenantAdministration as never,
  );
  return { service, catalogRepo, tenantAdministration };
}

describe('InsurerContextService', () => {
  it('rechaza con el mensaje pedido si el tenant activo no es una aseguradora', async () => {
    const d = build({ aseguradora: false, administra: true });

    const resultado = runWithTenant(TENANT, () =>
      d.service.resolve(em, dueño, DENIED),
    );

    await expect(resultado).rejects.toThrow(new ForbiddenException(DENIED));
    expect(d.catalogRepo.findCarrierByTenantId).toHaveBeenCalledWith(
      em,
      TENANT,
    );
  });

  it('deja pasar a quien administra el tenant de la aseguradora', async () => {
    const d = build({ administra: true });

    await expect(
      runWithTenant(TENANT, () => d.service.resolve(em, dueño, DENIED)),
    ).resolves.toEqual({ carrierId: CARRIER, tenantId: TENANT });
  });

  it('deja pasar al operador cuyo rol es de este tenant', async () => {
    const d = build({});

    await expect(
      runWithTenant(TENANT, () =>
        d.service.resolve(em, operadorDeEsteTenant, DENIED),
      ),
    ).resolves.toEqual({ carrierId: CARRIER, tenantId: TENANT });
  });

  it('rechaza al operador cuyo rol se concedió en otro tenant', async () => {
    const d = build({});

    await expect(
      runWithTenant(TENANT, () =>
        d.service.resolve(em, operadorDeOtroTenant, DENIED),
      ),
    ).rejects.toThrow(new ForbiddenException(DENIED));
  });
});
