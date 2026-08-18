import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { CommunityGroupsController } from './community-groups.controller';
import { COMM } from '../community.concepts';

const actor = { id: 'u1', roles: [] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const service = {
    createGroup: mockFn(),
    joinGroup: mockFn(),
    leaveGroup: mockFn(),
    updateMember: mockFn(),
  };
  const readService = {
    listGroups: mockFn(),
    listMembers: mockFn(),
    getGroup: mockFn(),
    listTopics: mockFn(),
  };
  const wallService = { createPost: mockFn(), listWall: mockFn() };
  return {
    controller: new CommunityGroupsController(
      service as any,
      readService as any,
      wallService as any,
    ),
    service,
    readService,
    wallService,
  };
}

describe('CommunityGroupsController', () => {
  it('delegates createGroup', async () => {
    const d = build();
    const dto = { slug: 's', name: 'N' };
    await d.controller.createGroup(dto, actor);
    expect(d.service.createGroup).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates joinGroup (UC-19-13)', async () => {
    const d = build();
    const dto = { memberProfileId: 'p1' };
    await d.controller.joinGroup('g1', dto, actor);
    expect(d.service.joinGroup).toHaveBeenCalledWith('g1', dto, actor);
  });

  it('delegates getGroup (P7)', async () => {
    const d = build();
    await d.controller.getGroup('g1', actor, 'p1');
    expect(d.readService.getGroup).toHaveBeenCalledWith('g1', actor, 'p1');
  });

  it('delegates leaveGroup (P7)', async () => {
    const d = build();
    await d.controller.leaveGroup('g1', 'p1', actor);
    expect(d.service.leaveGroup).toHaveBeenCalledWith('g1', 'p1', actor);
  });

  it('delegates updateMember (P7)', async () => {
    const d = build();
    const dto = { decision: 'APPROVE' } as any;
    await d.controller.updateMember('g1', 'm1', dto, actor);
    expect(d.service.updateMember).toHaveBeenCalledWith('g1', 'm1', dto, actor);
  });

  it('delegates the group wall (P7)', async () => {
    const d = build();
    const dto = { authorProfileId: 'p1', bodyText: 'hola' } as any;
    await d.controller.createGroupPost('g1', dto, actor);
    expect(d.wallService.createPost).toHaveBeenCalledWith('g1', dto, actor);

    await d.controller.listWall('g1', actor, 'p1', undefined, undefined);
    expect(d.wallService.listWall).toHaveBeenCalledWith('g1', actor, {
      actorProfileId: 'p1',
      cursor: undefined,
      limit: 50,
    });
  });

  it('translates the membership status code into its concept (P7)', async () => {
    const d = build();
    await d.controller.listMembers('g1', actor, 'p1', 'PENDING');
    expect(d.readService.listMembers).toHaveBeenCalledWith(
      'g1',
      actor,
      'p1',
      expect.objectContaining({ joinStatusConceptId: COMM.GROUP_JOIN_PENDING }),
    );
  });
});
