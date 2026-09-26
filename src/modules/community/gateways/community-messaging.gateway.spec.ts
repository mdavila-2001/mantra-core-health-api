import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { CommunityMessagingGateway } from './community-messaging.gateway';

const user = { id: 'u1', roles: [] } as any;

/** Un socket doblado: salas, `data` y lo que emite a otros. */
function socket(rooms: string[] = [], profileIds: string[] = []) {
  const emitidoAOtros = mockFn();
  const client = {
    id: 's-1',
    rooms: new Set(rooms),
    data: { user, profileIds: new Set(profileIds) },
    join: mockFn(async (sala: string) => {
      client.rooms.add(sala);
    }),
    leave: mockFn(async (sala: string) => {
      client.rooms.delete(sala);
    }),
    emit: mockFn(),
    to: mockFn(() => ({ emit: emitidoAOtros })),
    disconnect: mockFn(),
  };
  return { client, emitidoAOtros };
}

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const serverEmit = mockFn();
  const rooms = new Map<string, Set<string>>();
  const server = {
    to: mockFn(() => ({ emit: serverEmit })),
    sockets: { adapter: { rooms } },
  };
  const em = { fork: mockFn(() => ({})) };
  const wsAuth = { authenticate: mockFn(() => user) };
  const conversationsRepo = {
    findActiveParticipant: mockFn().mockResolvedValue({ id: 'part' }),
    listActiveParticipationsOf: mockFn().mockResolvedValue([
      { conversationId: 'c-1' },
      { conversationId: 'c-2' },
    ]),
  };
  const visibility = {
    assertOwnProfile: mockFn().mockResolvedValue(undefined),
  };
  const presence = {
    marcarEnLinea: mockFn().mockResolvedValue(true),
    marcarDesconectado: mockFn().mockResolvedValue(
      new Date('2026-09-09T10:00:00Z'),
    ),
  };
  const logger = { setContext: mockFn(), warn: mockFn() };
  const gateway = new CommunityMessagingGateway(
    em as any,
    wsAuth as any,
    conversationsRepo as any,
    visibility as any,
    presence as any,
    logger as any,
  );
  // `@WebSocketServer()` lo inyecta Nest; acá se pone a mano.
  (gateway as any).server = server;
  return {
    gateway,
    server,
    serverEmit,
    rooms,
    conversationsRepo,
    presence,
    visibility,
    wsAuth,
  };
}

describe('CommunityMessagingGateway', () => {
  describe('el primer evento tras conectar (carrera con la autenticación)', () => {
    /** Un socket recién conectado: sin `user` todavía, con la autenticación en curso. */
    function socketSinAutenticar() {
      const { client } = socket();
      (client.data as { user?: unknown }).user = undefined;
      return client;
    }

    it('join:inbox emitido antes de que termine la autenticación no se pierde', async () => {
      const d = build();
      let resolver!: (u: unknown) => void;
      d.wsAuth.authenticate.mockReturnValue(
        new Promise((resolve) => {
          resolver = resolve;
        }),
      );
      const client = socketSinAutenticar();

      const conexion = d.gateway.handleConnection(client as any);
      // El cliente emite apenas recibe `connect`: la verificación de la sesión
      // (que va a la base) todavía no volvió.
      const union = d.gateway.handleJoinInbox(client as any, {
        profileId: 'p-1',
      });
      resolver(user);
      await conexion;
      await union;

      expect(client.join).toHaveBeenCalledWith('profile:p-1');
      expect(client.emit).not.toHaveBeenCalledWith('error', expect.anything());
    });

    it('join:conversation esperando la autenticación responde el error de siempre si el perfil es ajeno', async () => {
      const d = build();
      d.visibility.assertOwnProfile.mockRejectedValue(new Error('ajeno'));
      let resolver!: (u: unknown) => void;
      d.wsAuth.authenticate.mockReturnValue(
        new Promise((resolve) => {
          resolver = resolve;
        }),
      );
      const client = socketSinAutenticar();

      const conexion = d.gateway.handleConnection(client as any);
      const union = d.gateway.handleJoinConversation(client as any, {
        conversationId: 'c-1',
        profileId: 'p-ajeno',
      });
      resolver(user);
      await conexion;
      await union;

      expect(client.emit).toHaveBeenCalledWith('error', {
        code: 'NOT_OWN_PROFILE',
        event: 'join:conversation',
      });
    });

    it('si la autenticación falla, el socket se corta y el evento no une a nada', async () => {
      const d = build();
      d.wsAuth.authenticate.mockRejectedValue(new Error('token inválido'));
      const client = socketSinAutenticar();

      const conexion = d.gateway.handleConnection(client as any);
      const union = d.gateway.handleJoinInbox(client as any, {
        profileId: 'p-1',
      });
      await conexion;
      await union;

      expect(client.disconnect).toHaveBeenCalledWith(true);
      expect(client.join).not.toHaveBeenCalled();
    });
  });

  describe('typing (F4.1)', () => {
    it('reemite «escribiendo» a los demás del hilo, sin tocar la base', () => {
      const d = build();
      const { client, emitidoAOtros } = socket(['conversation:c-1'], ['p-1']);

      d.gateway.handleTyping(client as any, {
        conversationId: 'c-1',
        profileId: 'p-1',
        typing: true,
      });

      expect(client.to).toHaveBeenCalledWith('conversation:c-1');
      expect(emitidoAOtros).toHaveBeenCalledWith('conversation:typing', {
        conversationId: 'c-1',
        profileId: 'p-1',
        typing: true,
      });
      expect(d.conversationsRepo.findActiveParticipant).not.toHaveBeenCalled();
    });

    it('ignora a quien no se unió al hilo o dice ser otro perfil', () => {
      const d = build();
      const noUnido = socket([], ['p-1']);
      d.gateway.handleTyping(noUnido.client as any, {
        conversationId: 'c-1',
        profileId: 'p-1',
      });
      expect(noUnido.emitidoAOtros).not.toHaveBeenCalled();

      const otroPerfil = socket(['conversation:c-1'], ['p-1']);
      d.gateway.handleTyping(otroPerfil.client as any, {
        conversationId: 'c-1',
        profileId: 'p-ajeno',
      });
      expect(otroPerfil.emitidoAOtros).not.toHaveBeenCalled();
    });

    it('salir del hilo avisa que dejó de escribir', async () => {
      const d = build();
      const { client, emitidoAOtros } = socket(['conversation:c-1'], ['p-1']);

      await d.gateway.handleLeaveConversation(client as any, {
        conversationId: 'c-1',
        profileId: 'p-1',
      });

      expect(client.leave).toHaveBeenCalledWith('conversation:c-1');
      expect(emitidoAOtros).toHaveBeenCalledWith('conversation:typing', {
        conversationId: 'c-1',
        profileId: 'p-1',
        typing: false,
      });
    });
  });

  describe('presencia (F4.2)', () => {
    it('entrar a la bandeja marca en línea y lo avisa a los hilos del perfil', async () => {
      const d = build();
      const { client } = socket();

      await d.gateway.handleJoinInbox(client as any, { profileId: 'p-1' });

      expect(client.join).toHaveBeenCalledWith('profile:p-1');
      expect(d.presence.marcarEnLinea).toHaveBeenCalledWith('p-1');
      expect(d.server.to).toHaveBeenCalledWith([
        'conversation:c-1',
        'conversation:c-2',
      ]);
      expect(d.serverEmit).toHaveBeenCalledWith('profile:presence', {
        profileId: 'p-1',
        online: true,
        lastSeenAt: expect.any(Date),
      });
    });

    it('renovar una presencia que ya existía no avisa nada', async () => {
      const d = build();
      d.presence.marcarEnLinea.mockResolvedValue(false);
      const { client } = socket();

      await d.gateway.handleJoinInbox(client as any, { profileId: 'p-1' });

      expect(d.serverEmit).not.toHaveBeenCalled();
    });

    it('un perfil ajeno no entra a la bandeja ni marca presencia', async () => {
      const d = build();
      d.visibility.assertOwnProfile.mockRejectedValue(new Error('no'));
      const { client } = socket();

      await d.gateway.handleJoinInbox(client as any, { profileId: 'p-ajeno' });

      expect(client.emit).toHaveBeenCalledWith('error', {
        code: 'NOT_OWN_PROFILE',
        event: 'join:inbox',
      });
      expect(d.presence.marcarEnLinea).not.toHaveBeenCalled();
    });

    it('desconectar el último socket del perfil lo deja fuera de línea y avisa', async () => {
      const d = build();
      const { client } = socket([], ['p-1']);

      await d.gateway.handleDisconnect(client as any);

      expect(d.presence.marcarDesconectado).toHaveBeenCalledWith('p-1');
      expect(d.serverEmit).toHaveBeenCalledWith('profile:presence', {
        profileId: 'p-1',
        online: false,
        lastSeenAt: new Date('2026-09-09T10:00:00Z'),
      });
    });

    it('con otra pestaña abierta, cerrar una no apaga la presencia', async () => {
      const d = build();
      d.rooms.set('profile:p-1', new Set(['s-otro']));
      const { client } = socket([], ['p-1']);

      await d.gateway.handleDisconnect(client as any);

      expect(d.presence.marcarDesconectado).not.toHaveBeenCalled();
      expect(d.serverEmit).not.toHaveBeenCalled();
    });

    it('el ping renueva; si había caducado, vuelve a avisar', async () => {
      const d = build();
      d.presence.marcarEnLinea.mockResolvedValueOnce(true);
      const { client } = socket([], ['p-1']);

      await d.gateway.handlePresencePing(client as any);

      expect(d.presence.marcarEnLinea).toHaveBeenCalledWith('p-1');
      expect(d.serverEmit).toHaveBeenCalledWith(
        'profile:presence',
        expect.objectContaining({ profileId: 'p-1', online: true }),
      );
    });
  });

  describe('empujes tras el commit (F4.5 / F4.6)', () => {
    it('editar, borrar y fijar van al hilo y a la bandeja de cada destinatario', () => {
      const d = build();
      const mensaje = {
        id: 'm-1',
        conversationId: 'c-1',
        senderProfileId: 'p-1',
        contentTypeConceptId: 'ct',
      };

      d.gateway.emitMessageUpdated(mensaje, ['p-2']);
      d.gateway.emitMessageDeleted(
        { conversationId: 'c-1', messageId: 'm-1', deletedAt: new Date() },
        ['p-2'],
      );
      d.gateway.emitPinned({ conversationId: 'c-1', pinnedMessageId: 'm-1' }, [
        'p-2',
      ]);

      expect(d.server.to).toHaveBeenCalledWith([
        'conversation:c-1',
        'profile:p-2',
      ]);
      expect(
        d.serverEmit.mock.calls.map((llamada: unknown[]) => llamada[0]),
      ).toEqual([
        'conversation:message:updated',
        'conversation:message:deleted',
        'conversation:pinned',
      ]);
    });

    it('un fallo de socket.io no lanza hacia el servicio', () => {
      const d = build();
      d.server.to.mockImplementation(() => {
        throw new Error('adapter caído');
      });
      expect(() =>
        d.gateway.emitPinned(
          { conversationId: 'c-1', pinnedMessageId: null },
          [],
        ),
      ).not.toThrow();
    });
  });
});
