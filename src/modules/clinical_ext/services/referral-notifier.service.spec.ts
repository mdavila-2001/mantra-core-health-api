import { jest } from '@jest/globals';
import {
  recommendedPractitionerRoute,
  ReferralNotifier,
} from './referral-notifier.service';
import { CEXT } from '../clinical_ext.concepts';
import { MESSAGING_SEED } from '../../../common/seed/messaging-seed.service';
import { Referrals } from '../entities';
import { PersonAccountLinks, Persons } from '../../profiles/entities';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

/**
 * El aviso a la paciente cuando su médico la deriva (pedido del propietario,
 * 24/10/2026). Se fija qué llega a la campana y, sobre todo, que **nada de esto
 * puede romper la derivación**, que ya está escrita.
 */
function build(options: { referral?: unknown; link?: unknown } = {}) {
  const referral =
    'referral' in options
      ? options.referral
      : {
          id: 'ref-1',
          patientProfileId: 'pat-1',
          targetProfileId: 'hp-9',
          referringProfileId: 'hp-1',
          reasonText: 'Control de la tiroides',
        };
  const people: Record<string, unknown> = {
    'pat-1': { id: 'pat-1' },
    'hp-9': { id: 'hp-9', name: 'Lucía', lastName: 'Mendoza' },
    'hp-1': { id: 'hp-1', displayName: 'Dra. Camila Vargas' },
  };
  const em: any = {
    fork: mockFn(() => em),
    findOne: mockFn(async (entity: unknown, where: any) => {
      if (entity === Referrals) return referral;
      if (entity === PersonAccountLinks) {
        return 'link' in options ? options.link : { userId: 'user-pat' };
      }
      if (entity === Persons) return people[where.id] ?? null;
      return null;
    }),
  };
  const notifications = {
    createRequest: mockFn(async () => ({
      id: 'req-1',
      suppressed: false,
      debounced: false,
    })),
    deliverNotification: mockFn(async () => ({})),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new ReferralNotifier(em, notifications as any, logger as any);
  return { service, em, notifications, logger };
}

describe('ReferralNotifier', () => {
  it('avisa por la campana, con el nombre de quien deriva y de a quién, y el enlace a su ficha', async () => {
    const d = build();

    expect(await d.service.notifyRecommended('ref-1')).toBe(true);

    const [request, actor] = d.notifications.createRequest.mock.calls[0];
    expect(request.channelId).toBe(MESSAGING_SEED.inAppChannelId);
    expect(request.recipientUserId).toBe('user-pat');
    expect(request.categoryConceptId).toBe(CEXT.NOTICE_REFERRAL_RECOMMENDED);
    expect(request.payloadJson.subject).toBe(
      'Su médico le recomienda otra consulta',
    );
    expect(request.payloadJson.bodyText).toContain('Dra. Camila Vargas');
    expect(request.payloadJson.bodyText).toContain('Lucía Mendoza');
    // El motivo cierra su frase: lo que sigue empieza otra oración.
    expect(request.payloadJson.bodyText).toContain(
      'Motivo: Control de la tiroides. Puede ver su ficha',
    );
    expect(request.payloadJson.route).toBe(
      recommendedPractitionerRoute('hp-9'),
    );
    expect(request.payloadJson.route).toBe('/directory/hp-9');
    // La campana abre el aviso por su destino: la ficha del profesional.
    expect(request.relatedResourceType).toBe('PRACTITIONER_PROFILE');
    expect(request.relatedResourceId).toBe('hp-9');
    expect(request.payloadJson.referralId).toBe('ref-1');
    expect(actor.roles).toEqual(['SYSTEM']);
    expect(d.notifications.deliverNotification).toHaveBeenCalledWith(
      'req-1',
      expect.objectContaining({ outcome: 'SENT' }),
      actor,
    );
  });

  it('una paciente sin cuenta de portal no recibe nada, y no es un error', async () => {
    const d = build({ link: null });

    expect(await d.service.notifyRecommended('ref-1')).toBe(false);

    expect(d.notifications.createRequest).not.toHaveBeenCalled();
  });

  it('una derivación sin profesional destino no avisa', async () => {
    const d = build({
      referral: {
        id: 'ref-1',
        patientProfileId: 'pat-1',
        targetProfileId: undefined,
      },
    });

    expect(await d.service.notifyRecommended('ref-1')).toBe(false);
    expect(d.notifications.createRequest).not.toHaveBeenCalled();
  });

  it('un aviso suprimido por las preferencias de la paciente no se entrega', async () => {
    const d = build();
    d.notifications.createRequest.mockResolvedValue({
      id: 'req-1',
      suppressed: true,
    });

    expect(await d.service.notifyRecommended('ref-1')).toBe(false);
    expect(d.notifications.deliverNotification).not.toHaveBeenCalled();
  });

  it('un fallo de mensajería se registra y se traga: la derivación ya existe', async () => {
    const d = build();
    d.notifications.createRequest.mockRejectedValue(
      new Error('mensajería caída'),
    );

    await expect(d.service.notifyRecommended('ref-1')).resolves.toBe(false);
    expect(d.logger.warn).toHaveBeenCalled();
  });
});
