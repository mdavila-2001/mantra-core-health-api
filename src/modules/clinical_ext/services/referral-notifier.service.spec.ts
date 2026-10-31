import { jest } from '@jest/globals';
import {
  recommendedPractitionerRoute,
  referredOrganizationRoute,
  ReferralNotifier,
} from './referral-notifier.service';
import { CEXT } from '../clinical_ext.concepts';
import { MESSAGING_SEED } from '../../../common/seed/messaging-seed.service';
import { CONCEPTS } from '../../../common';
import { Referrals } from '../entities';
import { PersonAccountLinks, Persons } from '../../profiles/entities';
import { Tenants } from '../../directory/entities';
import { ServiceCatalog } from '../../billing/entities';
import { PublicProfiles } from '../../community/entities';
import { COMM } from '../../community/community.concepts';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

/**
 * El aviso a la paciente cuando su médico la deriva (pedido del propietario,
 * 24/10/2026). Se fija qué llega a la campana y, sobre todo, que **nada de esto
 * puede romper la derivación**, que ya está escrita.
 */
function build(
  options: {
    referral?: unknown;
    link?: unknown;
    tenant?: unknown;
    service?: unknown;
    publicProfile?: unknown;
  } = {},
) {
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
      if (entity === Tenants) {
        return 'tenant' in options
          ? options.tenant
          : { id: 'ten-9', legalName: 'Clínica Norte S.R.L.' };
      }
      if (entity === ServiceCatalog) {
        return 'service' in options
          ? options.service
          : { id: 'svc-1', name: 'Fisioterapia' };
      }
      if (entity === PublicProfiles) {
        return 'publicProfile' in options
          ? options.publicProfile
          : { id: 'pp-1', slug: 'clinica-norte' };
      }
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

  it('una derivación sin profesional ni organización destino no avisa', async () => {
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

  describe('derivación a una organización', () => {
    const orgReferral = {
      id: 'ref-2',
      patientProfileId: 'pat-1',
      targetProfileId: null,
      targetTenantId: 'ten-9',
      targetServiceCatalogId: 'svc-1',
      referringProfileId: 'hp-1',
      reasonText: 'Rehabilitación de rodilla',
    };

    it('avisa por la misma campana: «Su médico le derivó a» la organización, con el servicio y el enlace a su ficha pública', async () => {
      const d = build({
        referral: orgReferral,
        tenant: {
          id: 'ten-9',
          legalName: 'Clínica Norte S.R.L.',
          tradeName: 'Clínica Norte',
        },
      });

      expect(await d.service.notifyRecommended('ref-2')).toBe(true);

      const [request, actor] = d.notifications.createRequest.mock.calls[0];
      expect(request.channelId).toBe(MESSAGING_SEED.inAppChannelId);
      expect(request.recipientUserId).toBe('user-pat');
      expect(request.categoryConceptId).toBe(CEXT.NOTICE_REFERRAL_RECOMMENDED);
      expect(request.payloadJson.kind).toBe('REFERRAL_RECOMMENDED');
      // El nombre comercial gana sobre la razón social, como en la búsqueda.
      expect(request.payloadJson.subject).toBe(
        'Su médico le derivó a Clínica Norte',
      );
      expect(request.payloadJson.bodyText).toBe(
        'Su médico le derivó a Clínica Norte para Fisioterapia. ' +
          'Motivo: Rehabilitación de rodilla. ' +
          'Puede ver su ficha y reservar una cita desde su portal.',
      );
      expect(request.payloadJson.route).toBe(
        referredOrganizationRoute('clinica-norte'),
      );
      expect(request.payloadJson.route).toBe('/o/clinica-norte');
      expect(request.payloadJson.referralId).toBe('ref-2');
      expect(request.relatedResourceType).toBe('ORGANIZATION_PROFILE');
      expect(request.relatedResourceId).toBe('ten-9');
      expect(d.notifications.deliverNotification).toHaveBeenCalledWith(
        'req-1',
        expect.objectContaining({
          outcome: 'SENT',
          providerChannelConfigId: MESSAGING_SEED.inAppChannelConfigId,
          subject: 'Su médico le derivó a Clínica Norte',
        }),
        actor,
      );
    });

    it('el enlace sale sólo de una ficha pública y activa de organización de ese tenant', async () => {
      const d = build({ referral: orgReferral });

      await d.service.notifyRecommended('ref-2');

      expect(d.em.findOne).toHaveBeenCalledWith(PublicProfiles, {
        targetId: 'ten-9',
        targetTypeConceptId: COMM.PROFILE_TARGET_ORGANIZATION,
        visibilityConceptId: COMM.PROFILE_VISIBILITY_PUBLIC,
        statusConceptId: CONCEPTS.STATE_ACTIVE,
      });
    });

    it('sin ficha pública avisa igual, sin enlace y sin destino de campana', async () => {
      const d = build({ referral: orgReferral, publicProfile: null });

      expect(await d.service.notifyRecommended('ref-2')).toBe(true);

      const [request] = d.notifications.createRequest.mock.calls[0];
      expect(request.payloadJson.subject).toBe(
        'Su médico le derivó a Clínica Norte S.R.L.',
      );
      expect(request.payloadJson.bodyText).toBe(
        'Su médico le derivó a Clínica Norte S.R.L. para Fisioterapia. ' +
          'Motivo: Rehabilitación de rodilla.',
      );
      expect(request.payloadJson).not.toHaveProperty('route');
      expect(request).not.toHaveProperty('relatedResourceType');
      expect(request).not.toHaveProperty('relatedResourceId');
    });

    it('sin servicio ni motivo, el aviso nombra sólo la organización', async () => {
      const d = build({
        referral: {
          ...orgReferral,
          targetServiceCatalogId: null,
          reasonText: null,
        },
      });

      expect(await d.service.notifyRecommended('ref-2')).toBe(true);

      const [request] = d.notifications.createRequest.mock.calls[0];
      expect(request.payloadJson.bodyText).toBe(
        'Su médico le derivó a Clínica Norte S.R.L. ' +
          'Puede ver su ficha y reservar una cita desde su portal.',
      );
      expect(d.em.findOne).not.toHaveBeenCalledWith(
        ServiceCatalog,
        expect.anything(),
      );
    });

    it('con profesional y organización, el aviso es el del profesional, como siempre', async () => {
      const d = build({
        referral: { ...orgReferral, targetProfileId: 'hp-9' },
      });

      expect(await d.service.notifyRecommended('ref-2')).toBe(true);

      const [request] = d.notifications.createRequest.mock.calls[0];
      expect(request.payloadJson.subject).toBe(
        'Su médico le recomienda otra consulta',
      );
      expect(request.payloadJson.route).toBe('/directory/hp-9');
      expect(request.relatedResourceType).toBe('PRACTITIONER_PROFILE');
      expect(request.relatedResourceId).toBe('hp-9');
    });

    it('un fallo al leer la organización no rompe nada ni registra datos de la persona', async () => {
      const d = build({ referral: orgReferral });
      const original = d.em.findOne.getMockImplementation();
      d.em.findOne.mockImplementation(async (entity: unknown, where: any) => {
        if (entity === Tenants) throw new Error('Clínica Norte: caída');
        return original(entity, where);
      });

      await expect(d.service.notifyRecommended('ref-2')).resolves.toBe(false);

      const [fields] = d.logger.warn.mock.calls[0];
      expect(fields).toEqual({
        operation: 'clinical_ext.referral.notice',
        referralId: 'ref-2',
        errorName: 'Error',
      });
    });
  });
});
