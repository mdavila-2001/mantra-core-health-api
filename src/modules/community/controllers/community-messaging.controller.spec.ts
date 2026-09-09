import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { CommunityMessagingController } from './community-messaging.controller';

const actor = { id: 'u1', roles: [] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const service = {
    createConversation: mockFn(),
    sendMessage: mockFn(),
    markRead: mockFn(),
    updateParticipant: mockFn(),
    editMessage: mockFn(),
    deleteMessage: mockFn(),
    pinMessage: mockFn(),
    unpinMessage: mockFn(),
  };
  const readService = {
    listConversations: mockFn(),
    listMessages: mockFn(),
    conversationPresence: mockFn(),
  };
  return {
    controller: new CommunityMessagingController(
      service as any,
      readService as any,
    ),
    service,
    readService,
  };
}

describe('CommunityMessagingController', () => {
  it('delegates createConversation', async () => {
    const d = build();
    const dto = { participantProfileIds: ['a', 'b'] };
    await d.controller.createConversation(dto, actor);
    expect(d.service.createConversation).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates sendMessage (UC-19-06)', async () => {
    const d = build();
    const dto = { senderProfileId: 'p1', bodyText: 'hi' };
    await d.controller.sendMessage('conv1', dto, actor);
    expect(d.service.sendMessage).toHaveBeenCalledWith('conv1', dto, actor);
  });

  it('delegates markRead (UC-19-07)', async () => {
    const d = build();
    const dto = { recipientProfileId: 'p1' };
    await d.controller.markRead('conv1', dto, actor);
    expect(d.service.markRead).toHaveBeenCalledWith('conv1', dto, actor);
  });

  /* --- F4 ---------------------------------------------------------------- */

  it('la bandeja pasa limit, cursor y q al servicio (F4.3)', async () => {
    const d = build();
    await d.controller.listConversations('p1', actor, 20, 'cur', 'peña');
    expect(d.readService.listConversations).toHaveBeenCalledWith('p1', actor, {
      limit: 20,
      cursor: 'cur',
      q: 'peña',
    });
  });

  it('sin limit usa el tope por defecto', async () => {
    const d = build();
    await d.controller.listConversations('p1', actor);
    expect(d.readService.listConversations).toHaveBeenCalledWith('p1', actor, {
      limit: 50,
      cursor: undefined,
      q: undefined,
    });
  });

  it('delegates updateParticipant (F4.4)', async () => {
    const d = build();
    const dto = { profileId: 'p1', isFavorite: true };
    await d.controller.updateParticipant('conv1', dto, actor);
    expect(d.service.updateParticipant).toHaveBeenCalledWith(
      'conv1',
      dto,
      actor,
    );
  });

  it('delegates editMessage y deleteMessage (F4.5)', async () => {
    const d = build();
    const dto = { senderProfileId: 'p1', bodyText: 'otra cosa' };
    await d.controller.editMessage('conv1', 'm1', dto, actor);
    expect(d.service.editMessage).toHaveBeenCalledWith(
      'conv1',
      'm1',
      dto,
      actor,
    );

    await d.controller.deleteMessage('conv1', 'm1', 'p1', actor);
    expect(d.service.deleteMessage).toHaveBeenCalledWith(
      'conv1',
      'm1',
      'p1',
      actor,
    );
  });

  it('delegates pinMessage y unpinMessage (F4.6)', async () => {
    const d = build();
    const dto = { profileId: 'p1', messageId: 'm1' };
    await d.controller.pinMessage('conv1', dto, actor);
    expect(d.service.pinMessage).toHaveBeenCalledWith('conv1', dto, actor);

    await d.controller.unpinMessage('conv1', 'p1', actor);
    expect(d.service.unpinMessage).toHaveBeenCalledWith('conv1', 'p1', actor);
  });

  it('delegates conversationPresence (F4.2)', async () => {
    const d = build();
    await d.controller.conversationPresence('conv1', 'p1', actor);
    expect(d.readService.conversationPresence).toHaveBeenCalledWith(
      'conv1',
      'p1',
      actor,
    );
  });
});
