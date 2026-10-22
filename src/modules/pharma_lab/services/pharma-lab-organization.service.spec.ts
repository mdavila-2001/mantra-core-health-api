import { jest } from '@jest/globals';

/**
 * Crea una función simulada con la implementación dada.
 *
 * @param impl - Implementación que ejecuta el doble.
 * @returns La función simulada.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { PharmaLabOrganizationService } from './pharma-lab-organization.service';
import { PharmaLabAccessService } from './pharma-lab-access.service';
import { PHL } from '../pharma_lab.concepts';

const TENANT_A = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const TENANT_B = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const LAB_B = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
const LAB_ADMIN_A = {
  id: 'u1',
  roles: ['PHARMA_LAB_ADMIN'],
  tenantIds: [TENANT_A],
};

/**
 * Construye el servicio con un repositorio que registra el alcance pedido.
 *
 * @returns El servicio y el repositorio simulado.
 */
function build() {
  const labB = {
    id: LAB_B,
    tenantId: TENANT_B,
    statusConceptId: PHL.LAB_ACTIVE,
  };
  const repo = {
    listLabs: mockFn(() => Promise.resolve([])),
    findLab: mockFn((_em: unknown, id: string) =>
      Promise.resolve(id === LAB_B ? labB : null),
    ),
    // El usuario `staff-b` es personal activo de LAB_B sin ser miembro de su
    // organización: vincular personal no crea membresía de tenant.
    findStaffByUser: mockFn((_em: unknown, labId: string, userId: string) =>
      Promise.resolve(
        labId === LAB_B && userId === 'staff-b'
          ? { statusConceptId: PHL.LINK_ACTIVE }
          : null,
      ),
    ),
    findLabIdsWhereStaff: mockFn((_em: unknown, userId: string) =>
      Promise.resolve(userId === 'staff-b' ? [LAB_B] : []),
    ),
  };
  const tx = { flush: mockFn(), findOne: mockFn(() => Promise.resolve({})) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const access = new PharmaLabAccessService(repo as any, {} as any);
  const logger = { setContext: mockFn(), info: mockFn() };
  const service = new PharmaLabOrganizationService(
    em as any,
    repo as any,
    {} as any,
    access,
    { record: mockFn() } as any,
    logger as any,
  );
  return { service, repo, labB };
}

describe('PharmaLabOrganizationService.listLabs · alcance', () => {
  it('el administrador de un laboratorio ve sólo los de sus organizaciones', async () => {
    const { service, repo } = build();
    await service.listLabs({
      id: 'u1',
      roles: ['PHARMA_LAB_ADMIN'],
      tenantIds: [TENANT_A],
    });
    expect(repo.listLabs).toHaveBeenCalledWith(expect.anything(), {
      tenantIds: [TENANT_A],
      labIds: [],
    });
  });

  it('sin organizaciones, el listado queda vacío en vez de abierto', async () => {
    const { service, repo } = build();
    await service.listLabs({ id: 'u1', roles: ['PHARMA_LAB_ADMIN'] });
    expect(repo.listLabs).toHaveBeenCalledWith(expect.anything(), {
      tenantIds: [],
      labIds: [],
    });
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
    expect(repo.listLabs).toHaveBeenCalledWith(expect.anything(), {
      tenantIds: [TENANT_B],
      labIds: [],
    });
  });
});

describe('PharmaLabOrganizationService · administrar un laboratorio ajeno', () => {
  it('el admin de otro laboratorio no lo ve (404, sin confirmar que existe)', async () => {
    const { service } = build();
    await expect(service.getLab(LAB_B, LAB_ADMIN_A as any)).rejects.toThrow(
      'Laboratorio no encontrado',
    );
  });

  it('ni puede editar su perfil', async () => {
    const { service, labB } = build();
    await expect(
      service.updateLab(LAB_B, { tradeName: 'X' } as any, LAB_ADMIN_A as any),
    ).rejects.toThrow('Laboratorio no encontrado');
    expect(labB).not.toHaveProperty('tradeName');
  });

  it('ni registrar como laboratorio una organización de la que no es miembro', async () => {
    const { service } = build();
    await expect(
      service.createLab({ tenantId: TENANT_B } as any, LAB_ADMIN_A as any),
    ).rejects.toThrow('Laboratorio no encontrado');
  });

  it('el admin del propio laboratorio sí lo ve', async () => {
    const { service, labB } = build();
    await expect(
      service.getLab(LAB_B, {
        id: 'u2',
        roles: ['PHARMA_LAB_ADMIN'],
        tenantIds: [TENANT_B],
      } as any),
    ).resolves.toBe(labB);
  });

  it('el personal activo del laboratorio lo ve aunque no sea miembro de la organización', async () => {
    const { service, labB } = build();
    await expect(
      service.getLab(LAB_B, {
        id: 'staff-b',
        roles: ['PHARMA_LAB_ADMIN'],
        tenantIds: [],
      } as any),
    ).resolves.toBe(labB);
  });

  it('y lo encuentra en el listado', async () => {
    const { service, repo } = build();
    await service.listLabs({
      id: 'staff-b',
      roles: ['PHARMA_LAB_ADMIN'],
    } as any);
    expect(repo.listLabs).toHaveBeenCalledWith(expect.anything(), {
      tenantIds: [],
      labIds: [LAB_B],
    });
  });

  it('PLATFORM_ADMIN con alcance global ve cualquiera', async () => {
    const { service, labB } = build();
    await expect(
      service.getLab(LAB_B, { id: 'u3', roles: ['PLATFORM_ADMIN'] } as any),
    ).resolves.toBe(labB);
  });
});
