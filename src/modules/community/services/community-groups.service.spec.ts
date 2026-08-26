import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import {
  CommunityGroupsService,
  GRUPO_DISUELTO,
} from './community-groups.service';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import { COMM } from '../community.concepts';

const actor = { id: 'u1', roles: [] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const groupsRepo = {
    create: mockFn(),
    findById: mockFn(),
    findBySlug: mockFn().mockResolvedValue(null),
    findMember: mockFn(),
    findMemberById: mockFn(),
    findTopicById: mockFn(),
    countMembersByStatus: mockFn().mockResolvedValue(0),
    createMember: mockFn(),
    // TP-3: el candado del grupo y la sucesión del dueño.
    findByIdForUpdate: mockFn().mockResolvedValue(null),
    listActiveMembersByAge: mockFn().mockResolvedValue([]),
  };
  const access = {
    resolve: mockFn(),
    assertCanAdminister: mockFn(),
    assertCanPost: mockFn(),
    assertCanRead: mockFn(),
  };
  const visibility = {
    resolveActorProfileId: mockFn().mockResolvedValue('owner-profile'),
  };
  const notifications = {
    notifyJoinApproved: mockFn().mockResolvedValue(undefined),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  // TP-3 · regla 06: por defecto el perfil público está completo, para que las
  // pruebas que no hablan del perfil no tengan que montarlo.
  const publicProfilesRepo = {
    findById: mockFn().mockResolvedValue({
      id: 'owner-profile',
      displayName: 'Dra. Lucía Salas',
      avatarFileId: 'file-1',
      visibilityConceptId: COMM.PROFILE_VISIBILITY_PUBLIC,
    }),
  };
  const service = new CommunityGroupsService(
    em as any,
    groupsRepo as any,
    publicProfilesRepo as any,
    access as any,
    visibility as any,
    notifications as any,
    logger as any,
  );
  return {
    service,
    tx,
    groupsRepo,
    publicProfilesRepo,
    access,
    visibility,
    notifications,
  };
}

describe('CommunityGroupsService', () => {
  describe('createGroup', () => {
    it('creates a group and enrolls its owner', async () => {
      const d = build();
      const group: any = { id: 'g1' };
      d.groupsRepo.create.mockReturnValue(group);
      d.groupsRepo.createMember.mockReturnValue({ id: 'm-owner' });

      const res = await d.service.createGroup({ slug: 's', name: 'N' }, actor);

      expect(res).toEqual({ id: 'g1' });
      // Sin esto el creador no era integrante de su propio grupo y no podia
      // publicar en el.
      expect(d.groupsRepo.createMember).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          groupId: 'g1',
          memberProfileId: 'owner-profile',
          memberRoleConceptId: COMM.GROUP_ROLE_OWNER,
          joinStatusConceptId: COMM.GROUP_JOIN_ACTIVE,
        }),
      );
      expect(group.memberCount).toBe(1);
    });

    it('rejects a slug already taken in the organisation', async () => {
      const d = build();
      d.groupsRepo.findBySlug.mockResolvedValue({ id: 'other' });
      await expect(
        d.service.createGroup({ slug: 's', name: 'N' }, actor),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rejects a topic that does not exist', async () => {
      const d = build();
      d.groupsRepo.findTopicById.mockResolvedValue(null);
      await expect(
        d.service.createGroup(
          { slug: 's', name: 'N', topicId: 't-missing' },
          actor,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('joinGroup (UC-19-13)', () => {
    it('throws when the group does not exist', async () => {
      const d = build();
      d.groupsRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.joinGroup('missing', { memberProfileId: 'p1' } as any, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('rejects duplicate membership', async () => {
      const d = build();
      d.groupsRepo.findById.mockResolvedValue({
        id: 'g1',
        visibilityConceptId: COMM.GROUP_VISIBILITY_PUBLIC,
      });
      d.groupsRepo.findMember.mockResolvedValue({
        id: 'm0',
        joinStatusConceptId: COMM.GROUP_JOIN_ACTIVE,
      });
      await expect(
        d.service.joinGroup('g1', { memberProfileId: 'p1' } as any, actor),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('lets someone who left a public group come back', async () => {
      const d = build();
      const group = {
        id: 'g1',
        visibilityConceptId: COMM.GROUP_VISIBILITY_PUBLIC,
        memberCount: 1,
        updatedAt: new Date(),
      };
      const old = {
        id: 'm0',
        joinStatusConceptId: COMM.GROUP_JOIN_LEFT,
        memberRoleConceptId: COMM.GROUP_ROLE_MEMBER,
        updatedAt: new Date(),
      };
      d.groupsRepo.findById.mockResolvedValue(group);
      d.groupsRepo.findMember.mockResolvedValue(old);

      const res = await d.service.joinGroup(
        'g1',
        { memberProfileId: 'p1' } as any,
        actor,
      );

      expect(res).toEqual({ id: 'm0', joinStatus: COMM.GROUP_JOIN_ACTIVE });
      expect(old.joinStatusConceptId).toBe(COMM.GROUP_JOIN_ACTIVE);
      expect(group.memberCount).toBe(2);
    });

    it('activates membership and bumps count for public groups', async () => {
      const d = build();
      const group = {
        id: 'g1',
        visibilityConceptId: COMM.GROUP_VISIBILITY_PUBLIC,
        memberCount: 2,
        updatedAt: new Date(),
      };
      d.groupsRepo.findById.mockResolvedValue(group);
      d.groupsRepo.findMember.mockResolvedValue(null);
      d.groupsRepo.createMember.mockReturnValue({ id: 'm1' });
      const res = await d.service.joinGroup(
        'g1',
        { memberProfileId: 'p1' },
        actor,
      );
      expect(res).toEqual({ id: 'm1', joinStatus: COMM.GROUP_JOIN_ACTIVE });
      expect(group.memberCount).toBe(3);
    });

    it('leaves membership pending for private groups', async () => {
      const d = build();
      const group = {
        id: 'g1',
        visibilityConceptId: COMM.GROUP_VISIBILITY_PRIVATE,
        memberCount: 0,
        updatedAt: new Date(),
      };
      d.groupsRepo.findById.mockResolvedValue(group);
      d.groupsRepo.findMember.mockResolvedValue(null);
      d.groupsRepo.createMember.mockReturnValue({ id: 'm2' });
      const res = await d.service.joinGroup(
        'g1',
        { memberProfileId: 'p1' },
        actor,
      );
      expect(res.joinStatus).toBe(COMM.GROUP_JOIN_PENDING);
      expect(group.memberCount).toBe(0);
    });
  });

  describe('leaveGroup (P7)', () => {
    it('marks a self-service exit as LEFT and discounts the member', async () => {
      const d = build();
      const group: any = {
        id: 'g1',
        memberCount: 3,
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        updatedAt: new Date(),
      };
      const member = {
        id: 'm1',
        memberRoleConceptId: COMM.GROUP_ROLE_MEMBER,
        joinStatusConceptId: COMM.GROUP_JOIN_ACTIVE,
        updatedAt: new Date(),
      };
      d.access.resolve.mockResolvedValue({ group, actorProfileId: 'p1' });
      d.groupsRepo.findByIdForUpdate.mockResolvedValue(group);
      d.groupsRepo.findMember.mockResolvedValue(member);
      d.groupsRepo.countMembersByStatus.mockResolvedValue(2);

      const res = await d.service.leaveGroup('g1', 'p1', actor);

      expect(res.joinStatusConceptId).toBe(COMM.GROUP_JOIN_LEFT);
      expect(group.memberCount).toBe(2);
      // Nadie tuvo que administrar nada: se dio de baja a si mismo.
      expect(d.access.assertCanAdminister).not.toHaveBeenCalled();
    });

    it('marks an expulsion as REMOVED and demands administration', async () => {
      const d = build();
      const group: any = {
        id: 'g1',
        memberCount: 3,
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        updatedAt: new Date(),
      };
      d.access.resolve.mockResolvedValue({ group, actorProfileId: 'admin' });
      d.groupsRepo.findByIdForUpdate.mockResolvedValue(group);
      d.groupsRepo.findMember.mockResolvedValue({
        id: 'm2',
        memberRoleConceptId: COMM.GROUP_ROLE_MEMBER,
        joinStatusConceptId: COMM.GROUP_JOIN_ACTIVE,
        updatedAt: new Date(),
      });
      d.groupsRepo.countMembersByStatus.mockResolvedValue(2);

      const res = await d.service.leaveGroup('g1', 'p9', actor);

      expect(d.access.assertCanAdminister).toHaveBeenCalled();
      expect(res.joinStatusConceptId).toBe(COMM.GROUP_JOIN_REMOVED);
    });

    /**
     * TP-3 cambió esta regla a propósito, y conviene dejar dicho por qué.
     *
     * Antes el dueño tenía prohibido irse «hasta transferirlo». La intención
     * era buena —no dejar el grupo huérfano— pero el efecto era atarlo a un
     * grupo del que quería salir, y encima no evitaba el huérfano: bastaba con
     * que el dueño fuera el único integrante para que nadie pudiera irse jamás
     * y el grupo quedara vivo para siempre con una sola persona que ya no
     * participa.
     *
     * Ahora el dueño se va y el grupo se resuelve solo: si queda gente, alguien
     * hereda; si no queda nadie, se disuelve. Los dos casos están cubiertos en
     * el bloque de la regla 08.
     */
    it('el dueño ya puede irse: el grupo se resuelve en vez de trabarlo', async () => {
      const d = build();
      const group: any = {
        id: 'g1',
        memberCount: 1,
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        updatedAt: new Date(),
      };
      d.access.resolve.mockResolvedValue({ group, actorProfileId: 'p1' });
      d.groupsRepo.findByIdForUpdate.mockResolvedValue(group);
      d.groupsRepo.findMember.mockResolvedValue({
        id: 'm1',
        memberRoleConceptId: COMM.GROUP_ROLE_OWNER,
        joinStatusConceptId: COMM.GROUP_JOIN_ACTIVE,
      });
      d.groupsRepo.countMembersByStatus.mockResolvedValue(0);

      const res = await d.service.leaveGroup('g1', 'p1', actor);

      expect(res.joinStatusConceptId).toBe(COMM.GROUP_JOIN_LEFT);
      expect(group.statusConceptId).toBe(GRUPO_DISUELTO);
    });
  });

  describe('updateMember (P7)', () => {
    it('approves a pending join and counts the new member', async () => {
      const d = build();
      const group: any = { memberCount: 4, updatedAt: new Date() };
      const member = {
        id: 'm3',
        memberRoleConceptId: COMM.GROUP_ROLE_MEMBER,
        joinStatusConceptId: COMM.GROUP_JOIN_PENDING,
        updatedAt: new Date(),
      };
      d.access.resolve.mockResolvedValue({ group, actorProfileId: 'admin' });
      d.groupsRepo.findMemberById.mockResolvedValue(member);

      const res = await d.service.updateMember(
        'g1',
        'm3',
        { decision: 'APPROVE' },
        actor,
      );

      expect(res.joinStatusConceptId).toBe(COMM.GROUP_JOIN_ACTIVE);
      expect(group.memberCount).toBe(5);
      expect(d.notifications.notifyJoinApproved).toHaveBeenCalled();
    });

    it('un rechazo no le avisa a nadie', async () => {
      const d = build();
      const group: any = { memberCount: 4, updatedAt: new Date() };
      d.access.resolve.mockResolvedValue({ group, actorProfileId: 'admin' });
      d.groupsRepo.findMemberById.mockResolvedValue({
        id: 'm3',
        memberProfileId: 'p3',
        memberRoleConceptId: COMM.GROUP_ROLE_MEMBER,
        joinStatusConceptId: COMM.GROUP_JOIN_PENDING,
        updatedAt: new Date(),
      });

      const res = await d.service.updateMember(
        'g1',
        'm3',
        { decision: 'REJECT' },
        actor,
      );

      expect(res.joinStatusConceptId).toBe(COMM.GROUP_JOIN_REJECTED);
      expect(group.memberCount).toBe(4);
      expect(d.notifications.notifyJoinApproved).not.toHaveBeenCalled();
    });

    it('promotes a member without touching the head count', async () => {
      const d = build();
      const group: any = { memberCount: 4, updatedAt: new Date() };
      const member = {
        id: 'm3',
        memberRoleConceptId: COMM.GROUP_ROLE_MEMBER,
        joinStatusConceptId: COMM.GROUP_JOIN_ACTIVE,
        updatedAt: new Date(),
      };
      d.access.resolve.mockResolvedValue({ group, actorProfileId: 'admin' });
      d.groupsRepo.findMemberById.mockResolvedValue(member);

      const res = await d.service.updateMember(
        'g1',
        'm3',
        { role: 'ADMIN' },
        actor,
      );

      expect(res.memberRoleConceptId).toBe(COMM.GROUP_ROLE_ADMIN);
      expect(group.memberCount).toBe(4);
      expect(d.notifications.notifyJoinApproved).not.toHaveBeenCalled();
    });

    it('refuses to resolve a join that was already resolved', async () => {
      const d = build();
      d.access.resolve.mockResolvedValue({
        group: { memberCount: 1, updatedAt: new Date() },
        actorProfileId: 'admin',
      });
      d.groupsRepo.findMemberById.mockResolvedValue({
        id: 'm3',
        memberRoleConceptId: COMM.GROUP_ROLE_MEMBER,
        joinStatusConceptId: COMM.GROUP_JOIN_ACTIVE,
      });

      await expect(
        d.service.updateMember('g1', 'm3', { decision: 'APPROVE' }, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('refuses a body that asks for nothing', async () => {
      const d = build();
      await expect(
        d.service.updateMember('g1', 'm3', {}, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  /* ======================================================================
       TP-3 · Las tres reglas de grupos
     ====================================================================== */

  /**
   * Regla 07 — el creador ES el primer miembro.
   *
   * Es el defecto F-30 en su raíz: el alta creaba el grupo siempre y le ponía
   * dueño sólo si el actor tenía perfil público. Quien no lo tenía terminaba
   * con un grupo suyo, sin dueño y sin un solo integrante, y no era
   * recuperable: para entrar hay que ser miembro, y para hacerse miembro hay
   * que ser dueño.
   */
  describe('createGroup · creador = primer miembro (TP-3, regla 07)', () => {
    const alta = { slug: 'cardio', name: 'Cardiología' } as any;

    it('el grupo nace con exactamente un integrante, y es su dueño', async () => {
      const d = build();
      d.groupsRepo.create.mockReturnValue({ id: 'grp-1' });

      await d.service.createGroup(alta, actor);

      expect(d.groupsRepo.createMember).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          groupId: 'grp-1',
          memberProfileId: 'owner-profile',
          memberRoleConceptId: COMM.GROUP_ROLE_OWNER,
          joinStatusConceptId: COMM.GROUP_JOIN_ACTIVE,
        }),
      );
      expect(d.groupsRepo.createMember).toHaveBeenCalledTimes(1);
    });

    it('sin perfil público no se crea el grupo, en vez de crearlo huérfano', async () => {
      const d = build();
      d.visibility.resolveActorProfileId.mockResolvedValue(null);

      await expect(d.service.createGroup(alta, actor)).rejects.toBeInstanceOf(
        PreconditionFailedException,
      );
      expect(d.groupsRepo.create).not.toHaveBeenCalled();
      expect(d.groupsRepo.createMember).not.toHaveBeenCalled();
    });
  });

  /**
   * Regla 06 — un grupo público exige un perfil público completo.
   *
   * Un grupo público se le muestra a desconocidos con la cara de quien lo creó.
   */
  describe('createGroup · perfil público completo (TP-3, regla 06)', () => {
    const publico = { slug: 'cardio', name: 'Cardiología' } as any;

    it('sin foto no se puede crear un grupo público, con el código en el cuerpo', async () => {
      const d = build();
      d.publicProfilesRepo.findById.mockResolvedValue({
        id: 'owner-profile',
        displayName: 'Dra. Lucía Salas',
        avatarFileId: undefined,
        visibilityConceptId: COMM.PROFILE_VISIBILITY_PUBLIC,
      });

      const error = await d.service
        .createGroup(publico, actor)
        .catch((e: unknown) => e as any);

      expect(error).toBeInstanceOf(PreconditionFailedException);
      expect(JSON.stringify(error.getResponse?.() ?? {})).toContain(
        'PUBLIC_PROFILE_REQUIRED',
      );
      expect(d.groupsRepo.create).not.toHaveBeenCalled();
    });

    it('sin nombre visible tampoco', async () => {
      const d = build();
      d.publicProfilesRepo.findById.mockResolvedValue({
        id: 'owner-profile',
        displayName: '   ',
        avatarFileId: 'file-1',
        visibilityConceptId: COMM.PROFILE_VISIBILITY_PUBLIC,
      });

      await expect(
        d.service.createGroup(publico, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    /**
     * Un perfil privado presentando un grupo público es una contradicción: el
     * enlace del grupo lleva a una puerta cerrada.
     */
    it('con el perfil en privado tampoco', async () => {
      const d = build();
      d.publicProfilesRepo.findById.mockResolvedValue({
        id: 'owner-profile',
        displayName: 'Dra. Lucía Salas',
        avatarFileId: 'file-1',
        visibilityConceptId: COMM.GROUP_VISIBILITY_PRIVATE,
      });

      await expect(
        d.service.createGroup(publico, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    /**
     * `PUBLIC` es el valor por omisión: si la comprobación mirara sólo el valor
     * explícito, la regla se saltearía con sólo omitir el campo.
     */
    it('omitir la visibilidad crea un grupo público, y también se comprueba', async () => {
      const d = build();
      d.publicProfilesRepo.findById.mockResolvedValue({
        id: 'owner-profile',
        displayName: 'Dra. Lucía Salas',
        avatarFileId: undefined,
        visibilityConceptId: COMM.PROFILE_VISIBILITY_PUBLIC,
      });

      await expect(
        d.service.createGroup({ slug: 'x', name: 'X' } as any, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    /** Un grupo privado no se le muestra a desconocidos: no aplica la regla. */
    it('un grupo privado no exige el perfil completo', async () => {
      const d = build();
      d.groupsRepo.create.mockReturnValue({ id: 'grp-1' });
      d.publicProfilesRepo.findById.mockResolvedValue({
        id: 'owner-profile',
        displayName: undefined,
        avatarFileId: undefined,
        visibilityConceptId: COMM.GROUP_VISIBILITY_PRIVATE,
      });

      await d.service.createGroup(
        { slug: 'x', name: 'X', visibility: 'PRIVATE' } as any,
        actor,
      );

      expect(d.groupsRepo.create).toHaveBeenCalled();
    });
  });

  /**
   * Regla 08 — sin nadie adentro no hay grupo.
   */
  describe('leaveGroup · disolución y sucesión (TP-3, regla 08)', () => {
    /** El grupo y la membresía que se va, montados para cada caso. */
    function conGrupo(
      d: ReturnType<typeof build>,
      opciones: { rolDelQueSale: string; quedan: number },
    ): any {
      const group = {
        id: 'grp-1',
        memberCount: opciones.quedan + 1,
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        ownerProfileId: 'owner-profile',
      };
      d.access.resolve.mockResolvedValue({
        group,
        actorProfileId: 'owner-profile',
      });
      d.groupsRepo.findByIdForUpdate.mockResolvedValue(group);
      d.groupsRepo.findMember.mockResolvedValue({
        id: 'gm-1',
        groupId: 'grp-1',
        memberProfileId: 'owner-profile',
        memberRoleConceptId: opciones.rolDelQueSale,
        joinStatusConceptId: COMM.GROUP_JOIN_ACTIVE,
      });
      d.groupsRepo.countMembersByStatus.mockResolvedValue(opciones.quedan);
      return group;
    }

    it('el último que sale disuelve el grupo', async () => {
      const d = build();
      const group = conGrupo(d, {
        rolDelQueSale: COMM.GROUP_ROLE_OWNER,
        quedan: 0,
      });

      await d.service.leaveGroup('grp-1', 'owner-profile', actor);

      expect(group.statusConceptId).toBe(GRUPO_DISUELTO);
      expect(group.memberCount).toBe(0);
    });

    /**
     * Antes esto ni siquiera podía pasar: el dueño tenía prohibido irse «hasta
     * transferirlo», lo que en la práctica lo dejaba atado a un grupo del que
     * quería salir.
     */
    /**
     * «Irse» y «que te echen» no son lo mismo.
     *
     * TP-3 dejó que el dueño se fuera y que alguien heredara. Sin esta guarda,
     * un administrador expulsaba al dueño y la sucesión lo dejaba a él a cargo:
     * cualquier admin se apoderaba del grupo con una sola llamada.
     */
    it('un administrador NO puede expulsar al dueño y quedarse con el grupo', async () => {
      const d = build();
      const group = conGrupo(d, {
        rolDelQueSale: COMM.GROUP_ROLE_OWNER,
        quedan: 2,
      });
      // Quien pide la baja es otro: un administrador, no el dueño.
      d.access.resolve.mockResolvedValue({
        group,
        actorProfileId: 'perfil-admin',
      });

      await expect(
        d.service.leaveGroup('grp-1', 'owner-profile', actor),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(group.ownerProfileId).toBe('owner-profile');
      expect(d.groupsRepo.listActiveMembersByAge).not.toHaveBeenCalled();
    });

    it('si el dueño sale y queda gente, alguien hereda el grupo', async () => {
      const d = build();
      const group = conGrupo(d, {
        rolDelQueSale: COMM.GROUP_ROLE_OWNER,
        quedan: 2,
      });
      const heredero = {
        id: 'gm-2',
        memberProfileId: 'perfil-2',
        memberRoleConceptId: COMM.GROUP_ROLE_ADMIN,
      };
      d.groupsRepo.listActiveMembersByAge.mockResolvedValue([
        {
          id: 'gm-3',
          memberProfileId: 'perfil-3',
          memberRoleConceptId: COMM.GROUP_ROLE_MEMBER,
        },
        heredero,
      ]);

      await d.service.leaveGroup('grp-1', 'owner-profile', actor);

      // Gana el administrador aunque sea más nuevo: la sucesión es una
      // continuidad, no un ascenso sorpresa para quien sólo participaba.
      expect(heredero.memberRoleConceptId).toBe(COMM.GROUP_ROLE_OWNER);
      expect(group.ownerProfileId).toBe('perfil-2');
      expect(group.statusConceptId).toBe(CONCEPTS.STATE_ACTIVE);
    });

    it('sin administradores hereda el integrante más antiguo', async () => {
      const d = build();
      conGrupo(d, { rolDelQueSale: COMM.GROUP_ROLE_OWNER, quedan: 1 });
      const masAntiguo = {
        id: 'gm-3',
        memberProfileId: 'perfil-3',
        memberRoleConceptId: COMM.GROUP_ROLE_MEMBER,
      };
      d.groupsRepo.listActiveMembersByAge.mockResolvedValue([masAntiguo]);

      await d.service.leaveGroup('grp-1', 'owner-profile', actor);

      expect(masAntiguo.memberRoleConceptId).toBe(COMM.GROUP_ROLE_OWNER);
    });

    it('si sale alguien que no es el dueño, el dueño no cambia', async () => {
      const d = build();
      const group = conGrupo(d, {
        rolDelQueSale: COMM.GROUP_ROLE_MEMBER,
        quedan: 3,
      });

      await d.service.leaveGroup('grp-1', 'owner-profile', actor);

      expect(d.groupsRepo.listActiveMembersByAge).not.toHaveBeenCalled();
      expect(group.ownerProfileId).toBe('owner-profile');
      expect(group.memberCount).toBe(3);
    });

    /**
     * El candado es lo que hace que dos salidas simultáneas no lean las dos
     * «quedaba uno» y decidan las dos que el grupo sigue vivo.
     */
    it('toma el grupo con candado antes de contar', async () => {
      const d = build();
      conGrupo(d, { rolDelQueSale: COMM.GROUP_ROLE_MEMBER, quedan: 1 });

      await d.service.leaveGroup('grp-1', 'owner-profile', actor);

      expect(d.groupsRepo.findByIdForUpdate).toHaveBeenCalledWith(
        d.tx,
        'grp-1',
      );
    });

    /**
     * El recuento sale de la base, no de restarle uno a la fila. Un contador
     * decrementado a ciegas termina en negativo o en «uno de más» apenas dos
     * salidas se cruzan, y es el número del que depende disolver el grupo.
     */
    it('el recuento se recalcula contra la base, no restando', async () => {
      const d = build();
      const group = conGrupo(d, {
        rolDelQueSale: COMM.GROUP_ROLE_MEMBER,
        quedan: 7,
      });
      group.memberCount = 99;

      await d.service.leaveGroup('grp-1', 'owner-profile', actor);

      expect(group.memberCount).toBe(7);
    });
  });
});
