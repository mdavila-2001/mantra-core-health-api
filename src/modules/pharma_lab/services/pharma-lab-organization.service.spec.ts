import { jest } from '@jest/globals';

/**
 * Crea una función simulada con la implementación dada.
 *
 * @param impl - Implementación que ejecuta el doble.
 * @returns La función simulada.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { PharmaLabOrganizationService } from './pharma-lab-organization.service';

const TENANT_A = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const TENANT_B = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

/**
 * Construye el servicio con un repositorio que registra el alcance pedido.
 *
 * @returns El servicio y el repositorio simulado.
 */
function build() {
  const repo = { listLabs: mockFn(() => Promise.resolve([])) };
  const logger = { setContext: mockFn() };
  const service = new PharmaLabOrganizationService(
    {} as any,
    repo as any,
    {} as any,
    {} as any,
    {} as any,
    logger as any,
  );
  return { service, repo };
}

describe('PharmaLabOrganizationService.listLabs · alcance', () => {
  it('el administrador de un laboratorio ve sólo los de sus organizaciones', async () => {
    const { service, repo } = build();
    await service.listLabs({
      id: 'u1',
      roles: ['PHARMA_LAB_ADMIN'],
      tenantIds: [TENANT_A],
    });
    expect(repo.listLabs).toHaveBeenCalledWith(expect.anything(), [TENANT_A]);
  });

  it('sin organizaciones, el listado queda vacío en vez de abierto', async () => {
    const { service, repo } = build();
    await service.listLabs({ id: 'u1', roles: ['PHARMA_LAB_ADMIN'] });
    expect(repo.listLabs).toHaveBeenCalledWith(expect.anything(), []);
  });

  it('PLATFORM_ADMIN con alcance global ve todos', async () => {
    const { service, repo } = build();
    await service.listLabs({
      id: 'u1',
      roles: ['PLATFORM_ADMIN'],
      tenantIds: [TENANT_A],
    });
    expect(repo.listLabs).toHaveBeenCalledWith(expect.anything(), null);
  });

  it('SUPERADMIN ve todos', async () => {
    const { service, repo } = build();
    await service.listLabs({ id: 'u1', roles: ['SUPERADMIN'] });
    expect(repo.listLabs).toHaveBeenCalledWith(expect.anything(), null);
  });

  it('BUSINESS_ADMIN concedido dentro de un tenant (MCH-001) no ve la red entera', async () => {
    const { service, repo } = build();
    await service.listLabs({
      id: 'u1',
      roles: ['BUSINESS_ADMIN'],
      scopedRoles: { [TENANT_B]: ['BUSINESS_ADMIN'] },
      tenantIds: [TENANT_B],
    });
    expect(repo.listLabs).toHaveBeenCalledWith(expect.anything(), [TENANT_B]);
  });
});
