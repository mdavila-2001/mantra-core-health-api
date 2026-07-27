import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { MarketingCampaignsService } from './marketing-campaigns.service';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';

const actor = { id: 'user-1', roles: ['MARKETING_MANAGER'] };
const TENANT = '11111111-1111-1111-1111-111111111111';
const SEGMENT = '22222222-2222-2222-2222-222222222222';
const CAMPAIGN = '33333333-3333-3333-3333-333333333333';
const MEMBER_A = '44444444-4444-4444-4444-444444444444';
const MEMBER_B = '55555555-5555-5555-5555-555555555555';

function build() {
  const tx = { flush: mockFn() };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const campaignsRepo = {
    createSegment: mockFn(),
    findSegmentById: mockFn(),
    findSegmentForUpdate: mockFn(),
    findSegmentByCode: mockFn(),
    createSegmentMember: mockFn(),
    findSegmentMembers: mockFn(),
    findActiveSegmentMembers: mockFn(),
    createCampaign: mockFn(),
    findCampaignForUpdate: mockFn(),
    findCampaignByCode: mockFn(),
    createCampaignMember: mockFn(),
    findCampaignMembers: mockFn(),
    findCampaignMemberByRefForUpdate: mockFn(),
    createContentTemplate: mockFn(),
    findLatestTemplateVersionForUpdate: mockFn(),
    findPublishedTemplate: mockFn(),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new MarketingCampaignsService(
    em as any,
    campaignsRepo,
    logger as any,
  );
  return { service, tx, campaignsRepo };
}

/** Miembro de segmento tal como lo devuelve el repositorio. */
function segmentMember(overrides: Record<string, unknown> = {}): any {
  return {
    id: 'sm-1',
    memberTypeConceptId: CONCEPTS.MEMBER_CONTACT,
    memberRefId: MEMBER_A,
    statusConceptId: CONCEPTS.SEGMENT_MEMBER_ACTIVE,
    score: undefined,
    addedAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  };
}

describe('MarketingCampaignsService', () => {
  describe('createSegment (UC-50-01)', () => {
    const dto = {
      tenantId: TENANT,
      code: 'SEG-VIP',
      name: 'Pacientes VIP',
      segmentType: 'DYNAMIC' as const,
    };

    it('creates the segment as active', async () => {
      const d = build();
      d.campaignsRepo.findSegmentByCode.mockResolvedValue(null);
      d.campaignsRepo.createSegment.mockReturnValue({ id: 'seg-1' });

      const res = await d.service.createSegment(dto, actor);

      expect(res).toEqual({
        id: 'seg-1',
        code: 'SEG-VIP',
        stateConceptId: CONCEPTS.STATE_ACTIVE,
      });
      expect(d.campaignsRepo.createSegment).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          segmentTypeConceptId: CONCEPTS.SEGMENT_DYNAMIC,
        }),
      );
    });

    it('rejects a code already used in the tenant', async () => {
      const d = build();
      d.campaignsRepo.findSegmentByCode.mockResolvedValue({
        id: 'seg-existing',
      });

      await expect(
        d.service.createSegment(dto, actor as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('carries the read model reference so the refresh knows its source', async () => {
      const d = build();
      d.campaignsRepo.findSegmentByCode.mockResolvedValue(null);
      d.campaignsRepo.createSegment.mockReturnValue({ id: 'seg-1' });

      await d.service.createSegment(
        {
          ...dto,
          sourceReadModelId: SEGMENT,
          definitionJson: { age: { $gte: 60 } },
        },
        actor,
      );

      expect(d.campaignsRepo.createSegment).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          sourceReadModelId: SEGMENT,
          definitionJson: { age: { $gte: 60 } },
        }),
      );
    });
  });

  describe('refreshSegment (UC-50-02)', () => {
    const dto = {
      members: [{ memberType: 'CONTACT' as const, memberRefId: MEMBER_A }],
    };

    it('adds the incoming members and recomputes the derived size', async () => {
      const d = build();
      const segment: any = {
        id: SEGMENT,
        stateConceptId: CONCEPTS.STATE_ACTIVE,
      };
      d.campaignsRepo.findSegmentForUpdate.mockResolvedValue(segment);
      d.campaignsRepo.findSegmentMembers.mockResolvedValue([]);

      const res = await d.service.refreshSegment(SEGMENT, dto, actor);

      expect(res).toEqual({
        segmentId: SEGMENT,
        added: 1,
        removed: 0,
        estimatedSize: 1,
      });
      expect(segment.estimatedSize).toBe('1');
      expect(segment.lastRefreshedAt).toBeInstanceOf(Date);
    });

    it('removes members that no longer belong instead of deleting them', async () => {
      const d = build();
      d.campaignsRepo.findSegmentForUpdate.mockResolvedValue({
        id: SEGMENT,
        stateConceptId: CONCEPTS.STATE_ACTIVE,
      });
      const leaving = segmentMember({ memberRefId: MEMBER_B });
      d.campaignsRepo.findSegmentMembers.mockResolvedValue([leaving]);

      const res = await d.service.refreshSegment(SEGMENT, dto, actor);

      expect(res.removed).toBe(1);
      expect(leaving.statusConceptId).toBe(CONCEPTS.SEGMENT_MEMBER_REMOVED);
    });

    it('reactivates a member that had left and comes back', async () => {
      const d = build();
      d.campaignsRepo.findSegmentForUpdate.mockResolvedValue({
        id: SEGMENT,
        stateConceptId: CONCEPTS.STATE_ACTIVE,
      });
      const returning = segmentMember({
        statusConceptId: CONCEPTS.SEGMENT_MEMBER_REMOVED,
      });
      d.campaignsRepo.findSegmentMembers.mockResolvedValue([returning]);

      const res = await d.service.refreshSegment(SEGMENT, dto, actor);

      expect(returning.statusConceptId).toBe(CONCEPTS.SEGMENT_MEMBER_ACTIVE);
      expect(res.added).toBe(1);
      expect(d.campaignsRepo.createSegmentMember).not.toHaveBeenCalled();
    });

    it('does not count an already active member as newly added', async () => {
      const d = build();
      d.campaignsRepo.findSegmentForUpdate.mockResolvedValue({
        id: SEGMENT,
        stateConceptId: CONCEPTS.STATE_ACTIVE,
      });
      d.campaignsRepo.findSegmentMembers.mockResolvedValue([segmentMember()]);

      const res = await d.service.refreshSegment(SEGMENT, dto, actor);

      expect(res).toEqual({
        segmentId: SEGMENT,
        added: 0,
        removed: 0,
        estimatedSize: 1,
      });
    });

    it('fails when the segment does not exist', async () => {
      const d = build();
      d.campaignsRepo.findSegmentForUpdate.mockResolvedValue(null);

      await expect(
        d.service.refreshSegment(SEGMENT, dto, actor as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('refuses to refresh a segment that is not active', async () => {
      const d = build();
      d.campaignsRepo.findSegmentForUpdate.mockResolvedValue({
        id: SEGMENT,
        stateConceptId: CONCEPTS.STATE_REVOKED,
      });

      await expect(
        d.service.refreshSegment(SEGMENT, dto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('createCampaign (UC-50-03)', () => {
    const dto = {
      tenantId: TENANT,
      code: 'CMP-01',
      name: 'Chequeo anual',
      campaignType: 'ONE_SHOT' as const,
      objective: 'CONVERSION' as const,
      channel: 'EMAIL' as const,
      segmentId: SEGMENT,
    };

    it('creates the campaign as scheduled', async () => {
      const d = build();
      d.campaignsRepo.findCampaignByCode.mockResolvedValue(null);
      d.campaignsRepo.findSegmentForUpdate.mockResolvedValue({ id: SEGMENT });
      d.campaignsRepo.createCampaign.mockReturnValue({ id: 'cmp-1' });

      const res = await d.service.createCampaign(dto, actor);

      expect(res.statusConceptId).toBe(CONCEPTS.CAMPAIGN_SCHEDULED);
      expect(d.campaignsRepo.createCampaign).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          objectiveConceptId: CONCEPTS.OBJECTIVE_CONVERSION,
          channelConceptId: CONCEPTS.CH_EMAIL,
        }),
      );
    });

    it('rejects a duplicate code in the tenant', async () => {
      const d = build();
      d.campaignsRepo.findCampaignByCode.mockResolvedValue({
        id: 'cmp-existing',
      });

      await expect(
        d.service.createCampaign(dto, actor as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rejects a window that ends before it starts', async () => {
      const d = build();
      d.campaignsRepo.findCampaignByCode.mockResolvedValue(null);

      await expect(
        d.service.createCampaign(
          {
            ...dto,
            startAt: '2026-03-01T00:00:00Z',
            endAt: '2026-02-01T00:00:00Z',
          },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('fails when the linked segment does not exist', async () => {
      const d = build();
      d.campaignsRepo.findCampaignByCode.mockResolvedValue(null);
      d.campaignsRepo.findSegmentForUpdate.mockResolvedValue(null);

      await expect(
        d.service.createCampaign(dto, actor as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('materializeMembers (UC-50-04)', () => {
    function scheduledCampaign(): any {
      return {
        id: CAMPAIGN,
        segmentId: SEGMENT,
        statusConceptId: CONCEPTS.CAMPAIGN_SCHEDULED,
      };
    }

    it('copies the active segment members and moves the campaign to running', async () => {
      const d = build();
      const campaign = scheduledCampaign();
      d.campaignsRepo.findCampaignForUpdate.mockResolvedValue(campaign);
      d.campaignsRepo.findActiveSegmentMembers.mockResolvedValue([
        segmentMember(),
      ]);
      d.campaignsRepo.findCampaignMembers.mockResolvedValue([]);

      const res = await d.service.materializeMembers(CAMPAIGN, {}, actor);

      expect(res).toEqual({
        campaignId: CAMPAIGN,
        materialized: 1,
        skipped: 0,
        statusConceptId: CONCEPTS.CAMPAIGN_RUNNING,
      });
      expect(campaign.statusConceptId).toBe(CONCEPTS.CAMPAIGN_RUNNING);
      expect(d.campaignsRepo.createCampaignMember).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          memberStatusConceptId: CONCEPTS.CAMPAIGN_MEMBER_TARGETED,
          sourceSegmentMemberId: 'sm-1',
        }),
      );
    });

    it('is idempotent: a member already in the audience is skipped', async () => {
      const d = build();
      d.campaignsRepo.findCampaignForUpdate.mockResolvedValue(
        scheduledCampaign(),
      );
      d.campaignsRepo.findActiveSegmentMembers.mockResolvedValue([
        segmentMember(),
      ]);
      d.campaignsRepo.findCampaignMembers.mockResolvedValue([
        { memberTypeConceptId: CONCEPTS.MEMBER_CONTACT, memberRefId: MEMBER_A },
      ]);

      const res = await d.service.materializeMembers(CAMPAIGN, {}, actor);

      expect(res).toMatchObject({ materialized: 0, skipped: 1 });
      expect(d.campaignsRepo.createCampaignMember).not.toHaveBeenCalled();
    });

    it('honours suppression: a do-not-contact member never enters the audience', async () => {
      const d = build();
      d.campaignsRepo.findCampaignForUpdate.mockResolvedValue(
        scheduledCampaign(),
      );
      d.campaignsRepo.findActiveSegmentMembers.mockResolvedValue([
        segmentMember(),
      ]);
      d.campaignsRepo.findCampaignMembers.mockResolvedValue([]);

      const res = await d.service.materializeMembers(
        CAMPAIGN,
        { suppressedMemberRefIds: [MEMBER_A] },
        actor,
      );

      expect(res).toMatchObject({ materialized: 0, skipped: 1 });
      expect(d.campaignsRepo.createCampaignMember).not.toHaveBeenCalled();
    });

    it('refuses a campaign already finished', async () => {
      const d = build();
      d.campaignsRepo.findCampaignForUpdate.mockResolvedValue({
        ...scheduledCampaign(),
        statusConceptId: CONCEPTS.CAMPAIGN_FINISHED,
      });

      await expect(
        d.service.materializeMembers(CAMPAIGN, {}, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('refuses a campaign with no segment to derive the audience from', async () => {
      const d = build();
      d.campaignsRepo.findCampaignForUpdate.mockResolvedValue({
        ...scheduledCampaign(),
        segmentId: undefined,
      });

      await expect(
        d.service.materializeMembers(CAMPAIGN, {}, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('fails when the campaign does not exist', async () => {
      const d = build();
      d.campaignsRepo.findCampaignForUpdate.mockResolvedValue(null);

      await expect(
        d.service.materializeMembers(CAMPAIGN, {}, actor as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('publishTemplateVersion (UC-50-05)', () => {
    const dto = {
      tenantId: TENANT,
      name: 'Recordatorio de cita',
      channel: 'EMAIL' as const,
      subject: 'Su cita se acerca',
      bodyTemplate: 'Hola {{nombre}}',
    };

    it('starts at version 1 when the code has no previous version', async () => {
      const d = build();
      d.campaignsRepo.findLatestTemplateVersionForUpdate.mockResolvedValue(
        null,
      );
      d.campaignsRepo.createContentTemplate.mockReturnValue({ id: 'tpl-1' });

      const res = await d.service.publishTemplateVersion('TPL-REM', dto, actor);

      expect(res).toEqual({
        id: 'tpl-1',
        code: 'TPL-REM',
        version: 1,
        archivedVersionId: undefined,
      });
    });

    it('derives the version from the previous one and archives it', async () => {
      const d = build();
      const previous: any = {
        id: 'tpl-prev',
        version: 3,
        statusConceptId: CONCEPTS.CONTENT_TEMPLATE_PUBLISHED,
      };
      d.campaignsRepo.findLatestTemplateVersionForUpdate.mockResolvedValue(
        previous,
      );
      d.campaignsRepo.createContentTemplate.mockReturnValue({ id: 'tpl-4' });

      const res = await d.service.publishTemplateVersion('TPL-REM', dto, actor);

      expect(res.version).toBe(4);
      expect(res.archivedVersionId).toBe('tpl-prev');
      expect(previous.statusConceptId).toBe(CONCEPTS.CONTENT_TEMPLATE_ARCHIVED);
    });

    it('does not re-archive a previous version that was already archived', async () => {
      const d = build();
      const previous: any = {
        id: 'tpl-prev',
        version: 2,
        statusConceptId: CONCEPTS.CONTENT_TEMPLATE_ARCHIVED,
      };
      d.campaignsRepo.findLatestTemplateVersionForUpdate.mockResolvedValue(
        previous,
      );
      d.campaignsRepo.createContentTemplate.mockReturnValue({ id: 'tpl-3' });

      const res = await d.service.publishTemplateVersion('TPL-REM', dto, actor);

      expect(res.version).toBe(3);
      expect(res.archivedVersionId).toBeUndefined();
    });

    it('publishes the new version straight away', async () => {
      const d = build();
      d.campaignsRepo.findLatestTemplateVersionForUpdate.mockResolvedValue(
        null,
      );
      d.campaignsRepo.createContentTemplate.mockReturnValue({ id: 'tpl-1' });

      await d.service.publishTemplateVersion('TPL-REM', dto, actor);

      expect(d.campaignsRepo.createContentTemplate).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          statusConceptId: CONCEPTS.CONTENT_TEMPLATE_PUBLISHED,
          channelConceptId: CONCEPTS.CH_EMAIL,
        }),
      );
    });
  });
});
