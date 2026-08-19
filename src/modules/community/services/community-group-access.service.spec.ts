import { jest } from '@jest/globals';
import { ForbiddenException } from '@nestjs/common';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { CommunityGroupAccessService } from './community-group-access.service';
import { CONCEPTS, ResourceNotFoundException } from '../../../common';
import { COMM } from '../community.concepts';

const actor = { id: 'user-1', roles: ['USER'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 *
 * @returns Resultado de build.
 */
function build() {
  const groupsRepo = {
    findById: mockFn().mockResolvedValue(null),
    findMember: mockFn().mockResolvedValue(null),
  };
  const visibility = {
    resolveActorProfileId: mockFn().mockResolvedValue('p1'),
    isPlatform: mockFn().mockReturnValue(false),
  };
  const service = new CommunityGroupAccessService(
    groupsRepo as any,
    visibility as any,
  );
  return { service, groupsRepo, visibility };
}

/** Un grupo con la visibilidad pedida. */
function group(
  visibilityConceptId: string,
  statusConceptId = CONCEPTS.STATE_ACTIVE,
) {
  return { id: 'g1', visibilityConceptId, tenantId: 't1', statusConceptId };
}

/** Una membresía activa con el rol pedido. */
function membership(memberRoleConceptId: string) {
  return {
    id: 'm1',
    memberRoleConceptId,
    joinStatusConceptId: COMM.GROUP_JOIN_ACTIVE,
  };
}

describe('CommunityGroupAccessService (P7)', () => {
  it('404 cuando el grupo no existe', async () => {
    const d = build();
    await expect(
      d.service.resolve({} as any, 'g1', actor),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });

  describe('grupo público', () => {
    it('lo lee cualquier sesión, pero publica sólo el integrante', async () => {
      const d = build();
      d.groupsRepo.findById.mockResolvedValue(
        group(COMM.GROUP_VISIBILITY_PUBLIC),
      );

      const access = await d.service.resolve({} as any, 'g1', actor);

      expect(access.canRead).toBe(true);
      expect(access.canPost).toBe(false);
      expect(() => d.service.assertCanRead(access)).not.toThrow();
      expect(() => d.service.assertCanPost(access)).toThrow(ForbiddenException);
    });
  });

  describe('grupo privado', () => {
    it('no deja leer el interior a quien no entró', async () => {
      const d = build();
      d.groupsRepo.findById.mockResolvedValue(
        group(COMM.GROUP_VISIBILITY_PRIVATE),
      );

      const access = await d.service.resolve({} as any, 'g1', actor);

      expect(access.canRead).toBe(false);
      expect(() => d.service.assertCanRead(access)).toThrow(ForbiddenException);
    });

    it('el integrante activo lee y publica', async () => {
      const d = build();
      d.groupsRepo.findById.mockResolvedValue(
        group(COMM.GROUP_VISIBILITY_PRIVATE),
      );
      d.groupsRepo.findMember.mockResolvedValue(
        membership(COMM.GROUP_ROLE_MEMBER),
      );

      const access = await d.service.resolve({} as any, 'g1', actor);

      expect(access.isMember).toBe(true);
      expect(access.canRead).toBe(true);
      expect(access.canPost).toBe(true);
      // Ser integrante no es administrar.
      expect(access.canAdminister).toBe(false);
    });

    it('una membresía pendiente todavía no es membresía', async () => {
      const d = build();
      d.groupsRepo.findById.mockResolvedValue(
        group(COMM.GROUP_VISIBILITY_PRIVATE),
      );
      d.groupsRepo.findMember.mockResolvedValue({
        id: 'm1',
        memberRoleConceptId: COMM.GROUP_ROLE_MEMBER,
        joinStatusConceptId: COMM.GROUP_JOIN_PENDING,
      });

      const access = await d.service.resolve({} as any, 'g1', actor);

      expect(access.isMember).toBe(false);
      expect(access.canPost).toBe(false);
      // La ficha sí se ve: es lo que le permite saber que su alta está en cola.
      expect(access.membership?.joinStatusConceptId).toBe(
        COMM.GROUP_JOIN_PENDING,
      );
    });
  });

  describe('grupo secreto', () => {
    it('para un extraño no existe: 404, no 403', async () => {
      const d = build();
      d.groupsRepo.findById.mockResolvedValue(
        group(COMM.GROUP_VISIBILITY_SECRET),
      );

      await expect(
        d.service.resolve({} as any, 'g1', actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('su integrante sí lo resuelve', async () => {
      const d = build();
      d.groupsRepo.findById.mockResolvedValue(
        group(COMM.GROUP_VISIBILITY_SECRET),
      );
      d.groupsRepo.findMember.mockResolvedValue(
        membership(COMM.GROUP_ROLE_MEMBER),
      );

      const access = await d.service.resolve({} as any, 'g1', actor);

      expect(access.canRead).toBe(true);
    });

    it('la plataforma lo alcanza para poder moderarlo', async () => {
      const d = build();
      d.visibility.isPlatform.mockReturnValue(true);
      d.groupsRepo.findById.mockResolvedValue(
        group(COMM.GROUP_VISIBILITY_SECRET),
      );

      const access = await d.service.resolve({} as any, 'g1', actor);

      expect(access.canRead).toBe(true);
      expect(access.canAdminister).toBe(true);
    });
  });

  describe('roles', () => {
    it.each([
      [COMM.GROUP_ROLE_OWNER, true, true],
      [COMM.GROUP_ROLE_ADMIN, true, true],
      [COMM.GROUP_ROLE_MODERATOR, false, true],
      [COMM.GROUP_ROLE_MEMBER, false, false],
    ])(
      'rol %s → administra=%s modera=%s',
      async (role, administers, moderates) => {
        const d = build();
        d.groupsRepo.findById.mockResolvedValue(
          group(COMM.GROUP_VISIBILITY_PRIVATE),
        );
        d.groupsRepo.findMember.mockResolvedValue(membership(role));

        const access = await d.service.resolve({} as any, 'g1', actor);

        expect(access.canAdminister).toBe(administers);
        expect(access.canModerate).toBe(moderates);
      },
    );

    it('assertCanAdminister corta a quien no administra', () => {
      const d = build();
      expect(() =>
        d.service.assertCanAdminister({ canAdminister: false } as any),
      ).toThrow(ForbiddenException);
    });
  });

  /**
   * TP-3 · regla 08: un grupo sin nadie adentro se disuelve, y su dirección
   * deja de abrir. 404 y no 403 porque no es una cuestión de permiso: el grupo
   * dejó de existir como tal.
   */
  describe('grupo disuelto (TP-3)', () => {
    it('su dirección deja de abrir, incluso para quien fue integrante', async () => {
      const d = build();
      d.groupsRepo.findById.mockResolvedValue(
        group(COMM.GROUP_VISIBILITY_PUBLIC, CONCEPTS.STATE_REVOKED),
      );
      d.groupsRepo.findMember.mockResolvedValue(
        membership(COMM.GROUP_ROLE_MEMBER),
      );

      await expect(
        d.service.resolve({} as any, 'g1', actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    /**
     * Moderar lo que se publicó en un grupo que después se disolvió sigue
     * siendo trabajo de la plataforma: dejarla fuera crearía un punto ciego que
     * se abre con sólo vaciar el grupo.
     */
    it('la plataforma sí lo alcanza', async () => {
      const d = build();
      d.groupsRepo.findById.mockResolvedValue(
        group(COMM.GROUP_VISIBILITY_PUBLIC, CONCEPTS.STATE_REVOKED),
      );
      d.visibility.isPlatform.mockReturnValue(true);

      const access = await d.service.resolve({} as any, 'g1', actor);

      expect(access.canModerate).toBe(true);
    });
  });
});
