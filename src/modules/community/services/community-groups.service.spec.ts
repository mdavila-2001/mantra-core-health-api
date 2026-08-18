import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { CommunityGroupsService } from './community-groups.service';
import {
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
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new CommunityGroupsService(
    em as any,
    groupsRepo as any,
    access as any,
    visibility as any,
    logger as any,
  );
  return { service, tx, groupsRepo, access, visibility };
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
      const group: any = { memberCount: 3, updatedAt: new Date() };
      const member = {
        id: 'm1',
        memberRoleConceptId: COMM.GROUP_ROLE_MEMBER,
        joinStatusConceptId: COMM.GROUP_JOIN_ACTIVE,
        updatedAt: new Date(),
      };
      d.access.resolve.mockResolvedValue({ group, actorProfileId: 'p1' });
      d.groupsRepo.findMember.mockResolvedValue(member);

      const res = await d.service.leaveGroup('g1', 'p1', actor);

      expect(res.joinStatusConceptId).toBe(COMM.GROUP_JOIN_LEFT);
      expect(group.memberCount).toBe(2);
      // Nadie tuvo que administrar nada: se dio de baja a si mismo.
      expect(d.access.assertCanAdminister).not.toHaveBeenCalled();
    });

    it('marks an expulsion as REMOVED and demands administration', async () => {
      const d = build();
      const group: any = { memberCount: 3, updatedAt: new Date() };
      d.access.resolve.mockResolvedValue({ group, actorProfileId: 'admin' });
      d.groupsRepo.findMember.mockResolvedValue({
        id: 'm2',
        memberRoleConceptId: COMM.GROUP_ROLE_MEMBER,
        joinStatusConceptId: COMM.GROUP_JOIN_ACTIVE,
        updatedAt: new Date(),
      });

      const res = await d.service.leaveGroup('g1', 'p9', actor);

      expect(d.access.assertCanAdminister).toHaveBeenCalled();
      expect(res.joinStatusConceptId).toBe(COMM.GROUP_JOIN_REMOVED);
    });

    it('refuses to orphan the group by dropping its owner', async () => {
      const d = build();
      d.access.resolve.mockResolvedValue({
        group: { memberCount: 1, updatedAt: new Date() },
        actorProfileId: 'p1',
      });
      d.groupsRepo.findMember.mockResolvedValue({
        id: 'm1',
        memberRoleConceptId: COMM.GROUP_ROLE_OWNER,
        joinStatusConceptId: COMM.GROUP_JOIN_ACTIVE,
      });

      await expect(
        d.service.leaveGroup('g1', 'p1', actor),
      ).rejects.toBeInstanceOf(ConflictException);
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
});
