import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { CommunityGroupsService } from './community-groups.service';
import { ConflictException, ResourceNotFoundException } from '../../../common';
import { COMM } from '../community.concepts';

const actor = { id: 'u1', roles: [] } as any;

function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const groupsRepo = { create: mockFn(), findById: mockFn(), findMember: mockFn(), createMember: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new CommunityGroupsService(em as any, groupsRepo as any, logger as any);
  return { service, tx, groupsRepo };
}

describe('CommunityGroupsService', () => {
  it('creates a group (bootstrap)', async () => {
    const d = build();
    d.groupsRepo.create.mockReturnValue({ id: 'g1' });
    const res = await d.service.createGroup({ slug: 's', name: 'N' } as any, actor);
    expect(res).toEqual({ id: 'g1' });
  });

  describe('joinGroup (UC-19-13)', () => {
    it('throws when the group does not exist', async () => {
      const d = build();
      d.groupsRepo.findById.mockResolvedValue(null);
      await expect(d.service.joinGroup('missing', { memberProfileId: 'p1' } as any, actor)).rejects.toBeInstanceOf(
        ResourceNotFoundException,
      );
    });

    it('rejects duplicate membership', async () => {
      const d = build();
      d.groupsRepo.findById.mockResolvedValue({ id: 'g1', visibilityConceptId: COMM.GROUP_VISIBILITY_PUBLIC });
      d.groupsRepo.findMember.mockResolvedValue({ id: 'm0' });
      await expect(d.service.joinGroup('g1', { memberProfileId: 'p1' } as any, actor)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('activates membership and bumps count for public groups', async () => {
      const d = build();
      const group = { id: 'g1', visibilityConceptId: COMM.GROUP_VISIBILITY_PUBLIC, memberCount: 2, updatedAt: new Date() };
      d.groupsRepo.findById.mockResolvedValue(group);
      d.groupsRepo.findMember.mockResolvedValue(null);
      d.groupsRepo.createMember.mockReturnValue({ id: 'm1' });
      const res = await d.service.joinGroup('g1', { memberProfileId: 'p1' } as any, actor);
      expect(res).toEqual({ id: 'm1', joinStatus: COMM.GROUP_JOIN_ACTIVE });
      expect(group.memberCount).toBe(3);
    });

    it('leaves membership pending for private groups', async () => {
      const d = build();
      const group = { id: 'g1', visibilityConceptId: COMM.GROUP_VISIBILITY_PRIVATE, memberCount: 0, updatedAt: new Date() };
      d.groupsRepo.findById.mockResolvedValue(group);
      d.groupsRepo.findMember.mockResolvedValue(null);
      d.groupsRepo.createMember.mockReturnValue({ id: 'm2' });
      const res = await d.service.joinGroup('g1', { memberProfileId: 'p1' } as any, actor);
      expect(res.joinStatus).toBe(COMM.GROUP_JOIN_PENDING);
      expect(group.memberCount).toBe(0);
    });
  });
});
