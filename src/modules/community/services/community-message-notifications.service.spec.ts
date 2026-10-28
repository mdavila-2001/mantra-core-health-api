import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { CommunityMessageNotificationsService } from './community-message-notifications.service';
import { CommunityOrganizationStaffService } from './community-organization-staff.service';
import { COMM } from '../community.concepts';
import { DIR } from '../../directory/directory.concepts';

const CONVERSATION = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
const SENDER = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const RECIPIENT = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const ACCOUNT = 'dddddddd-dddd-dddd-dddd-dddddddddddd';

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
        id === SENDER
          ? { id, displayName: 'Dra. Marisol Quispe', targetId: 'persona-a' }
          : { id, displayName: 'Juan Paciente', targetId: 'persona-b' },
      ),
    ),
  };
  const accountLinks = {
    findActiveByPerson: mockFn(() => Promise.resolve({ userId: ACCOUNT })),
  };
  const logger = {
    setContext: mockFn(),
    info: mockFn(),
    warn: mockFn(),
    error: mockFn(),
  };
  const membershipsRepo = {
    findByTenantAndStatus: mockFn(() => Promise.resolve([])),
    findActiveByUserTenant: mockFn(() => Promise.resolve(null)),
  };
  const service = new CommunityMessageNotificationsService(
    em,
    notifications as any,
    profilesRepo as any,
    accountLinks as any,
    logger as any,
    new CommunityOrganizationStaffService(membershipsRepo as any),
  );
  return {
    service,
    notifications,
    profilesRepo,
    accountLinks,
    logger,
    membershipsRepo,
  };
}

describe('CommunityMessageNotificationsService · enganche P2 → P1', () => {
  it('avisa al destinatario con el nombre de quien escribe y el hilo como destino', async () => {
    const d = build();

    await d.service.newMessage(CONVERSATION, SENDER, [RECIPIENT], 'user-1');

    const [input] = d.notifications.emitInApp.mock.calls[0] as any[];
    expect(input.recipientUserId).toBe(ACCOUNT);
    expect(input.category).toBe('MESSAGES');
    // El nombre es lo que hace útil el aviso: «Mensaje nuevo» a secas obliga a
    // abrir el hilo para saber si vale la pena.
    expect(input.subject).toBe('Dra. Marisol Quispe le escribió');
    expect(input.destination).toEqual({
      type: 'CONVERSATION',
      id: CONVERSATION,
    });
  });

  it('la clave de rebote incluye al destinatario, para no taparle el aviso a otro', async () => {
    const d = build();

    await d.service.newMessage(CONVERSATION, SENDER, [RECIPIENT], 'user-1');

    const [input] = d.notifications.emitInApp.mock.calls[0] as any[];
    expect(input.debounceKey).toBe(`conversation:${CONVERSATION}:${ACCOUNT}`);
  });

  it('cae en `created_by_user_id` cuando el perfil no se resuelve por persona', async () => {
    const d = build();
    d.accountLinks.findActiveByPerson.mockResolvedValue(null);
    d.profilesRepo.findById.mockResolvedValue({
      id: RECIPIENT,
      displayName: 'Quien sea',
      targetId: 'persona-b',
      createdByUserId: 'cuenta-creadora',
    });

    await d.service.newMessage(CONVERSATION, SENDER, [RECIPIENT], 'user-1');

    const [input] = d.notifications.emitInApp.mock.calls[0] as any[];
    expect(input.recipientUserId).toBe('cuenta-creadora');
  });

  it('no avisa —ni falla— a un perfil que ninguna cuenta encarna', async () => {
    const d = build();
    d.accountLinks.findActiveByPerson.mockResolvedValue(null);
    d.profilesRepo.findById.mockResolvedValue({
      id: RECIPIENT,
      displayName: 'Clínica San Juan',
      targetId: 'organizacion-1',
    });

    await d.service.newMessage(CONVERSATION, SENDER, [RECIPIENT], 'user-1');

    // Un perfil público de organización que nadie encarna sigue recibiendo el
    // mensaje: lo verá al abrir su bandeja. No hay a quién sonarle la campana.
    expect(d.notifications.emitInApp).not.toHaveBeenCalled();
    expect(d.logger.error).not.toHaveBeenCalled();
  });

  it('se traga cualquier fallo: el mensaje ya está guardado', async () => {
    const d = build();
    d.profilesRepo.findById.mockRejectedValue(new Error('boom'));

    await expect(
      d.service.newMessage(CONVERSATION, SENDER, [RECIPIENT], 'user-1'),
    ).resolves.toBeUndefined();
    expect(d.logger.error).toHaveBeenCalled();
  });
  describe('vitrina de organización (farmacia)', () => {
    const PHARMACY_TENANT = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';

    function asPharmacy(d: ReturnType<typeof build>) {
      d.profilesRepo.findById.mockImplementation((_em: any, id: string) =>
        Promise.resolve(
          id === SENDER
            ? { id, displayName: 'Juan Paciente', targetId: 'persona-a' }
            : {
                id,
                displayName: 'Farmacia Central',
                targetId: PHARMACY_TENANT,
                targetTypeConceptId: COMM.PROFILE_TARGET_PHARMACY,
                // Quien verificó el tenant: NO es quien atiende la bandeja.
                createdByUserId: 'admin-de-plataforma',
              },
        ),
      );
      d.membershipsRepo.findByTenantAndStatus.mockResolvedValue([
        { userId: 'staff-1', tenantRoleConceptId: DIR.ROLE_STAFF },
        { userId: 'owner-1', tenantRoleConceptId: DIR.ROLE_OWNER },
        { userId: 'medico-1', tenantRoleConceptId: DIR.ROLE_PRACTITIONER },
      ]);
    }

    it('avisa a cada miembro activo que atiende la bandeja, nunca al creador', async () => {
      const d = build();
      asPharmacy(d);

      await d.service.newMessage(CONVERSATION, SENDER, [RECIPIENT], 'user-1');

      expect(d.membershipsRepo.findByTenantAndStatus).toHaveBeenCalledWith(
        expect.anything(),
        PHARMACY_TENANT,
        DIR.MEMBERSHIP_ACTIVE,
      );
      const recipients = d.notifications.emitInApp.mock.calls.map(
        (call: any[]) => call[0].recipientUserId,
      );
      expect(recipients.sort()).toEqual(['owner-1', 'staff-1']);
      expect(recipients).not.toContain('admin-de-plataforma');
      expect(d.accountLinks.findActiveByPerson).not.toHaveBeenCalled();
    });

    it('no se avisa a sí mismo quien escribió atendiendo la bandeja', async () => {
      const d = build();
      asPharmacy(d);

      await d.service.newMessage(CONVERSATION, SENDER, [RECIPIENT], 'staff-1');

      const recipients = d.notifications.emitInApp.mock.calls.map(
        (call: any[]) => call[0].recipientUserId,
      );
      expect(recipients).toEqual(['owner-1']);
    });
  });
});
