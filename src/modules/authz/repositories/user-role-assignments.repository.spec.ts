import { jest } from '@jest/globals';
const fn = jest.fn as unknown as (impl?: (...a: any[]) => any) => any;
import { UserRoleAssignmentsRepository } from './user-role-assignments.repository';
import { CONCEPTS } from '../../../common';

function build() {
  const findOne = fn(() => Promise.resolve(null));
  const em = { findOne };
  const repo = new UserRoleAssignmentsRepository();
  return { repo, em: em as never, findOne };
}

/**
 * MCH-034: alta y lookup comparten la misma clave compuesta
 * (user, role, tenant, branch, practice), con nulos como parte del ámbito y
 * no como comodín.
 *
 * Antes `findActive` sólo miraba `(userId, roleId)`: una asignación existente
 * en el tenant A bastaba para que `ensureRoleByCode`/`assignRole` dieran por
 * satisfecho el mismo rol pedido para el tenant B (lo omitían en silencio, o
 * lo rechazaban como «ya asignado» cuando en realidad era un ámbito distinto).
 */
describe('UserRoleAssignmentsRepository.findActive (MCH-034)', () => {
  it('filtra por tenant/branch/practice además de user y role', async () => {
    const d = build();

    await d.repo.findActive(d.em, 'u1', 'r1', {
      tenantId: 'tenant-A',
      branchId: 'branch-1',
      practiceId: 'practice-1',
    });

    expect(d.findOne).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        userId: 'u1',
        roleId: 'r1',
        tenantId: 'tenant-A',
        branchId: 'branch-1',
        practiceId: 'practice-1',
        statusConceptId: CONCEPTS.STATE_ACTIVE,
      }),
    );
  });

  it('un ámbito omitido busca explícitamente NULL, no "cualquiera"', async () => {
    const d = build();

    // Sin tenant/branch/practice: es una asignación global, y el lookup tiene
    // que buscar exactamente eso, no toda fila del usuario con ese rol.
    await d.repo.findActive(d.em, 'u1', 'r1');

    expect(d.findOne).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        tenantId: null,
        branchId: null,
        practiceId: null,
      }),
    );
  });

  it('sin ámbito coincide sólo con una asignación global, no con una de un tenant', async () => {
    // No es un mock de `findOne`: es la garantía de que el criterio distingue
    // {tenantId: null} de {tenantId: 'tenant-A'} — MikroORM omite del WHERE una
    // clave en `undefined`, así que pasar `undefined` sin normalizar a `null`
    // reabriría exactamente el defecto de MCH-034.
    const d = build();
    await d.repo.findActive(d.em, 'u1', 'r1', { tenantId: undefined });
    const criteria = d.findOne.mock.calls.at(-1)?.[1] as { tenantId: unknown };
    expect(criteria.tenantId).toBeNull();
    expect(criteria.tenantId).not.toBeUndefined();
  });
});
