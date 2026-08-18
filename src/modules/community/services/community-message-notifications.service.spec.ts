import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { CommunityMessageNotificationsService } from './community-message-notifications.service';

const CONVERSACION = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
const REMITENTE = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const DESTINATARIO = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const CUENTA = 'dddddddd-dddd-dddd-dddd-dddddddddddd';

/**
 * Construye el servicio con sus dependencias dobladas.
 *
 * @returns El sistema bajo prueba y sus dobles.
 */
function build() {
  const em: any = {};
  em.fork = mockFn(() => em);
  const notifications = {
    emitInApp: mockFn(() => Promise.resolve({ suppressed: false })),
  };
  const profilesRepo = {
    findById: mockFn((_em: any, id: string) =>
      Promise.resolve(
        id === REMITENTE
          ? { id, displayName: 'Dra. Marisol Quispe', targetId: 'persona-a' }
          : { id, displayName: 'Juan Paciente', targetId: 'persona-b' },
      ),
    ),
  };
  const accountLinks = {
    findActiveByPerson: mockFn(() => Promise.resolve({ userId: CUENTA })),
  };
  const logger = {
    setContext: mockFn(),
    info: mockFn(),
    warn: mockFn(),
    error: mockFn(),
  };
  const service = new CommunityMessageNotificationsService(
    em,
    notifications as any,
    profilesRepo as any,
    accountLinks as any,
    logger as any,
  );
  return { service, notifications, profilesRepo, accountLinks, logger };
}

describe('CommunityMessageNotificationsService · enganche P2 → P1', () => {
  it('avisa al destinatario con el nombre de quien escribe y el hilo como destino', async () => {
    const d = build();

    await d.service.mensajeNuevo(
      CONVERSACION,
      REMITENTE,
      [DESTINATARIO],
      'user-1',
    );

    const [input] = d.notifications.emitInApp.mock.calls[0] as any[];
    expect(input.recipientUserId).toBe(CUENTA);
    expect(input.category).toBe('MESSAGES');
    // El nombre es lo que hace útil el aviso: «Mensaje nuevo» a secas obliga a
    // abrir el hilo para saber si vale la pena.
    expect(input.subject).toBe('Dra. Marisol Quispe te escribió');
    expect(input.destination).toEqual({
      type: 'CONVERSATION',
      id: CONVERSACION,
    });
  });

  it('la clave de rebote incluye al destinatario, para no taparle el aviso a otro', async () => {
    const d = build();

    await d.service.mensajeNuevo(
      CONVERSACION,
      REMITENTE,
      [DESTINATARIO],
      'user-1',
    );

    const [input] = d.notifications.emitInApp.mock.calls[0] as any[];
    expect(input.debounceKey).toBe(`conversation:${CONVERSACION}:${CUENTA}`);
  });

  it('cae en `created_by_user_id` cuando el perfil no se resuelve por persona', async () => {
    const d = build();
    d.accountLinks.findActiveByPerson.mockResolvedValue(null);
    d.profilesRepo.findById.mockResolvedValue({
      id: DESTINATARIO,
      displayName: 'Quien sea',
      targetId: 'persona-b',
      createdByUserId: 'cuenta-creadora',
    });

    await d.service.mensajeNuevo(
      CONVERSACION,
      REMITENTE,
      [DESTINATARIO],
      'user-1',
    );

    const [input] = d.notifications.emitInApp.mock.calls[0] as any[];
    expect(input.recipientUserId).toBe('cuenta-creadora');
  });

  it('no avisa —ni falla— a un perfil que ninguna cuenta encarna', async () => {
    const d = build();
    d.accountLinks.findActiveByPerson.mockResolvedValue(null);
    d.profilesRepo.findById.mockResolvedValue({
      id: DESTINATARIO,
      displayName: 'Clínica San Juan',
      targetId: 'organizacion-1',
    });

    await d.service.mensajeNuevo(
      CONVERSACION,
      REMITENTE,
      [DESTINATARIO],
      'user-1',
    );

    // Un perfil público de organización que nadie encarna sigue recibiendo el
    // mensaje: lo verá al abrir su bandeja. No hay a quién sonarle la campana.
    expect(d.notifications.emitInApp).not.toHaveBeenCalled();
    expect(d.logger.error).not.toHaveBeenCalled();
  });

  it('se traga cualquier fallo: el mensaje ya está guardado', async () => {
    const d = build();
    d.profilesRepo.findById.mockRejectedValue(new Error('boom'));

    await expect(
      d.service.mensajeNuevo(CONVERSACION, REMITENTE, [DESTINATARIO], 'user-1'),
    ).resolves.toBeUndefined();
    expect(d.logger.error).toHaveBeenCalled();
  });
});
