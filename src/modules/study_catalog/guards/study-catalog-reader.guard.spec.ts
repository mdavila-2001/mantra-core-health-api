import { describe, expect, it, jest } from '@jest/globals';
import { ForbiddenException } from '@nestjs/common';
import { CONCEPTS } from '../../../common';
import { DIR } from '../../directory/directory.concepts';
import { StudyCatalogReaderGuard } from './study-catalog-reader.guard';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
const LAB = 'aaaaaaaa-0000-0000-0000-00000000000a';
const CLINIC = 'bbbbbbbb-0000-0000-0000-00000000000b';
const TYPES: Record<string, string> = {
  [LAB]: CONCEPTS.TENANT_TYPE_DIAGNOSTIC_CENTER,
  [CLINIC]: CONCEPTS.TENANT_TYPE_PROVIDER,
};

function build() {
  const members: Record<string, string> = { 'lab-staff': LAB, patient: CLINIC };
  const repo = {
    findActiveByUserTenant: mockFn(
      (_em: unknown, userId: string, tenantId: string, status: string) =>
        Promise.resolve(
          members[userId] === tenantId && status === DIR.MEMBERSHIP_ACTIVE
            ? { userId, tenantId }
            : null,
        ),
    ),
  };
  const fork = {
    findOne: mockFn((_e: unknown, where: { id: string }) =>
      Promise.resolve(
        TYPES[where.id]
          ? { id: where.id, tenantTypeConceptId: TYPES[where.id] }
          : null,
      ),
    ),
  };
  const guard = new StudyCatalogReaderGuard(
    { fork: () => fork } as any,
    repo as any,
  );
  const ctx = (user: any, resolvedTenantId?: string) =>
    ({
      switchToHttp: () => ({ getRequest: () => ({ user, resolvedTenantId }) }),
    }) as any;
  return { guard, ctx, repo };
}

describe('StudyCatalogReaderGuard (matriz §3.g)', () => {
  it.each(['CLINICIAN', 'PRACTITIONER', 'SECURITY_ADMIN', 'SUPERADMIN'])(
    'el rol %s lee el catálogo',
    async (role) => {
      const { guard, ctx } = build();
      await expect(
        guard.canActivate(ctx({ id: 'u', roles: [role] }, CLINIC)),
      ).resolves.toBe(true);
    },
  );

  it('el personal de un centro diagnóstico (aunque no sea el ejecutor de una orden) lee', async () => {
    const { guard, ctx } = build();
    await expect(
      guard.canActivate(ctx({ id: 'lab-staff', roles: ['USER'] }, LAB)),
    ).resolves.toBe(true);
  });

  it('un paciente (STAFF del tenant por defecto, que no es centro diagnóstico) recibe 403', async () => {
    const { guard, ctx } = build();
    await expect(
      guard.canActivate(ctx({ id: 'patient', roles: ['PATIENT'] }, CLINIC)),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('un CLINICIAN con ámbito sólo en otro tenant no lee en este', async () => {
    const { guard, ctx } = build();
    const user = {
      id: 'doc',
      roles: [],
      scopedRoles: { [CLINIC]: ['CLINICIAN'] },
    };
    await expect(guard.canActivate(ctx(user, LAB))).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('sin tenant resuelto y sin rol: 403 sin consultar membresías', async () => {
    const { guard, ctx, repo } = build();
    await expect(
      guard.canActivate(ctx({ id: 'x', roles: ['USER'] }, undefined)),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(repo.findActiveByUserTenant).not.toHaveBeenCalled();
  });

  it('ruta sin sujeto: la decide JwtAuthGuard (401), no este guard', async () => {
    const { guard, ctx } = build();
    await expect(guard.canActivate(ctx(undefined, LAB))).resolves.toBe(true);
  });
});
