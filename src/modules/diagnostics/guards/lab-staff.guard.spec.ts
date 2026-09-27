import { describe, expect, it, jest } from '@jest/globals';
import { ForbiddenException } from '@nestjs/common';
import { CONCEPTS } from '../../../common';
import { DIR } from '../../directory/directory.concepts';
import { LabStaffGuard } from './lab-staff.guard';

/**
 * Crea una función simulada con la implementación dada.
 *
 * @param impl - Implementación que ejecuta el doble.
 * @returns La función simulada.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const LAB = 'aaaaaaaa-0000-0000-0000-00000000000a';
const CLINIC = 'bbbbbbbb-0000-0000-0000-00000000000b';

/** Tipo de cada tenant del doble. */
const TENANT_TYPES: Record<string, string> = {
  [LAB]: CONCEPTS.TENANT_TYPE_DIAGNOSTIC_CENTER,
  [CLINIC]: CONCEPTS.TENANT_TYPE_PROVIDER,
};

/**
 * Arma el guard con membresías en memoria: `lab-owner` y `lab-staff` son del
 * laboratorio; `patient` es STAFF de la clínica (como el alta de paciente en
 * el tenant por defecto); `ex-staff` tuvo membresía en el laboratorio y ya no
 * la tiene activa.
 *
 * @returns El guard, un constructor de contextos y los dobles.
 */
function build() {
  const memberships: Record<string, { tenantId: string; role: string }> = {
    'lab-owner': { tenantId: LAB, role: DIR.ROLE_OWNER },
    'lab-staff': { tenantId: LAB, role: DIR.ROLE_STAFF },
    patient: { tenantId: CLINIC, role: DIR.ROLE_STAFF },
  };
  const repo = {
    findActiveByUserTenant: mockFn(
      (_em: unknown, userId: string, tenantId: string, status: string) => {
        const m = memberships[userId];
        return Promise.resolve(
          m && m.tenantId === tenantId && status === DIR.MEMBERSHIP_ACTIVE
            ? { userId, tenantId, tenantRoleConceptId: m.role }
            : null,
        );
      },
    ),
  };
  const fork = {
    findOne: mockFn((_entity: unknown, where: { id: string }) =>
      Promise.resolve(
        TENANT_TYPES[where.id]
          ? { id: where.id, tenantTypeConceptId: TENANT_TYPES[where.id] }
          : null,
      ),
    ),
  };
  const em = { fork: () => fork };
  const guard = new LabStaffGuard(em as any, repo as any);
  const ctx = (user: any, resolvedTenantId?: string) =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user, resolvedTenantId }),
      }),
    }) as any;
  return { guard, ctx, repo, fork };
}

describe('LabStaffGuard', () => {
  describe('correcto: quien es personal del laboratorio pasa', () => {
    it('el OWNER de un DIAGNOSTIC_CENTER, sólo con el rol global USER', async () => {
      const { guard, ctx } = build();
      await expect(
        guard.canActivate(ctx({ id: 'lab-owner', roles: ['USER'] }, LAB)),
      ).resolves.toBe(true);
    });

    it('el STAFF invitado al laboratorio', async () => {
      const { guard, ctx } = build();
      await expect(
        guard.canActivate(ctx({ id: 'lab-staff', roles: ['USER'] }, LAB)),
      ).resolves.toBe(true);
    });

    it('CLINICIAN sin ámbito sigue pasando como antes, sin consultar membresías', async () => {
      const { guard, ctx, repo } = build();
      await expect(
        guard.canActivate(ctx({ id: 'doc', roles: ['CLINICIAN'] }, CLINIC)),
      ).resolves.toBe(true);
      expect(repo.findActiveByUserTenant).not.toHaveBeenCalled();
    });

    it('SUPERADMIN es comodín, como en RolesGuard', async () => {
      const { guard, ctx } = build();
      await expect(
        guard.canActivate(ctx({ id: 'root', roles: ['SUPERADMIN'] })),
      ).resolves.toBe(true);
    });
  });

  describe('límite', () => {
    it('PRACTITIONER con ámbito en el tenant activo pasa', async () => {
      const { guard, ctx } = build();
      const user = {
        id: 'doc',
        roles: ['PRACTITIONER'],
        scopedRoles: { [CLINIC]: ['PRACTITIONER'] },
      };
      await expect(guard.canActivate(ctx(user, CLINIC))).resolves.toBe(true);
    });

    it('CLINICIAN con ámbito en OTRO tenant no pasa por el rol, y sin membresía de laboratorio es 403', async () => {
      const { guard, ctx } = build();
      const user = {
        id: 'doc',
        roles: ['CLINICIAN'],
        scopedRoles: { [CLINIC]: ['CLINICIAN'] },
      };
      await expect(guard.canActivate(ctx(user, LAB))).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('ruta sin sujeto: la decide JwtAuthGuard, no este guard', async () => {
      const { guard, ctx } = build();
      await expect(guard.canActivate(ctx(undefined, LAB))).resolves.toBe(true);
    });
  });

  describe('inválido / no autorizado', () => {
    it('un paciente (STAFF del tenant por defecto, que NO es laboratorio) recibe 403', async () => {
      const { guard, ctx } = build();
      await expect(
        guard.canActivate(ctx({ id: 'patient', roles: ['PATIENT'] }, CLINIC)),
      ).rejects.toThrow(
        'Se requiere ser personal del laboratorio de la organización activa',
      );
    });

    it('un miembro del laboratorio que opera con otro tenant activo recibe 403', async () => {
      const { guard, ctx } = build();
      await expect(
        guard.canActivate(ctx({ id: 'lab-owner', roles: ['USER'] }, CLINIC)),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('sin membresía activa en el laboratorio: 403', async () => {
      const { guard, ctx } = build();
      await expect(
        guard.canActivate(ctx({ id: 'ex-staff', roles: ['USER'] }, LAB)),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('sin tenant resuelto no hay laboratorio del que ser personal: 403 sin consultar la base', async () => {
      const { guard, ctx, fork } = build();
      await expect(
        guard.canActivate(ctx({ id: 'lab-owner', roles: ['USER'] })),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(fork.findOne).not.toHaveBeenCalled();
    });

    it('tenant inexistente: 403', async () => {
      const { guard, ctx } = build();
      await expect(
        guard.canActivate(
          ctx(
            { id: 'lab-owner', roles: ['USER'] },
            'cccccccc-0000-0000-0000-00000000000c',
          ),
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });
});
