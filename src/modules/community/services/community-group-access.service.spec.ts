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
import { InsufficientRoleException } from '../../../common/errors/domain.exception';
import { CommunityErrorReason } from '../community.error-reasons';
import { COMM } from '../community.concepts';

const actor = { id: 'user-1', roles: ['USER'] } as any;

const AUDIENCE_IDS = [
  COMM.GROUP_VISIBILITY_VERIFIED_DOCTORS,
  COMM.GROUP_VISIBILITY_ORGANIZATION_STAFF,
  COMM.GROUP_VISIBILITY_ATTENDED_PATIENTS,
];

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 *
 * @returns Resultado de build.
 */
function build() {
  const groupsRepo = {
    findById: mockFn().mockResolvedValue(null),
    findMember: mockFn().mockResolvedValue(null),
    findTenantTypeConceptId: mockFn().mockResolvedValue(null),
  };
  const visibility = {
    resolveActorProfileId: mockFn().mockResolvedValue('p1'),
    isPlatform: mockFn().mockReturnValue(false),
  };
  // API#837: por defecto ningún foro restringe su público; las pruebas del
  // público autorizado lo declaran.
  const audience = {
    isRestricted: mockFn((id: string) => AUDIENCE_IDS.includes(id)),
    isEligible: mockFn().mockResolvedValue(true),
  };
  const service = new CommunityGroupAccessService(
    groupsRepo as any,
    visibility as any,
    audience as any,
  );
  return { service, groupsRepo, visibility, audience };
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

  describe('público autorizado (API#837)', () => {
    it.each(AUDIENCE_IDS)(
      '%s: quien no es del público recibe el mismo 404 que un id inexistente',
      async (visibility) => {
        const d = build();
        d.audience.isEligible.mockResolvedValue(false);
        d.groupsRepo.findById.mockResolvedValue(group(visibility));

        const error = await d.service
          .resolve({} as any, 'g1', actor)
          .catch((e: unknown) => e);
        const missing = await build()
          .service.resolve({} as any, 'g1', actor)
          .catch((e: unknown) => e);

        expect(error).toBeInstanceOf(ResourceNotFoundException);
        expect((error as any).message).toBe((missing as any).message);
        expect((error as any).reason).toBe(
          CommunityErrorReason.GROUP_NOT_FOUND,
        );
        expect((error as any).reason).toBe((missing as any).reason);
      },
    );

    it('el público lo lee, y publica sólo si es integrante', async () => {
      const d = build();
      d.groupsRepo.findById.mockResolvedValue(
        group(COMM.GROUP_VISIBILITY_VERIFIED_DOCTORS),
      );

      const access = await d.service.resolve({} as any, 'g1', actor);

      expect(access.canRead).toBe(true);
      expect(access.canPost).toBe(false);
      expect(d.audience.isEligible).toHaveBeenCalledWith(
        expect.anything(),
        COMM.GROUP_VISIBILITY_VERIFIED_DOCTORS,
        't1',
        actor,
      );
    });

    it('un integrante que dejó de pertenecer al público pierde el acceso', async () => {
      const d = build();
      d.audience.isEligible.mockResolvedValue(false);
      d.groupsRepo.findById.mockResolvedValue(
        group(COMM.GROUP_VISIBILITY_ORGANIZATION_STAFF),
      );
      d.groupsRepo.findMember.mockResolvedValue(
        membership(COMM.GROUP_ROLE_OWNER),
      );

      await expect(
        d.service.resolve({} as any, 'g1', actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('la plataforma lo alcanza para poder moderarlo, sin evaluar el público', async () => {
      const d = build();
      d.visibility.isPlatform.mockReturnValue(true);
      d.audience.isEligible.mockResolvedValue(false);
      d.groupsRepo.findById.mockResolvedValue(
        group(COMM.GROUP_VISIBILITY_ATTENDED_PATIENTS),
      );

      const access = await d.service.resolve({} as any, 'g1', actor);

      expect(access.canRead).toBe(true);
      expect(d.audience.isEligible).not.toHaveBeenCalled();
    });

    it('los grupos sin público declarado no consultan nada', async () => {
      const d = build();
      d.groupsRepo.findById.mockResolvedValue(
        group(COMM.GROUP_VISIBILITY_PUBLIC),
      );

      await d.service.resolve({} as any, 'g1', actor);

      expect(d.audience.isEligible).not.toHaveBeenCalled();
    });

    it('quien abre un foro de público autorizado debe pertenecer a él', async () => {
      const d = build();
      d.audience.isEligible.mockResolvedValue(false);

      const error = await d.service
        .assertActorBelongsToAudience(
          {} as any,
          COMM.GROUP_VISIBILITY_VERIFIED_DOCTORS,
          't1',
          actor,
        )
        .catch((e: unknown) => e);

      expect(error).toBeInstanceOf(InsufficientRoleException);
      expect((error as any).reason).toBe(
        CommunityErrorReason.GROUP_AUDIENCE_OWNER_NOT_ELIGIBLE,
      );
    });

    it('abrir un foro público no exige pertenecer a ningún público', async () => {
      const d = build();
      d.audience.isEligible.mockResolvedValue(false);

      await expect(
        d.service.assertActorBelongsToAudience(
          {} as any,
          COMM.GROUP_VISIBILITY_PUBLIC,
          't1',
          actor,
        ),
      ).resolves.toBeUndefined();
    });
  });

  describe('la aseguradora no abre foros ni inicia debates (API#837)', () => {
    it('una organización aseguradora no puede crear un foro', async () => {
      const d = build();
      d.groupsRepo.findTenantTypeConceptId.mockResolvedValue(
        CONCEPTS.TENANT_TYPE_PAYER,
      );

      const error = await d.service
        .assertOrganizationMayStartForums({} as any, 't-aseg', 'CREATE_GROUP')
        .catch((e: unknown) => e);

      expect(error).toBeInstanceOf(InsufficientRoleException);
      expect((error as any).reason).toBe(
        CommunityErrorReason.INSURER_CANNOT_CREATE_GROUP,
      );
      expect(d.groupsRepo.findTenantTypeConceptId).toHaveBeenCalledWith(
        expect.anything(),
        't-aseg',
      );
    });

    it('ni iniciar un debate, con su propio código', async () => {
      const d = build();
      d.groupsRepo.findTenantTypeConceptId.mockResolvedValue(
        CONCEPTS.TENANT_TYPE_PAYER,
      );

      const error = await d.service
        .assertOrganizationMayStartForums({} as any, 't-aseg', 'START_DEBATE')
        .catch((e: unknown) => e);

      expect((error as any).reason).toBe(
        CommunityErrorReason.INSURER_CANNOT_START_DEBATE,
      );
    });

    it.each([
      CONCEPTS.TENANT_TYPE_PROVIDER,
      CONCEPTS.TENANT_TYPE_HOSPITAL,
      CONCEPTS.TENANT_TYPE_CLINIC,
      CONCEPTS.TENANT_TYPE_MEDICAL_OFFICE,
    ])('la organización médica (%s) sí puede', async (type) => {
      const d = build();
      d.groupsRepo.findTenantTypeConceptId.mockResolvedValue(type);

      await expect(
        d.service.assertOrganizationMayStartForums(
          {} as any,
          't1',
          'CREATE_GROUP',
        ),
      ).resolves.toBeUndefined();
    });

    it('sin organización activa no hay tipo contra el cual negar', async () => {
      const d = build();

      await expect(
        d.service.assertOrganizationMayStartForums(
          {} as any,
          undefined,
          'CREATE_GROUP',
        ),
      ).resolves.toBeUndefined();
      expect(d.groupsRepo.findTenantTypeConceptId).not.toHaveBeenCalled();
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
