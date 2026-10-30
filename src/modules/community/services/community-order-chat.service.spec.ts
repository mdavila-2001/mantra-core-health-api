import { jest } from '@jest/globals';
import { CONCEPTS, PreconditionFailedException } from '../../../common';
import { COMM } from '../community.concepts';
import { CommunityOrderChatService } from './community-order-chat.service';
import { CommunityOrganizationStaffService } from './community-organization-staff.service';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const TENANT = 'tenant-farmacia';
const showcase = (overrides: Record<string, unknown> = {}) => ({
  id: 'vitrina-1',
  slug: `organization-${TENANT}`,
  targetId: TENANT,
  targetTypeConceptId: COMM.PROFILE_TARGET_PHARMACY,
  statusConceptId: CONCEPTS.STATE_ACTIVE,
  visibilityConceptId: COMM.PROFILE_VISIBILITY_PUBLIC,
  ...overrides,
});
const patientProfile = {
  id: 'p-paciente',
  targetId: 'user-1',
  targetTypeConceptId: COMM.PROFILE_TARGET_USER,
  statusConceptId: CONCEPTS.STATE_ACTIVE,
  visibilityConceptId: COMM.PROFILE_VISIBILITY_PRIVATE,
};

function build() {
  const fork = {};
  const em = { fork: mockFn(() => fork) };
  const profilesRepo = {
    listByIds: mockFn(async () => []),
    listByTargetIds: mockFn(async () => [showcase()]),
    findByTarget: mockFn(async () => patientProfile),
  };
  const messaging = {
    createSystemDirectConversation: mockFn(async () => ({ id: 'conv-1' })),
  };
  const staff = new CommunityOrganizationStaffService({} as any);
  jest
    .spyOn(staff, 'verifiedActiveTenantIds')
    .mockResolvedValue(new Set([TENANT]));
  const logger = { setContext: mockFn(), info: mockFn() };
  const service = new CommunityOrderChatService(
    em as any,
    profilesRepo as any,
    messaging as any,
    staff,
    logger as any,
  );
  return { service, fork, profilesRepo, messaging, staff };
}

const patient = { id: 'user-1', roles: ['PATIENT'] } as any;
const pharmacyStaff = { id: 'staff-1', roles: ['PHARMACY_STAFF'] } as any;

describe('CommunityOrderChatService', () => {
  describe('findOrganizationShowcases', () => {
    it('resuelve por la vitrina enlazada si es de la misma organización', async () => {
      const d = build();
      d.profilesRepo.listByIds.mockResolvedValue([
        showcase({ id: 'enlazada' }),
      ]);

      const map = await d.service.findOrganizationShowcases(d.fork as any, [
        { key: 'ph-1', tenantId: TENANT, publicProfileId: 'enlazada' },
      ]);

      expect(map.get('ph-1')).toEqual({
        profileId: 'enlazada',
        slug: `organization-${TENANT}`,
      });
    });

    it('un enlace a la vitrina de otra organización no se usa', async () => {
      const d = build();
      d.profilesRepo.listByIds.mockResolvedValue([
        showcase({ id: 'ajena', targetId: 'otro-tenant' }),
      ]);

      const map = await d.service.findOrganizationShowcases(d.fork as any, [
        { key: 'ph-1', tenantId: TENANT, publicProfileId: 'ajena' },
      ]);

      expect(map.get('ph-1')?.profileId).toBe('vitrina-1');
    });

    it.each([
      ['privada', { visibilityConceptId: COMM.PROFILE_VISIBILITY_PRIVATE }],
      ['pendiente', { statusConceptId: CONCEPTS.STATE_PENDING }],
      [
        'que no es de organización',
        { targetTypeConceptId: COMM.PROFILE_TARGET_USER },
      ],
    ])('omite una vitrina %s', async (_c, overrides) => {
      const d = build();
      d.profilesRepo.listByTargetIds.mockResolvedValue([showcase(overrides)]);

      const map = await d.service.findOrganizationShowcases(d.fork as any, [
        { key: 'ph-1', tenantId: TENANT },
      ]);

      expect(map.has('ph-1')).toBe(false);
    });

    it('omite la de un tenant no verificado o suspendido', async () => {
      const d = build();
      (d.staff.verifiedActiveTenantIds as any).mockResolvedValue(new Set());

      const map = await d.service.findOrganizationShowcases(d.fork as any, [
        { key: 'ph-1', tenantId: TENANT },
      ]);

      expect(map.size).toBe(0);
    });
  });

  describe('openOrderConversation', () => {
    it('el paciente inicia por el canal de sistema, con su perfil primero', async () => {
      const d = build();

      const res = await d.service.openOrderConversation(
        {
          organization: { tenantId: TENANT },
          patientUserId: 'user-1',
          openedBy: 'PATIENT',
        },
        patient,
      );

      expect(res).toEqual({
        conversationId: 'conv-1',
        organizationProfileId: 'vitrina-1',
      });
      expect(d.messaging.createSystemDirectConversation).toHaveBeenCalledWith(
        {
          conversationType: 'DIRECT',
          participantProfileIds: ['p-paciente', 'vitrina-1'],
        },
        { ...patient, roles: ['PATIENT', 'SYSTEM'] },
      );
    });

    it('el personal inicia como la vitrina', async () => {
      const d = build();

      await d.service.openOrderConversation(
        {
          organization: { tenantId: TENANT },
          patientUserId: 'user-1',
          openedBy: 'ORGANIZATION_STAFF',
        },
        pharmacyStaff,
      );

      const [dto] = d.messaging.createSystemDirectConversation.mock.calls[0];
      expect(dto.participantProfileIds).toEqual(['vitrina-1', 'p-paciente']);
    });

    it('sin perfil del paciente, 422 tipificado y no crea nada', async () => {
      const d = build();
      d.profilesRepo.findByTarget.mockResolvedValue(null);

      const error = await d.service
        .openOrderConversation(
          {
            organization: { tenantId: TENANT },
            patientUserId: 'user-1',
            openedBy: 'PATIENT',
          },
          patient,
        )
        .catch((e: unknown) => e);

      expect(error).toBeInstanceOf(PreconditionFailedException);
      expect((error as PreconditionFailedException).reason).toBe(
        'PATIENT_CHAT_PROFILE_MISSING',
      );
      expect(d.messaging.createSystemDirectConversation).not.toHaveBeenCalled();
    });

    it('sin vitrina de la farmacia, 422 tipificado', async () => {
      const d = build();
      d.profilesRepo.listByTargetIds.mockResolvedValue([]);

      const error = await d.service
        .openOrderConversation(
          {
            organization: { tenantId: TENANT },
            patientUserId: 'user-1',
            openedBy: 'PATIENT',
          },
          patient,
        )
        .catch((e: unknown) => e);

      expect((error as PreconditionFailedException).reason).toBe(
        'ORGANIZATION_CHAT_PROFILE_UNAVAILABLE',
      );
      expect(d.messaging.createSystemDirectConversation).not.toHaveBeenCalled();
    });
  });
});
