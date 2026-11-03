import { jest } from '@jest/globals';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
  runWithTenant,
} from '../../../common';
import {
  Runbooks,
  ServiceComponents,
  ServiceLevelIndicators,
  ServiceLevelObjectives,
} from '../entities';
import { PlatformOpsErrorReason } from '../platform_ops.error-reasons';
import { PlatformOpsScope } from './platform-ops-scope.service';

// Loose-typed mock factory: keeps runtime 'jest' but avoids @jest/globals' strict Mock<never> typings under the root tsconfig.
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const T1 = '00000000-0000-4000-8000-0000000000a1';
const T2 = '00000000-0000-4000-8000-0000000000b2';
const OUT_OF_SCOPE = PlatformOpsErrorReason.PLATFORM_OPS_RESOURCE_OUT_OF_SCOPE;

const inTenant = <T>(fn: () => T): T => runWithTenant(T1, fn);

/** Captura el error síncrono de `fn`. */
function thrown(fn: () => unknown): any {
  try {
    fn();
  } catch (error) {
    return error;
  }
  throw new Error('no lanzó');
}

/** Captura el rechazo de una promesa. */
async function rejection(promise: Promise<unknown>): Promise<any> {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error('no rechazó');
}

/** Unidad de trabajo cuyos `findOne` recorren SLO → indicador → componente, y runbook. */
function txWith(tenants: {
  component?: string | null;
  runbook?: string | null;
}) {
  return {
    findOne: mockFn(async (entity: unknown, where: { id: string }) => {
      if (entity === ServiceLevelObjectives) {
        return { id: where.id, serviceLevelIndicatorId: 'sli' };
      }
      if (entity === ServiceLevelIndicators) {
        return { id: 'sli', serviceComponentId: 'component' };
      }
      if (entity === ServiceComponents) {
        return tenants.component === undefined
          ? null
          : { id: 'component', tenantId: tenants.component };
      }
      if (entity === Runbooks) {
        return tenants.runbook === undefined
          ? null
          : { id: 'runbook', tenantId: tenants.runbook };
      }
      return null;
    }),
  } as any;
}

describe('PlatformOpsScope', () => {
  const scope = new PlatformOpsScope();

  describe('ownerTenantId', () => {
    it('devuelve el tenant del contexto cuando el cuerpo no declara ninguno o declara el mismo', () => {
      expect(inTenant(() => scope.ownerTenantId())).toBe(T1);
      expect(inTenant(() => scope.ownerTenantId(T1))).toBe(T1);
    });

    it('rechaza un cuerpo que declara otro tenant con el 404 uniforme', () => {
      const error = thrown(() => inTenant(() => scope.ownerTenantId(T2)));

      expect(error).toBeInstanceOf(ResourceNotFoundException);
      expect(error.getStatus()).toBe(404);
      expect(error.reason).toBe(OUT_OF_SCOPE);
      expect(error.details).toBeUndefined();
    });

    it('sin tenant en el contexto exige indicarlo', () => {
      expect(thrown(() => scope.ownerTenantId())).toBeInstanceOf(
        PreconditionFailedException,
      );
    });
  });

  describe('require', () => {
    it('devuelve el recurso del tenant activo', () => {
      const resource = { id: 'r' };

      expect(inTenant(() => scope.require(resource, T1))).toBe(resource);
    });

    it.each([
      ['de otro tenant', { id: 'r' }, T2],
      ['sin tenant', { id: 'r' }, null],
      ['inexistente', null, undefined],
    ])('un recurso %s responde el mismo 404', (_name, resource, tenant) => {
      const error = thrown(() =>
        inTenant(() => scope.require(resource, tenant)),
      );

      expect(error).toBeInstanceOf(ResourceNotFoundException);
      expect(error.reason).toBe(OUT_OF_SCOPE);
      expect(error.details).toBeUndefined();
    });
  });

  describe('herencia del tenant', () => {
    it('viaComponent, viaSlo y viaRunbook aceptan lo que cuelga de un componente o runbook del tenant', async () => {
      const resource = { id: 'r' };
      const tx = txWith({ component: T1, runbook: T1 });

      await expect(
        inTenant(() => scope.viaComponent(tx, resource, 'component')),
      ).resolves.toBe(resource);
      await expect(
        inTenant(() => scope.viaSlo(tx, resource, 'slo')),
      ).resolves.toBe(resource);
      await expect(
        inTenant(() => scope.viaRunbook(tx, resource, 'runbook')),
      ).resolves.toBe(resource);
    });

    it('lo que cuelga de un componente o runbook de otro tenant, sin tenant o inexistente se rechaza igual', async () => {
      const resource = { id: 'r' };
      for (const tenants of [
        { component: T2, runbook: T2 },
        { component: null, runbook: null },
        {},
      ]) {
        const tx = txWith(tenants);
        const errors = [
          await rejection(
            inTenant(() => scope.viaComponent(tx, resource, 'component')),
          ),
          await rejection(inTenant(() => scope.viaSlo(tx, resource, 'slo'))),
          await rejection(
            inTenant(() => scope.viaRunbook(tx, resource, 'runbook')),
          ),
        ];
        for (const error of errors) {
          expect(error).toBeInstanceOf(ResourceNotFoundException);
          expect(error.reason).toBe(OUT_OF_SCOPE);
          expect(error.details).toBeUndefined();
        }
      }
    });

    it('un recurso inexistente no consulta la cadena', async () => {
      const tx = txWith({ component: T1 });

      const error = await rejection(
        inTenant(() => scope.viaSlo(tx, null, 'slo')),
      );

      expect(error.reason).toBe(OUT_OF_SCOPE);
      expect(tx.findOne).not.toHaveBeenCalled();
    });
  });
});
