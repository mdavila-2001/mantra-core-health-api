import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { CommunityGroupNotificationsService } from './community-group-notifications.service';
import { CONCEPTS } from '../../../common';
import { COMM } from '../community.concepts';

const actor = { id: 'user-1', roles: ['USER'] } as any;
const group = { id: 'g1', name: 'Cardiología', tenantId: 't1' } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 *
 * @returns Resultado de build.
 */
function build() {
  const em = { fork: mockFn(() => ({})) };
  const notifications = {
    createRequest: mockFn().mockResolvedValue({ id: 'n1' }),
  };
  const groupsRepo = {
    listActiveMemberProfileIds: mockFn().mockResolvedValue([]),
  };
  const profilesRepo = { listByIds: mockFn().mockResolvedValue([]) };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new CommunityGroupNotificationsService(
    em as any,
    notifications as any,
    groupsRepo as any,
    profilesRepo as any,
    logger as any,
  );
  return { service, notifications, groupsRepo, profilesRepo, logger };
}

/** Un perfil público de cuenta, cuyo `targetId` es el usuario. */
function userProfile(id: string, targetId: string) {
  return {
    id,
    targetTypeConceptId: COMM.PROFILE_TARGET_USER,
    targetId,
    createdByUserId: undefined,
  };
}

describe('CommunityGroupNotificationsService (P7 sobre P1)', () => {
  describe('notifyJoinApproved', () => {
    it('avisa al aceptado por el canal in-app', async () => {
      const d = build();
      d.profilesRepo.listByIds.mockResolvedValue([userProfile('p1', 'u-p1')]);

      await d.service.notifyJoinApproved(group, 'p1', actor);

      expect(d.notifications.createRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          recipientUserId: 'u-p1',
          categoryConceptId: CONCEPTS.NOTIF_CAT_GROUP_JOIN_APPROVED,
          relatedResourceType: 'community.groups',
          relatedResourceId: 'g1',
        }),
        actor,
      );
    });

    it('no avisa a un perfil que no resuelve a ninguna cuenta', async () => {
      const d = build();
      d.profilesRepo.listByIds.mockResolvedValue([
        {
          id: 'p1',
          targetTypeConceptId: COMM.PROFILE_TARGET_ORGANIZATION,
          targetId: 'org-1',
          createdByUserId: undefined,
        },
      ]);

      await d.service.notifyJoinApproved(group, 'p1', actor);

      expect(d.notifications.createRequest).not.toHaveBeenCalled();
    });

    it('un canal caído no propaga el error a quien ya entró al grupo', async () => {
      const d = build();
      d.profilesRepo.listByIds.mockResolvedValue([userProfile('p1', 'u-p1')]);
      d.notifications.createRequest.mockRejectedValue(new Error('canal caído'));

      await expect(
        d.service.notifyJoinApproved(group, 'p1', actor),
      ).resolves.toBeUndefined();
      expect(d.logger.warn).toHaveBeenCalled();
    });
  });

  describe('notifyNewPost', () => {
    it('avisa a los integrantes y deja fuera al autor', async () => {
      const d = build();
      d.groupsRepo.listActiveMemberProfileIds.mockResolvedValue([
        'p-autor',
        'p2',
        'p3',
      ]);
      d.profilesRepo.listByIds.mockResolvedValue([
        userProfile('p2', 'u2'),
        userProfile('p3', 'u3'),
      ]);

      await d.service.notifyNewPost(group, 'p-autor', actor);

      expect(d.profilesRepo.listByIds).toHaveBeenCalledWith(expect.anything(), [
        'p2',
        'p3',
      ]);
      expect(d.notifications.createRequest).toHaveBeenCalledTimes(2);
      const recipients = d.notifications.createRequest.mock.calls.map(
        (call: any[]) => call[0].recipientUserId,
      );
      expect(recipients).toEqual(['u2', 'u3']);
    });

    it('no llama al canal cuando el autor está solo en el grupo', async () => {
      const d = build();
      d.groupsRepo.listActiveMemberProfileIds.mockResolvedValue(['p-autor']);

      await d.service.notifyNewPost(group, 'p-autor', actor);

      expect(d.notifications.createRequest).not.toHaveBeenCalled();
    });

    it('la clave de debounce distingue destinatario y categoría', async () => {
      const d = build();
      d.groupsRepo.listActiveMemberProfileIds.mockResolvedValue(['p2']);
      d.profilesRepo.listByIds.mockResolvedValue([userProfile('p2', 'u2')]);

      await d.service.notifyNewPost(group, 'p-autor', actor);

      const [request] = d.notifications.createRequest.mock.calls[0];
      expect(request.debounceKey).toBe(
        `community.groups:g1:u2:${CONCEPTS.NOTIF_CAT_GROUP_NEW_POST}`,
      );
    });
  });
});
