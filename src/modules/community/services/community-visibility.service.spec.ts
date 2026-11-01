import { jest } from '@jest/globals';

// Loose-typed mock factory: runtime 'jest' pero sin los tipos estrictos Mock<never>.
/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { ForbiddenException } from '@nestjs/common';
import { CommunityVisibilityService } from './community-visibility.service';
import { CommunityOrganizationStaffService } from './community-organization-staff.service';
import { DIR } from '../../directory/directory.concepts';
import { COMM } from '../community.concepts';
import { CONCEPTS } from '../../../common';

// `count` responde por `directory.tenants`: por defecto el `target_id` de una
// vitrina de organización ES un tenant. Los casos que no lo son usan su propio em.
const em = { count: mockFn(async () => 1) } as any;
const emWithoutTenant = { count: mockFn(async () => 0) } as any;
const patient = { id: 'user-1', roles: ['USER'] } as any;
const platform = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const profilesRepo = {
    findById: mockFn(),
    findByTarget: mockFn().mockResolvedValue(null),
  };
  const followsRepo = {
    findByFollowerTarget: mockFn(),
    listFollowedProfileIds: mockFn().mockResolvedValue([]),
  };
  const blocksRepo = {
    existsBetween: mockFn().mockResolvedValue(null),
    listBlockedPeers: mockFn().mockResolvedValue([]),
  };
  const membershipsRepo = {
    findActiveByUserTenant: mockFn().mockResolvedValue(null),
    findByTenantAndStatus: mockFn().mockResolvedValue([]),
  };
  const service = new CommunityVisibilityService(
    profilesRepo as any,
    followsRepo as any,
    blocksRepo as any,
    new CommunityOrganizationStaffService(membershipsRepo as any),
  );
  return { service, profilesRepo, followsRepo, blocksRepo, membershipsRepo };
}

describe('CommunityVisibilityService', () => {
  describe('assertOwnProfile', () => {
    it('acepta el perfil cuyo target_id es el actor', async () => {
      const d = build();
      d.profilesRepo.findById.mockResolvedValue({
        targetId: 'user-1',
        createdByUserId: 'otro',
      });
      await expect(
        d.service.assertOwnProfile(em, 'profile-1', patient),
      ).resolves.toBeUndefined();
    });

    it('acepta el perfil que el propio actor creó', async () => {
      const d = build();
      d.profilesRepo.findById.mockResolvedValue({
        targetId: 'otra-persona',
        createdByUserId: 'user-1',
      });
      await expect(
        d.service.assertOwnProfile(em, 'profile-1', patient),
      ).resolves.toBeUndefined();
    });

    it('rechaza el perfil ajeno', async () => {
      const d = build();
      d.profilesRepo.findById.mockResolvedValue({
        targetId: 'otra-persona',
        createdByUserId: 'otro-admin',
      });
      await expect(
        d.service.assertOwnProfile(em, 'profile-1', patient),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rechaza un perfil inexistente sin revelar que no existe', async () => {
      const d = build();
      d.profilesRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.assertOwnProfile(em, 'profile-x', patient),
      ).rejects.toThrow(ForbiddenException);
    });

    it('deja pasar a plataforma sin consultar el perfil', async () => {
      const d = build();
      await expect(
        d.service.assertOwnProfile(em, 'profile-ajeno', platform),
      ).resolves.toBeUndefined();
      expect(d.profilesRepo.findById).not.toHaveBeenCalled();
    });
  });

  describe('resolveActorProfileId', () => {
    it('sin perfil pedido, resuelve el propio del actor', async () => {
      const d = build();
      d.profilesRepo.findByTarget.mockResolvedValue({ id: 'p-propio' });

      await expect(d.service.resolveActorProfileId(em, patient)).resolves.toBe(
        'p-propio',
      );
    });

    it('un actor sin perfil público lee sin perfil, no falla', async () => {
      const d = build();
      d.profilesRepo.findByTarget.mockResolvedValue(null);

      await expect(
        d.service.resolveActorProfileId(em, patient),
      ).resolves.toBeUndefined();
    });

    it('acepta el perfil pedido cuando es del actor', async () => {
      const d = build();
      d.profilesRepo.findById.mockResolvedValue({
        id: 'p-1',
        targetId: 'user-1',
      });

      await expect(
        d.service.resolveActorProfileId(em, patient, 'p-1'),
      ).resolves.toBe('p-1');
    });

    // La regresión que motivó el método: `canViewPost` concede la lectura de
    // entrada cuando el lector es el autor, así que declarar el perfil del
    // autor en `?actorProfileId=` entregaba sus publicaciones PRIVATE a
    // cualquier sesión. El perfil ajeno tiene que rebotar antes de llegar ahí.
    it('rechaza el perfil ajeno que el cliente declaró como suyo', async () => {
      const d = build();
      d.profilesRepo.findById.mockResolvedValue({
        id: 'p-autor',
        targetId: 'otro-usuario',
      });

      await expect(
        d.service.resolveActorProfileId(em, patient, 'p-autor'),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('plataforma puede mirar con cualquier perfil, es su trabajo', async () => {
      const d = build();

      await expect(
        d.service.resolveActorProfileId(em, platform, 'p-ajeno'),
      ).resolves.toBe('p-ajeno');
      expect(d.profilesRepo.findById).not.toHaveBeenCalled();
    });

    /**
     * El hueco que unificó la resolución del sujeto: la escritura creaba la
     * vitrina de un profesional con `target_id = hpid` y la lectura la buscaba
     * por `target_id = sub`. Un profesional no resolvía su propio perfil al
     * leer, y sus publicaciones FOLLOWERS/PRIVATE desaparecían de su propio muro
     * porque `canViewPost` recibía un lector sin perfil.
     */
    it('resuelve por el perfil profesional cuando la sesión es de un practitioner', async () => {
      const d = build();
      const doctor = {
        id: 'user-2',
        roles: ['CLINICIAN'],
        practitionerProfileId: 'hp-9',
      } as any;
      d.profilesRepo.findByTarget.mockImplementation(
        (_em: any, target: string) =>
          Promise.resolve(target === 'hp-9' ? { id: 'p-doctor' } : null),
      );

      await expect(d.service.resolveActorProfileId(em, doctor)).resolves.toBe(
        'p-doctor',
      );
    });

    it('un practitioner sin vitrina profesional cae en la de su cuenta', async () => {
      const d = build();
      const doctor = {
        id: 'user-2',
        roles: ['CLINICIAN'],
        practitionerProfileId: 'hp-9',
      } as any;
      d.profilesRepo.findByTarget.mockImplementation(
        (_em: any, target: string) =>
          Promise.resolve(target === 'user-2' ? { id: 'p-cuenta' } : null),
      );

      await expect(d.service.resolveActorProfileId(em, doctor)).resolves.toBe(
        'p-cuenta',
      );
    });
  });

  /**
   * La cara de escritura de la propiedad. Se distingue de `assertOwnProfile` en
   * una sola cosa —no hay atajo de plataforma— y esa diferencia es el punto:
   * leer contenido ajeno con rol de moderación es trabajo de un moderador;
   * firmar contenido ajeno no lo es de nadie.
   */
  describe('assertActsAsProfile', () => {
    it('acepta el perfil del propio actor', async () => {
      const d = build();
      d.profilesRepo.findById.mockResolvedValue({ targetId: 'user-1' });
      await expect(
        d.service.assertActsAsProfile(em, 'p-1', patient),
      ).resolves.toBeUndefined();
    });

    it('acepta la vitrina profesional de la sesión', async () => {
      const d = build();
      const doctor = {
        id: 'user-2',
        roles: ['CLINICIAN'],
        practitionerProfileId: 'hp-9',
      } as any;
      d.profilesRepo.findById.mockResolvedValue({
        targetId: 'hp-9',
        createdByUserId: 'un-admin',
      });
      await expect(
        d.service.assertActsAsProfile(em, 'p-doctor', doctor),
      ).resolves.toBeUndefined();
    });

    it('rechaza el perfil ajeno', async () => {
      const d = build();
      d.profilesRepo.findById.mockResolvedValue({ targetId: 'otro' });
      await expect(
        d.service.assertActsAsProfile(em, 'p-ajeno', patient),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('no deja pasar a plataforma: moderar no es suplantar', async () => {
      const d = build();
      d.profilesRepo.findById.mockResolvedValue({ targetId: 'otro' });
      await expect(
        d.service.assertActsAsProfile(em, 'p-ajeno', platform),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('canViewPost', () => {
    it('el autor ve su propio post aunque sea privado', async () => {
      const d = build();
      const visible = await d.service.canViewPost(
        em,
        {
          authorPublicProfileId: 'p-1',
          visibilityConceptId: COMM.POST_VISIBILITY_PRIVATE,
        },
        'p-1',
      );
      expect(visible).toBe(true);
    });

    it('un post sin visibilidad declarada se lee como público', async () => {
      const d = build();
      const visible = await d.service.canViewPost(
        em,
        { authorPublicProfileId: 'p-1', visibilityConceptId: undefined },
        'p-2',
      );
      expect(visible).toBe(true);
    });

    it('el bloqueo corta la lectura en cualquier sentido', async () => {
      const d = build();
      d.blocksRepo.existsBetween.mockResolvedValue({ id: 'block-1' });
      const visible = await d.service.canViewPost(
        em,
        {
          authorPublicProfileId: 'p-1',
          visibilityConceptId: COMM.POST_VISIBILITY_PUBLIC,
        },
        'p-2',
      );
      expect(visible).toBe(false);
    });

    it('FOLLOWERS exige un follow activo', async () => {
      const d = build();
      d.followsRepo.findByFollowerTarget.mockResolvedValue({
        statusConceptId: CONCEPTS.STATE_ACTIVE,
      });
      const visible = await d.service.canViewPost(
        em,
        {
          authorPublicProfileId: 'p-1',
          visibilityConceptId: COMM.POST_VISIBILITY_FOLLOWERS,
        },
        'p-2',
      );
      expect(visible).toBe(true);
    });

    it('FOLLOWERS con un follow no activo no alcanza', async () => {
      const d = build();
      d.followsRepo.findByFollowerTarget.mockResolvedValue({
        statusConceptId: 'otro-estado',
      });
      const visible = await d.service.canViewPost(
        em,
        {
          authorPublicProfileId: 'p-1',
          visibilityConceptId: COMM.POST_VISIBILITY_FOLLOWERS,
        },
        'p-2',
      );
      expect(visible).toBe(false);
    });

    it('PRIVATE no lo ve nadie más que el autor', async () => {
      const d = build();
      const visible = await d.service.canViewPost(
        em,
        {
          authorPublicProfileId: 'p-1',
          visibilityConceptId: COMM.POST_VISIBILITY_PRIVATE,
        },
        'p-2',
      );
      expect(visible).toBe(false);
    });

    it('sin perfil lector, FOLLOWERS queda fuera', async () => {
      const d = build();
      const visible = await d.service.canViewPost(em, {
        authorPublicProfileId: 'p-1',
        visibilityConceptId: COMM.POST_VISIBILITY_FOLLOWERS,
      });
      expect(visible).toBe(false);
    });
  });

  describe('filterVisiblePosts', () => {
    const posts = [
      {
        id: 'a',
        authorPublicProfileId: 'p-1',
        visibilityConceptId: COMM.POST_VISIBILITY_PUBLIC,
      },
      {
        id: 'b',
        authorPublicProfileId: 'p-3',
        visibilityConceptId: COMM.POST_VISIBILITY_FOLLOWERS,
      },
      {
        id: 'c',
        authorPublicProfileId: 'p-4',
        visibilityConceptId: COMM.POST_VISIBILITY_PRIVATE,
      },
      {
        id: 'd',
        authorPublicProfileId: 'p-5',
        visibilityConceptId: COMM.POST_VISIBILITY_PUBLIC,
      },
    ] as any[];

    it('resuelve bloqueos y follows de la página en dos consultas', async () => {
      const d = build();
      d.blocksRepo.listBlockedPeers.mockResolvedValue(['p-5']);
      d.followsRepo.listFollowedProfileIds.mockResolvedValue(['p-3']);

      const visible = await d.service.filterVisiblePosts(em, posts, 'p-2');

      expect(visible.map((p: any) => p.id)).toEqual(['a', 'b']);
      expect(d.blocksRepo.listBlockedPeers).toHaveBeenCalledTimes(1);
      expect(d.followsRepo.listFollowedProfileIds).toHaveBeenCalledTimes(1);
    });

    it('sin lector deja sólo lo público', async () => {
      const d = build();
      const visible = await d.service.filterVisiblePosts(em, posts, undefined);
      expect(visible.map((p: any) => p.id)).toEqual(['a', 'd']);
    });

    it('una página vacía no consulta nada', async () => {
      const d = build();
      const visible = await d.service.filterVisiblePosts(em, [], 'p-2');
      expect(visible).toEqual([]);
      expect(d.blocksRepo.listBlockedPeers).not.toHaveBeenCalled();
    });
  });
  describe('bandeja de organización (mensajería)', () => {
    const PHARMACY_TENANT = 'tenant-farmacia';
    const pharmacyProfile = {
      targetId: PHARMACY_TENANT,
      targetTypeConceptId: COMM.PROFILE_TARGET_PHARMACY,
      statusConceptId: CONCEPTS.STATE_ACTIVE,
      createdByUserId: 'admin-que-verifico',
    };
    const staff = { id: 'staff-1', roles: ['USER', 'PHARMACY_STAFF'] } as any;

    it('el personal con membresía activa lee y escribe como la farmacia', async () => {
      const d = build();
      d.profilesRepo.findById.mockResolvedValue(pharmacyProfile);
      d.membershipsRepo.findActiveByUserTenant.mockResolvedValue({
        tenantRoleConceptId: DIR.ROLE_STAFF,
      });

      await expect(
        d.service.assertOwnMessagingProfile(em, 'vitrina', staff),
      ).resolves.toBe('ORGANIZATION_STAFF');
      await expect(
        d.service.assertActsAsMessagingProfile(em, 'vitrina', staff),
      ).resolves.toBeUndefined();
      // La membresía se consulta en la base contra el tenant de la vitrina,
      // con el estado activo: no se confía en la foto del token.
      expect(d.membershipsRepo.findActiveByUserTenant).toHaveBeenCalledWith(
        em,
        'staff-1',
        PHARMACY_TENANT,
        DIR.MEMBERSHIP_ACTIVE,
      );
    });

    it('sin membresía activa, conocer el profileId no alcanza', async () => {
      const d = build();
      d.profilesRepo.findById.mockResolvedValue(pharmacyProfile);
      d.membershipsRepo.findActiveByUserTenant.mockResolvedValue(null);

      await expect(
        d.service.assertOwnMessagingProfile(em, 'vitrina', staff),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        d.service.assertActsAsMessagingProfile(em, 'vitrina', staff),
      ).rejects.toThrow(ForbiddenException);
    });

    it('un miembro sin el rol runtime de farmacia no atiende una farmacia', async () => {
      const d = build();
      d.profilesRepo.findById.mockResolvedValue(pharmacyProfile);
      d.membershipsRepo.findActiveByUserTenant.mockResolvedValue({
        tenantRoleConceptId: DIR.ROLE_STAFF,
      });

      await expect(
        d.service.assertActsAsMessagingProfile(em, 'vitrina', patient),
      ).rejects.toThrow(ForbiddenException);
      expect(d.membershipsRepo.findActiveByUserTenant).not.toHaveBeenCalled();
    });

    it('el vínculo de profesional (PRACTITIONER) no atiende la bandeja', async () => {
      const d = build();
      d.profilesRepo.findById.mockResolvedValue({
        ...pharmacyProfile,
        targetTypeConceptId: COMM.PROFILE_TARGET_ORGANIZATION,
      });
      d.membershipsRepo.findActiveByUserTenant.mockResolvedValue({
        tenantRoleConceptId: DIR.ROLE_PRACTITIONER,
      });

      await expect(
        d.service.assertActsAsMessagingProfile(em, 'vitrina', staff),
      ).rejects.toThrow(ForbiddenException);
    });

    it('una vitrina de organización inactiva no se atiende', async () => {
      const d = build();
      d.profilesRepo.findById.mockResolvedValue({
        ...pharmacyProfile,
        statusConceptId: CONCEPTS.STATE_PENDING,
      });
      d.membershipsRepo.findActiveByUserTenant.mockResolvedValue({
        tenantRoleConceptId: DIR.ROLE_OWNER,
      });

      await expect(
        d.service.assertActsAsMessagingProfile(em, 'vitrina', staff),
      ).rejects.toThrow(ForbiddenException);
    });

    it('la membresía no sirve para el perfil de una persona', async () => {
      const d = build();
      d.profilesRepo.findById.mockResolvedValue({
        targetId: PHARMACY_TENANT,
        targetTypeConceptId: COMM.PROFILE_TARGET_USER,
        statusConceptId: CONCEPTS.STATE_ACTIVE,
      });
      d.membershipsRepo.findActiveByUserTenant.mockResolvedValue({
        tenantRoleConceptId: DIR.ROLE_OWNER,
      });

      await expect(
        d.service.assertActsAsMessagingProfile(em, 'perfil', staff),
      ).rejects.toThrow(ForbiddenException);
    });

    it('fuera de la mensajería, el STAFF no firma como la farmacia', async () => {
      const d = build();
      d.profilesRepo.findById.mockResolvedValue(pharmacyProfile);
      d.membershipsRepo.findActiveByUserTenant.mockResolvedValue({
        tenantRoleConceptId: DIR.ROLE_STAFF,
      });

      await expect(
        d.service.assertActsAsProfile(em, 'vitrina', staff),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        d.service.assertOwnProfile(em, 'vitrina', staff),
      ).rejects.toThrow(ForbiddenException);
    });

    it.each([
      ['OWNER', DIR.ROLE_OWNER],
      ['ADMIN', DIR.ROLE_ADMIN],
    ])(
      'un %s activo administra la vitrina de su tenant (publicar, reseñar, seguir, bloquear)',
      async (_label, role) => {
        const d = build();
        d.profilesRepo.findById.mockResolvedValue(pharmacyProfile);
        d.membershipsRepo.findActiveByUserTenant.mockResolvedValue({
          tenantRoleConceptId: role,
        });
        const owner = { id: 'owner-1', roles: ['USER'] } as any;

        await expect(
          d.service.assertActsAsProfile(em, 'vitrina', owner),
        ).resolves.toBeUndefined();
        await expect(
          d.service.assertOwnProfile(em, 'vitrina', owner),
        ).resolves.toBeUndefined();
        expect(d.membershipsRepo.findActiveByUserTenant).toHaveBeenCalledWith(
          em,
          'owner-1',
          PHARMACY_TENANT,
          DIR.MEMBERSHIP_ACTIVE,
        );
      },
    );

    describe('quien creó la vitrina de un tenant no es por eso su titular', () => {
      // `projectOrganization` la crea con el admin que verificó el tenant;
      // `setOrganizationLogo`, con quien subió el logo (que puede irse).
      const creator = { id: 'admin-que-verifico', roles: ['USER'] } as any;

      it('sin membresía, el creador no escribe ni lee como la farmacia', async () => {
        const d = build();
        d.profilesRepo.findById.mockResolvedValue(pharmacyProfile);
        d.membershipsRepo.findActiveByUserTenant.mockResolvedValue(null);

        for (const call of [
          () => d.service.assertActsAsProfile(em, 'vitrina', creator),
          () => d.service.assertOwnProfile(em, 'vitrina', creator),
          () => d.service.assertActsAsMessagingProfile(em, 'vitrina', creator),
          () => d.service.assertOwnMessagingProfile(em, 'vitrina', creator),
        ]) {
          await expect(call()).rejects.toThrow(ForbiddenException);
        }
      });

      it('un ex-OWNER con la membresía terminada tampoco', async () => {
        const d = build();
        d.profilesRepo.findById.mockResolvedValue({
          ...pharmacyProfile,
          createdByUserId: 'ex-owner',
        });
        // La consulta exige estado ACTIVO: la terminada no aparece.
        d.membershipsRepo.findActiveByUserTenant.mockResolvedValue(null);
        const exOwner = { id: 'ex-owner', roles: ['PHARMACY_STAFF'] } as any;

        await expect(
          d.service.assertActsAsProfile(em, 'vitrina', exOwner),
        ).rejects.toThrow(ForbiddenException);
        await expect(
          d.service.assertOwnMessagingProfile(em, 'vitrina', exOwner),
        ).rejects.toThrow(ForbiddenException);
      });

      it('con membresía, el acceso de mensajería es revocable (ORGANIZATION_STAFF), nunca HOLDER', async () => {
        const d = build();
        d.profilesRepo.findById.mockResolvedValue(pharmacyProfile);
        d.membershipsRepo.findActiveByUserTenant.mockResolvedValue({
          tenantRoleConceptId: DIR.ROLE_OWNER,
        });
        const ownerCreator = {
          id: 'admin-que-verifico',
          roles: ['PHARMACY_STAFF'],
        } as any;

        await expect(
          d.service.assertOwnMessagingProfile(em, 'vitrina', ownerCreator),
        ).resolves.toBe('ORGANIZATION_STAFF');
      });
    });

    describe('vitrina de tipo organización que NO es de un tenant', () => {
      // SupportAdmin: `target_id` = la cuenta del sistema, `created_by` = ella.
      const supportAdminProfile = {
        targetId: 'support-admin-user',
        targetTypeConceptId: COMM.PROFILE_TARGET_ORGANIZATION,
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        createdByUserId: 'support-admin-user',
      };

      it('su cuenta sigue siendo titular (por target_id)', async () => {
        const d = build();
        d.profilesRepo.findById.mockResolvedValue(supportAdminProfile);
        const supportAdmin = {
          id: 'support-admin-user',
          roles: ['SYSTEM'],
        } as any;

        await expect(
          d.service.assertActsAsProfile(emWithoutTenant, 'p', supportAdmin),
        ).resolves.toBeUndefined();
        await expect(
          d.service.assertActsAsMessagingProfile(
            emWithoutTenant,
            'p',
            supportAdmin,
          ),
        ).resolves.toBeUndefined();
        expect(d.membershipsRepo.findActiveByUserTenant).not.toHaveBeenCalled();
      });

      it('quien la creó sigue siendo titular (regla de siempre)', async () => {
        const d = build();
        d.profilesRepo.findById.mockResolvedValue({
          ...supportAdminProfile,
          targetId: 'unidad-diagnostica-1',
          createdByUserId: 'quien-la-publico',
        });
        const creator = { id: 'quien-la-publico', roles: ['USER'] } as any;

        await expect(
          d.service.assertActsAsProfile(emWithoutTenant, 'p', creator),
        ).resolves.toBeUndefined();
        await expect(
          d.service.assertOwnMessagingProfile(emWithoutTenant, 'p', creator),
        ).resolves.toBe('HOLDER');
      });
    });
  });
  /**
   * Un `SECURITY_ADMIN`/`SUPERADMIN`/`SYSTEM` concedido sólo en el tenant A
   * figura en `roles`, pero `scopedRoles` lo limita a A: sobre un perfil o un
   * grupo del tenant B no es plataforma.
   */
  describe('rol de plataforma acotado a un tenant', () => {
    const PLATFORM = ['SECURITY_ADMIN', 'SUPERADMIN', 'SYSTEM'];
    const scopedTo = (role: string, tenantId: string) =>
      ({
        id: 'admin-a',
        roles: [role],
        scopedRoles: { [tenantId]: [role] },
      }) as any;
    const profileOf = (tenantId: string) => ({
      id: `p-${tenantId}`,
      tenantId,
      targetId: 'otra-persona',
      targetTypeConceptId: 'tipo-persona',
      statusConceptId: CONCEPTS.STATE_ACTIVE,
      createdByUserId: 'otro',
    });

    it('isPlatform: el acotado a A sólo es plataforma en A; el global, en ambos', () => {
      const d = build();
      for (const role of PLATFORM) {
        const scoped = scopedTo(role, 'tenant-a');
        expect(d.service.isPlatform(scoped, 'tenant-a')).toBe(true);
        expect(d.service.isPlatform(scoped, 'tenant-b')).toBe(false);
        // Sin tenant objetivo sólo cuenta el global.
        expect(d.service.isPlatform(scoped, undefined)).toBe(false);
        expect(d.service.isPlatform(scoped, null)).toBe(false);

        const global = {
          id: 'admin-g',
          roles: [role, 'CLINICIAN'],
          scopedRoles: { 'tenant-a': ['CLINICIAN'] },
        } as any;
        expect(d.service.isPlatform(global, 'tenant-a')).toBe(true);
        expect(d.service.isPlatform(global, 'tenant-b')).toBe(true);
        expect(d.service.isPlatform(global, undefined)).toBe(true);
      }
    });

    it('assertOwnProfile: acotado a A NO lee el perfil ajeno de B', async () => {
      for (const role of PLATFORM) {
        const d = build();
        d.profilesRepo.findById.mockResolvedValue(profileOf('tenant-b'));
        await expect(
          d.service.assertOwnProfile(
            em,
            'p-tenant-b',
            scopedTo(role, 'tenant-a'),
          ),
        ).rejects.toThrow(ForbiddenException);
      }
    });

    it('assertOwnProfile: acotado a A sí lee el perfil ajeno de A', async () => {
      for (const role of PLATFORM) {
        const d = build();
        d.profilesRepo.findById.mockResolvedValue(profileOf('tenant-a'));
        await expect(
          d.service.assertOwnProfile(
            em,
            'p-tenant-a',
            scopedTo(role, 'tenant-a'),
          ),
        ).resolves.toBeUndefined();
      }
    });

    it('assertOwnProfile: acotado y perfil inexistente, 403 (no hay tenant que lo habilite)', async () => {
      const d = build();
      d.profilesRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.assertOwnProfile(
          em,
          'p-x',
          scopedTo('SECURITY_ADMIN', 'tenant-a'),
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('assertOwnMessagingProfile: acotado a A no abre la bandeja de B y sí la de A', async () => {
      for (const role of PLATFORM) {
        const d = build();
        d.profilesRepo.findById.mockResolvedValue(profileOf('tenant-b'));
        await expect(
          d.service.assertOwnMessagingProfile(
            emWithoutTenant,
            'p-tenant-b',
            scopedTo(role, 'tenant-a'),
          ),
        ).rejects.toThrow(ForbiddenException);

        d.profilesRepo.findById.mockResolvedValue(profileOf('tenant-a'));
        await expect(
          d.service.assertOwnMessagingProfile(
            emWithoutTenant,
            'p-tenant-a',
            scopedTo(role, 'tenant-a'),
          ),
        ).resolves.toBe('PLATFORM');
      }
    });

    it('resolveActorProfileId: acotado a A no mira con un perfil de B; sí con uno de A', async () => {
      const d = build();
      const actor = scopedTo('SECURITY_ADMIN', 'tenant-a');
      d.profilesRepo.findById.mockResolvedValue(profileOf('tenant-b'));
      await expect(
        d.service.resolveActorProfileId(em, actor, 'p-tenant-b'),
      ).rejects.toBeInstanceOf(ForbiddenException);

      d.profilesRepo.findById.mockResolvedValue(profileOf('tenant-a'));
      await expect(
        d.service.resolveActorProfileId(em, actor, 'p-tenant-a'),
      ).resolves.toBe('p-tenant-a');
    });

    it('global: lee perfiles y bandejas de A y de B sin cargar el perfil', async () => {
      for (const role of PLATFORM) {
        const d = build();
        const actor = { id: 'admin-g', roles: [role] } as any;
        for (const id of ['p-tenant-a', 'p-tenant-b']) {
          await expect(
            d.service.assertOwnProfile(em, id, actor),
          ).resolves.toBeUndefined();
          await expect(
            d.service.assertOwnMessagingProfile(em, id, actor),
          ).resolves.toBe('PLATFORM');
          await expect(
            d.service.resolveActorProfileId(em, actor, id),
          ).resolves.toBe(id);
        }
        expect(d.profilesRepo.findById).not.toHaveBeenCalled();
      }
    });
  });
});
