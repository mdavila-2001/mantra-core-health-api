import { describe, expect, it, jest } from '@jest/globals';
import { ForbiddenException, type CanActivate } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';
import { CONCEPTS, RolesGuard } from '../../../common';
import { DIR } from '../../directory/directory.concepts';
import { LabStaffGuard } from '../guards';
import { DiagnosticsLabController } from './diagnostics-lab.controller';

/**
 * Crea una función simulada con la implementación dada.
 *
 * @param impl - Implementación que ejecuta el doble.
 * @returns La función simulada.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const LAB = 'aaaaaaaa-0000-0000-0000-00000000000a';
/** El tenant por defecto de la plataforma: un PROVIDER, no un laboratorio. */
const DEFAULT_TENANT = 'bbbbbbbb-0000-0000-0000-00000000000b';

/**
 * La cadena de autorización real de la cola de trabajo: `RolesGuard` (global,
 * corre primero y lee `@Roles` del handler y la clase) y después los guards
 * que el controlador declara con `@UseGuards`. Correr las dos es lo que prueba
 * que sacar `@Roles` de la clase importa: con él, `RolesGuard` rebotaba a la
 * dueña del laboratorio antes de que nadie mirara su membresía.
 *
 * @returns Un evaluador `(handler, user, tenant) → true | throw`.
 */
function chain() {
  const memberships: Record<string, { tenantId: string; role: string }> = {
    'lab-owner': { tenantId: LAB, role: DIR.ROLE_OWNER },
    'lab-tech': { tenantId: LAB, role: DIR.ROLE_STAFF },
    // El alta de paciente lo deja STAFF del tenant por defecto.
    patient: { tenantId: DEFAULT_TENANT, role: DIR.ROLE_STAFF },
  };
  const repo = {
    findActiveByUserTenant: mockFn(
      (_em: unknown, userId: string, tenantId: string) =>
        Promise.resolve(
          memberships[userId]?.tenantId === tenantId
            ? { userId, tenantId, statusConceptId: DIR.MEMBERSHIP_ACTIVE }
            : null,
        ),
    ),
  };
  const types: Record<string, string> = {
    [LAB]: CONCEPTS.TENANT_TYPE_DIAGNOSTIC_CENTER,
    [DEFAULT_TENANT]: CONCEPTS.TENANT_TYPE_PROVIDER,
  };
  const em = {
    fork: () => ({
      findOne: (_e: unknown, where: { id: string }) =>
        Promise.resolve({ id: where.id, tenantTypeConceptId: types[where.id] }),
    }),
  };
  const guards: Record<string, CanActivate> = {
    [LabStaffGuard.name]: new LabStaffGuard(em as any, repo as any),
  };
  const roles = new RolesGuard(new Reflector());

  return async (
    handler: (...args: never[]) => unknown,
    user: Record<string, unknown>,
    resolvedTenantId: string,
  ): Promise<boolean> => {
    const ctx = {
      getHandler: () => handler,
      getClass: () => DiagnosticsLabController,
      switchToHttp: () => ({
        getRequest: () => ({ user, resolvedTenantId }),
      }),
    } as any;
    if (!roles.canActivate(ctx)) return false;
    const declared: { name: string }[] =
      Reflect.getMetadata(GUARDS_METADATA, DiagnosticsLabController) ?? [];
    for (const guard of declared) {
      if (!(await guards[guard.name].canActivate(ctx))) return false;
    }
    return true;
  };
}

/**
 * El handler tal como lo ve el `ExecutionContext` de Nest: la función del
 * prototipo, sin enlazar (no se invoca, sólo se usa como llave de metadata).
 *
 * @param name - Método del controlador.
 * @returns La función del prototipo.
 */
function handlerOf(
  name: keyof DiagnosticsLabController,
): (...args: never[]) => unknown {
  return Object.getOwnPropertyDescriptor(
    DiagnosticsLabController.prototype,
    name,
  )!.value as (...args: never[]) => unknown;
}

/** Las operaciones de la cola: leerla, abrir una orden y verificar un resultado. */
const HANDLERS = {
  listWorkOrders: handlerOf('listWorkOrders'),
  createWorkOrder: handlerOf('createWorkOrder'),
  verifyResult: handlerOf('verifyResult'),
};

describe('Cola de trabajo del laboratorio: quién la opera', () => {
  describe('correcto: el personal del laboratorio', () => {
    for (const [name, handler] of Object.entries(HANDLERS)) {
      it(`${name}: la dueña del DIAGNOSTIC_CENTER, sólo con USER`, async () => {
        const run = chain();
        await expect(
          run(handler, { id: 'lab-owner', roles: ['USER'] }, LAB),
        ).resolves.toBe(true);
      });
    }

    it('listWorkOrders: el técnico invitado como STAFF', async () => {
      const run = chain();
      await expect(
        run(HANDLERS.listWorkOrders, { id: 'lab-tech', roles: ['USER'] }, LAB),
      ).resolves.toBe(true);
    });
  });

  describe('límite: la regla de ámbito anterior para clínicos se mantiene', () => {
    it('CLINICIAN sin ámbito (excepción global) pasa en cualquier tenant', async () => {
      const run = chain();
      await expect(
        run(
          HANDLERS.listWorkOrders,
          { id: 'doc', roles: ['CLINICIAN'] },
          DEFAULT_TENANT,
        ),
      ).resolves.toBe(true);
    });

    it('PRACTITIONER con ámbito en el tenant activo pasa', async () => {
      const run = chain();
      const user = {
        id: 'doc',
        roles: ['PRACTITIONER'],
        scopedRoles: { [DEFAULT_TENANT]: ['PRACTITIONER'] },
      };
      await expect(
        run(HANDLERS.createWorkOrder, user, DEFAULT_TENANT),
      ).resolves.toBe(true);
    });

    it('PRACTITIONER con ámbito en otro tenant NO pasa por el rol', async () => {
      const run = chain();
      const user = {
        id: 'doc',
        roles: ['PRACTITIONER'],
        scopedRoles: { [LAB]: ['PRACTITIONER'] },
      };
      await expect(
        run(HANDLERS.listWorkOrders, user, DEFAULT_TENANT),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('no autorizado', () => {
    for (const [name, handler] of Object.entries(HANDLERS)) {
      it(`${name}: un paciente, STAFF del tenant por defecto, recibe 403`, async () => {
        const run = chain();
        await expect(
          run(handler, { id: 'patient', roles: ['PATIENT'] }, DEFAULT_TENANT),
        ).rejects.toBeInstanceOf(ForbiddenException);
      });
    }

    it('la dueña del laboratorio operando con otro tenant activo recibe 403', async () => {
      const run = chain();
      await expect(
        run(
          HANDLERS.listWorkOrders,
          { id: 'lab-owner', roles: ['USER'] },
          DEFAULT_TENANT,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });
});
