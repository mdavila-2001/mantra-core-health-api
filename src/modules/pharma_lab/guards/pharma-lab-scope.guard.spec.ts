import { jest } from '@jest/globals';
import { Reflector } from '@nestjs/core';

/**
 * Crea una función simulada con la implementación dada.
 *
 * @param impl - Implementación que ejecuta el doble.
 * @returns La función simulada.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { PharmaLabOpenTo, PharmaLabScopeGuard } from './pharma-lab-scope.guard';
import { PharmaLabAccessService } from '../services/pharma-lab-access.service';
import { PHL } from '../pharma_lab.concepts';

const LAB_A = 'aaaaaaaa-0000-0000-0000-000000000001';
const LAB_B = 'bbbbbbbb-0000-0000-0000-000000000002';
const TENANT_A = 'aaaaaaaa-1111-1111-1111-111111111111';
const TENANT_B = 'bbbbbbbb-1111-1111-1111-111111111111';

class Handlers {
  plain(this: void) {}
  @PharmaLabOpenTo('PRACTITIONER', 'CLINICIAN')
  report(this: void) {}
}

/**
 * Arma el guard con dos laboratorios (A y B) y un visitador de A.
 *
 * @returns El guard y un constructor de contextos de ejecución.
 */
function build() {
  const labs: Record<string, any> = {
    [LAB_A]: { id: LAB_A, tenantId: TENANT_A, statusConceptId: PHL.LAB_ACTIVE },
    [LAB_B]: { id: LAB_B, tenantId: TENANT_B, statusConceptId: PHL.LAB_ACTIVE },
  };
  const orgRepo = {
    findLab: mockFn((_em: unknown, id: string) =>
      Promise.resolve(labs[id] ?? null),
    ),
    findStaffByUser: mockFn(() => Promise.resolve(null)),
  };
  const visitorsRepo = {
    findVisitorByUser: mockFn((_em: unknown, userId: string) =>
      Promise.resolve(
        userId === 'visitor-a'
          ? {
              id: 'v1',
              userId,
              pharmaLabId: LAB_A,
              statusConceptId: PHL.LINK_ACTIVE,
            }
          : null,
      ),
    ),
  };
  const access = new PharmaLabAccessService(
    orgRepo as any,
    visitorsRepo as any,
  );
  access.requireVisitorOperable = mockFn(() => Promise.resolve(labs[LAB_A]));
  const em = { fork: () => ({}) };
  const guard = new PharmaLabScopeGuard(
    new Reflector(),
    em as any,
    access,
    visitorsRepo as any,
  );
  const ctx = (
    user: any,
    params: Record<string, string>,
    handler: keyof Handlers = 'plain',
  ) =>
    ({
      switchToHttp: () => ({ getRequest: () => ({ user, params }) }),
      getHandler: () => Handlers.prototype[handler],
      getClass: () => Handlers,
    }) as any;
  return { guard, ctx };
}

describe('PharmaLabScopeGuard', () => {
  it('no se mete en rutas sin :pharmaLabId', async () => {
    const { guard, ctx } = build();
    await expect(
      guard.canActivate(ctx({ id: 'x', roles: ['MEDICAL_VISITOR'] }, {})),
    ).resolves.toBe(true);
  });

  it('el personal de un laboratorio no entra al de otro (404)', async () => {
    const { guard, ctx } = build();
    await expect(
      guard.canActivate(
        ctx(
          { id: 'u1', roles: ['REGULATORY_AFFAIRS'], tenantIds: [TENANT_A] },
          { pharmaLabId: LAB_B },
        ),
      ),
    ).rejects.toThrow('Laboratorio no encontrado');
  });

  it('sí entra al propio', async () => {
    const { guard, ctx } = build();
    await expect(
      guard.canActivate(
        ctx(
          { id: 'u1', roles: ['REGULATORY_AFFAIRS'], tenantIds: [TENANT_A] },
          { pharmaLabId: LAB_A },
        ),
      ),
    ).resolves.toBe(true);
  });

  it('el visitador lee el catálogo de su laboratorio', async () => {
    const { guard, ctx } = build();
    await expect(
      guard.canActivate(
        ctx(
          { id: 'visitor-a', roles: ['MEDICAL_VISITOR'] },
          { pharmaLabId: LAB_A },
        ),
      ),
    ).resolves.toBe(true);
  });

  it('pero no el de la competencia', async () => {
    const { guard, ctx } = build();
    await expect(
      guard.canActivate(
        ctx(
          { id: 'visitor-a', roles: ['MEDICAL_VISITOR'] },
          { pharmaLabId: LAB_B },
        ),
      ),
    ).rejects.toThrow('Laboratorio no encontrado');
  });

  it('un médico reporta farmacovigilancia a cualquier laboratorio', async () => {
    const { guard, ctx } = build();
    await expect(
      guard.canActivate(
        ctx(
          { id: 'doc', roles: ['PRACTITIONER'] },
          { pharmaLabId: LAB_B },
          'report',
        ),
      ),
    ).resolves.toBe(true);
  });

  it('esa apertura no se extiende a las demás rutas', async () => {
    const { guard, ctx } = build();
    await expect(
      guard.canActivate(
        ctx({ id: 'doc', roles: ['PRACTITIONER'] }, { pharmaLabId: LAB_B }),
      ),
    ).rejects.toThrow('Laboratorio no encontrado');
  });

  it('PLATFORM_ADMIN con alcance global entra a cualquiera', async () => {
    const { guard, ctx } = build();
    await expect(
      guard.canActivate(
        ctx({ id: 'p', roles: ['PLATFORM_ADMIN'] }, { pharmaLabId: LAB_B }),
      ),
    ).resolves.toBe(true);
  });
});
