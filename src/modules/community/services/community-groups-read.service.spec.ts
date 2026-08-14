import { jest } from '@jest/globals';

// Loose-typed mock factory: runtime 'jest' pero sin los tipos estrictos Mock<never>.
/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { CommunityGroupsReadService } from './community-groups-read.service';
import { CommunityPollsReadService } from './community-polls-read.service';
import { ResourceNotFoundException } from '../../../common';
import { COMM } from '../community.concepts';

const actor = { id: 'user-1', roles: ['USER'] } as any;

/**
 * Construye el servicio de grupos con dependencias controladas.
 * @returns Resultado de build.
 */
function buildGroups() {
  const em = { fork: mockFn(() => ({})) };
  const groupsRepo = {
    searchPage: mockFn().mockResolvedValue([]),
    listMembers: mockFn().mockResolvedValue([]),
    findById: mockFn(),
    findMember: mockFn().mockResolvedValue(null),
  };
  const visibility = {
    resolveActorProfileId: mockFn((_em: any, _actor: any, pedido?: string) =>
      Promise.resolve(pedido),
    ),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new CommunityGroupsReadService(
    em as any,
    groupsRepo as any,
    visibility as any,
    logger as any,
  );
  return { service, groupsRepo, visibility };
}

/**
 * Construye el servicio de encuestas con dependencias controladas.
 * @returns Resultado de build.
 */
function buildPolls() {
  const em = { fork: mockFn(() => ({})) };
  const pollsRepo = {
    findPollById: mockFn(),
    listOptions: mockFn().mockResolvedValue([]),
    countVotesByOption: mockFn().mockResolvedValue([]),
    listVotedOptionIds: mockFn().mockResolvedValue([]),
  };
  const postsRepo = { findById: mockFn().mockResolvedValue({ id: 'post-1' }) };
  const visibility = {
    canViewPost: mockFn().mockResolvedValue(true),
    resolveActorProfileId: mockFn((_em: any, _actor: any, pedido?: string) =>
      Promise.resolve(pedido),
    ),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new CommunityPollsReadService(
    em as any,
    pollsRepo as any,
    postsRepo as any,
    visibility as any,
    logger as any,
  );
  return { service, pollsRepo, postsRepo, visibility };
}

describe('CommunityGroupsReadService', () => {
  it('excluye los grupos secretos del directorio', async () => {
    const d = buildGroups();
    await d.service.listGroups('t-1', { limit: 10 });

    expect(d.groupsRepo.searchPage).toHaveBeenCalledWith(
      expect.anything(),
      't-1',
      COMM.GROUP_VISIBILITY_SECRET,
      undefined,
      11,
    );
  });

  it('404 si el grupo no existe', async () => {
    const d = buildGroups();
    d.groupsRepo.findById.mockResolvedValue(null);
    await expect(
      d.service.listMembers('g-x', actor, undefined, { limit: 10 }),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });

  it('un grupo secreto no revela su padrón a quien no es integrante', async () => {
    const d = buildGroups();
    d.groupsRepo.findById.mockResolvedValue({
      id: 'g-1',
      visibilityConceptId: COMM.GROUP_VISIBILITY_SECRET,
    });

    await expect(
      d.service.listMembers('g-1', actor, 'p-ajeno', { limit: 10 }),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });

  it('un integrante activo sí ve el padrón del grupo secreto', async () => {
    const d = buildGroups();
    d.groupsRepo.findById.mockResolvedValue({
      id: 'g-1',
      visibilityConceptId: COMM.GROUP_VISIBILITY_SECRET,
    });
    d.groupsRepo.findMember.mockResolvedValue({
      joinStatusConceptId: COMM.GROUP_JOIN_ACTIVE,
    });
    d.groupsRepo.listMembers.mockResolvedValue([
      {
        id: 'gm-1',
        memberProfileId: 'p-1',
        memberRoleConceptId: 'rol',
        joinStatusConceptId: COMM.GROUP_JOIN_ACTIVE,
      },
    ]);

    const res = await d.service.listMembers('g-1', actor, 'p-1', { limit: 10 });

    expect(res.items).toHaveLength(1);
  });

  it('una membresía pendiente no alcanza para ver el grupo secreto', async () => {
    const d = buildGroups();
    d.groupsRepo.findById.mockResolvedValue({
      id: 'g-1',
      visibilityConceptId: COMM.GROUP_VISIBILITY_SECRET,
    });
    d.groupsRepo.findMember.mockResolvedValue({
      joinStatusConceptId: COMM.GROUP_JOIN_PENDING,
    });

    await expect(
      d.service.listMembers('g-1', actor, 'p-1', { limit: 10 }),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });
});

describe('CommunityPollsReadService', () => {
  const poll = {
    id: 'poll-1',
    postId: 'post-1',
    question: '¿Cuál preferís?',
    allowsMultiple: true,
    statusConceptId: 'abierta',
  };

  it('404 si la publicación que la contiene no es visible', async () => {
    const d = buildPolls();
    d.pollsRepo.findPollById.mockResolvedValue(poll);
    d.visibility.canViewPost.mockResolvedValue(false);

    await expect(d.service.getPoll('poll-1', actor, 'p-9')).rejects.toBeInstanceOf(
      ResourceNotFoundException,
    );
  });

  it('usa el recuento real de votos y no el contador denormalizado', async () => {
    const d = buildPolls();
    d.pollsRepo.findPollById.mockResolvedValue(poll);
    d.pollsRepo.listOptions.mockResolvedValue([
      { id: 'o-1', label: 'A', voteCount: '999' },
      { id: 'o-2', label: 'B', voteCount: '999' },
    ]);
    d.pollsRepo.countVotesByOption.mockResolvedValue([
      { pollOptionId: 'o-1', count: 2 },
    ]);

    const res = await d.service.getPoll('poll-1', actor);

    expect(res.options[0].voteCount).toBe(2);
    expect(res.options[1].voteCount).toBe(0);
    expect(res.totalVotes).toBe(2);
  });

  it('marca todas las opciones que votó el actor', async () => {
    const d = buildPolls();
    d.pollsRepo.findPollById.mockResolvedValue(poll);
    d.pollsRepo.listVotedOptionIds.mockResolvedValue(['o-1', 'o-2']);

    const res = await d.service.getPoll('poll-1', actor, 'p-1');

    expect(res.actorVotedOptionIds).toEqual(['o-1', 'o-2']);
  });

  it('sin actor no informa voto propio', async () => {
    const d = buildPolls();
    d.pollsRepo.findPollById.mockResolvedValue(poll);

    const res = await d.service.getPoll('poll-1', actor);

    expect(res.actorVotedOptionIds).toBeUndefined();
    expect(d.pollsRepo.listVotedOptionIds).not.toHaveBeenCalled();
  });
});
