import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { ClinicalNotificationsService } from './clinical-notifications.service';

const PACIENTE = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const CUENTA = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const MEDICO = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

/**
 * Construye el servicio con sus dependencias dobladas.
 *
 * @returns El sistema bajo prueba y sus dobles.
 */
function build() {
  const em: any = {};
  em.fork = mockFn(() => em);
  const notifications = {
    emitInApp: mockFn(() =>
      Promise.resolve({ suppressed: false, inAppNotificationId: 'in-app-1' }),
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
  const service = new ClinicalNotificationsService(
    em,
    notifications as any,
    accountLinks as any,
    logger as any,
  );
  return { service, notifications, accountLinks, logger };
}

describe('ClinicalNotificationsService · disparadores de P1', () => {
  it('avisa al paciente de su receta, en su categoría y con destino navegable', async () => {
    const d = build();

    await d.service.prescriptionIssued('rx-1', PACIENTE, MEDICO);

    const [input] = d.notifications.emitInApp.mock.calls[0] as any[];
    expect(input.recipientUserId).toBe(CUENTA);
    expect(input.category).toBe('CLINICAL');
    expect(input.destination).toEqual({ type: 'PRESCRIPTION', id: 'rx-1' });
    // Idempotente por hecho: reintentar la emisión no produce dos campanazos.
    expect(input.debounceKey).toBe('clinical:PRESCRIPTION:rx-1');
    expect(input.actorUserId).toBe(MEDICO);
  });

  it('avisa del cierre del encuentro apuntando al encuentro', async () => {
    const d = build();

    await d.service.encounterClosed('enc-1', PACIENTE, MEDICO);

    const [input] = d.notifications.emitInApp.mock.calls[0] as any[];
    expect(input.category).toBe('CLINICAL');
    expect(input.destination).toEqual({ type: 'ENCOUNTER', id: 'enc-1' });
  });

  it('no avisa —ni falla— cuando el perfil todavía no tiene cuenta activa', async () => {
    const d = build();
    d.accountLinks.findActiveByPerson.mockResolvedValue(null);

    const res = await d.service.prescriptionIssued('rx-1', PACIENTE, MEDICO);

    expect(res.failed).toBeUndefined();
    expect(d.notifications.emitInApp).not.toHaveBeenCalled();
    // No es un error: el alta asistida crea el perfil antes de que la persona
    // active su acceso. Registrarlo como fallo llenaría el log de ruido.
    expect(d.logger.error).not.toHaveBeenCalled();
  });

  it('se traga cualquier fallo: el acto clínico ya está asentado', async () => {
    const d = build();
    d.accountLinks.findActiveByPerson.mockRejectedValue(new Error('boom'));

    const res = await d.service.prescriptionIssued('rx-1', PACIENTE, MEDICO);

    expect(res.failed).toBe(true);
    expect(d.logger.error).toHaveBeenCalled();
  });
});
