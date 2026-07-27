import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { OpsIncidentsService } from './ops-incidents.service';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';

const actor = { id: 'user-1', roles: ['SRE'] };
const CHECK = '11111111-1111-1111-1111-111111111111';
const COMPONENT = '22222222-2222-2222-2222-222222222222';
const INCIDENT = '33333333-3333-3333-3333-333333333333';
const RUN = '44444444-4444-4444-4444-444444444444';
const OWNER = '55555555-5555-5555-5555-555555555555';

function build() {
  const tx = { flush: mockFn() };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  let timelineSeq = 0;
  const incidentsRepo = {
    findHealthCheckById: mockFn(),
    createHealthRun: mockFn(() => ({ id: RUN })),
    findRecentRuns: mockFn(() => Promise.resolve([])),
    createIncident: mockFn(() => ({ id: INCIDENT })),
    findIncidentById: mockFn(),
    findIncidentForUpdate: mockFn(),
    findOpenIncidentByCheckForUpdate: mockFn(() => Promise.resolve(null)),
    countIncidents: mockFn(() => Promise.resolve(0)),
    createResponder: mockFn(() => ({ id: 'responder-1' })),
    findResponder: mockFn(() => Promise.resolve(null)),
    createTimelineEvent: mockFn(() => ({ id: `timeline-${++timelineSeq}` })),
    createCommunication: mockFn(() => ({ id: 'communication-1' })),
    createPostmortem: mockFn(() => ({ id: 'postmortem-1' })),
    findPostmortemByIncident: mockFn(() => Promise.resolve(null)),
    createActionItem: mockFn(() => ({ id: 'action-1' })),
  };
  const improvementsRepo = {
    createImprovementItem: mockFn(() => ({ id: 'improvement-1' })),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new OpsIncidentsService(
    em as any,
    incidentsRepo,
    improvementsRepo,
    logger as any,
  );
  return { service, tx, incidentsRepo, improvementsRepo, logger };
}

function enabledCheck(overrides: Record<string, unknown> = {}): any {
  return {
    id: CHECK,
    code: 'gateway-http',
    name: 'Gateway HTTP',
    serviceComponentId: COMPONENT,
    stateConceptId: CONCEPTS.STATE_ACTIVE,
    isEnabled: true,
    unhealthyThreshold: 3,
    ...overrides,
  };
}

describe('OpsIncidentsService', () => {
  describe('recordHealthRun (UC-46-06)', () => {
    const failing: any = { status: 'FAIL', source: 'SCHEDULER' };

    it('records a passing run without opening anything', async () => {
      const d = build();
      d.incidentsRepo.findHealthCheckById.mockResolvedValue(enabledCheck());

      const res = await d.service.recordHealthRun(
        CHECK,
        { status: 'PASS', source: 'PROBE' } as any,
        actor,
      );

      expect(res).toEqual({
        id: RUN,
        statusConceptId: CONCEPTS.HC_RUN_PASS,
        consecutiveFailures: 0,
        incidentOpened: false,
      });
    });

    it('counts consecutive failures without reaching the threshold', async () => {
      const d = build();
      d.incidentsRepo.findHealthCheckById.mockResolvedValue(enabledCheck());
      d.incidentsRepo.findRecentRuns.mockResolvedValue([
        { statusConceptId: CONCEPTS.HC_RUN_FAIL },
      ]);

      const res = await d.service.recordHealthRun(CHECK, failing, actor);

      expect(res.consecutiveFailures).toBe(2);
      expect(res.incidentOpened).toBe(false);
      expect(d.incidentsRepo.createIncident).not.toHaveBeenCalled();
    });

    it('stops counting at the first non-failing run', async () => {
      const d = build();
      d.incidentsRepo.findHealthCheckById.mockResolvedValue(enabledCheck());
      d.incidentsRepo.findRecentRuns.mockResolvedValue([
        { statusConceptId: CONCEPTS.HC_RUN_FAIL },
        { statusConceptId: CONCEPTS.HC_RUN_PASS },
        { statusConceptId: CONCEPTS.HC_RUN_FAIL },
      ]);

      const res = await d.service.recordHealthRun(CHECK, failing, actor);

      expect(res.consecutiveFailures).toBe(2);
    });

    it('does not count a warning as a failure', async () => {
      const d = build();
      d.incidentsRepo.findHealthCheckById.mockResolvedValue(enabledCheck());
      d.incidentsRepo.findRecentRuns.mockResolvedValue([
        { statusConceptId: CONCEPTS.HC_RUN_FAIL },
        { statusConceptId: CONCEPTS.HC_RUN_FAIL },
      ]);

      const res = await d.service.recordHealthRun(
        CHECK,
        { status: 'WARN', source: 'SCHEDULER' } as any,
        actor,
      );

      expect(res.consecutiveFailures).toBe(0);
      expect(res.incidentOpened).toBe(false);
    });

    it('opens the incident when the threshold is reached', async () => {
      const d = build();
      d.incidentsRepo.findHealthCheckById.mockResolvedValue(enabledCheck());
      d.incidentsRepo.findRecentRuns.mockResolvedValue([
        { statusConceptId: CONCEPTS.HC_RUN_TIMEOUT },
        { statusConceptId: CONCEPTS.HC_RUN_ERROR },
      ]);
      d.incidentsRepo.countIncidents.mockResolvedValue(6);

      const res = await d.service.recordHealthRun(CHECK, failing, actor);

      expect(res.consecutiveFailures).toBe(3);
      expect(res.incidentOpened).toBe(true);
      expect(res.healthIncidentId).toBe(INCIDENT);
      expect(d.incidentsRepo.createIncident).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          incidentNumber: 'INC-000007',
          statusConceptId: CONCEPTS.INCIDENT_OPEN,
          detectedByRunId: RUN,
        }),
      );
      expect(d.incidentsRepo.createTimelineEvent).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          eventTypeConceptId: CONCEPTS.TIMELINE_DETECTED,
        }),
      );
    });

    it('uses the severity declared on the check', async () => {
      const d = build();
      d.incidentsRepo.findHealthCheckById.mockResolvedValue(
        enabledCheck({
          unhealthyThreshold: 1,
          severityConceptId: CONCEPTS.INCIDENT_SEV_CRITICAL,
        }),
      );

      await d.service.recordHealthRun(CHECK, failing, actor);

      expect(d.incidentsRepo.createIncident).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          severityConceptId: CONCEPTS.INCIDENT_SEV_CRITICAL,
        }),
      );
    });

    it('treats a check without threshold as one failure being enough', async () => {
      const d = build();
      d.incidentsRepo.findHealthCheckById.mockResolvedValue(
        enabledCheck({ unhealthyThreshold: undefined }),
      );

      const res = await d.service.recordHealthRun(CHECK, failing, actor);

      expect(res.incidentOpened).toBe(true);
    });

    it('does not duplicate an incident that is still live', async () => {
      const d = build();
      d.incidentsRepo.findHealthCheckById.mockResolvedValue(
        enabledCheck({ unhealthyThreshold: 1 }),
      );
      d.incidentsRepo.findOpenIncidentByCheckForUpdate.mockResolvedValue({
        id: 'incident-live',
      });

      const res = await d.service.recordHealthRun(CHECK, failing, actor);

      expect(res.incidentOpened).toBe(false);
      expect(res.healthIncidentId).toBe('incident-live');
      expect(d.incidentsRepo.createIncident).not.toHaveBeenCalled();
      expect(d.incidentsRepo.createTimelineEvent).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ eventTypeConceptId: CONCEPTS.TIMELINE_NOTE }),
      );
    });

    it('refuses a disabled check', async () => {
      const d = build();
      d.incidentsRepo.findHealthCheckById.mockResolvedValue(
        enabledCheck({ isEnabled: false }),
      );

      await expect(
        d.service.recordHealthRun(CHECK, failing, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('refuses a check that is not active', async () => {
      const d = build();
      d.incidentsRepo.findHealthCheckById.mockResolvedValue(
        enabledCheck({ stateConceptId: CONCEPTS.STATE_REVOKED }),
      );

      await expect(
        d.service.recordHealthRun(CHECK, failing, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('fails when the check does not exist', async () => {
      const d = build();
      d.incidentsRepo.findHealthCheckById.mockResolvedValue(null);

      await expect(
        d.service.recordHealthRun(CHECK, failing, actor as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('updateIncident (UC-46-07)', () => {
    function liveIncident(overrides: Record<string, unknown> = {}): any {
      return {
        id: INCIDENT,
        serviceComponentId: COMPONENT,
        statusConceptId: CONCEPTS.INCIDENT_OPEN,
        ...overrides,
      };
    }

    it('acknowledges the incident and stamps the moment', async () => {
      const d = build();
      const incident = liveIncident();
      d.incidentsRepo.findIncidentForUpdate.mockResolvedValue(incident);

      const res = await d.service.updateIncident(
        INCIDENT,
        { transition: 'ACKNOWLEDGE' } as any,
        actor,
      );

      expect(res.statusConceptId).toBe(CONCEPTS.INCIDENT_ACKNOWLEDGED);
      expect(incident.acknowledgedAt).toBeInstanceOf(Date);
      expect(res.timelineEventIds).toHaveLength(1);
    });

    it('mitigates straight from open', async () => {
      const d = build();
      d.incidentsRepo.findIncidentForUpdate.mockResolvedValue(liveIncident());

      const res = await d.service.updateIncident(
        INCIDENT,
        { transition: 'MITIGATE' } as any,
        actor,
      );

      expect(res.statusConceptId).toBe(CONCEPTS.INCIDENT_MITIGATED);
    });

    it('refuses resolving straight from open', async () => {
      const d = build();
      d.incidentsRepo.findIncidentForUpdate.mockResolvedValue(liveIncident());

      await expect(
        d.service.updateIncident(
          INCIDENT,
          {
            transition: 'RESOLVE',
            rootCauseText: 'a',
            resolutionText: 'b',
          } as any,
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('demands root cause and resolution when resolving', async () => {
      const d = build();
      d.incidentsRepo.findIncidentForUpdate.mockResolvedValue(
        liveIncident({ statusConceptId: CONCEPTS.INCIDENT_MITIGATED }),
      );

      await expect(
        d.service.updateIncident(
          INCIDENT,
          { transition: 'RESOLVE', rootCauseText: 'sólo la causa' } as any,
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('resolves with cause and resolution', async () => {
      const d = build();
      const incident = liveIncident({
        statusConceptId: CONCEPTS.INCIDENT_MITIGATED,
      });
      d.incidentsRepo.findIncidentForUpdate.mockResolvedValue(incident);

      const res = await d.service.updateIncident(
        INCIDENT,
        {
          transition: 'RESOLVE',
          rootCauseText: 'fuga de conexiones',
          resolutionText: 'reinicio y parche',
        } as any,
        actor,
      );

      expect(res.statusConceptId).toBe(CONCEPTS.INCIDENT_RESOLVED);
      expect(incident.resolvedAt).toBeInstanceOf(Date);
      expect(incident.rootCauseText).toBe('fuga de conexiones');
    });

    it('adds responders and their timeline entries', async () => {
      const d = build();
      d.incidentsRepo.findIncidentForUpdate.mockResolvedValue(liveIncident());

      const res = await d.service.updateIncident(
        INCIDENT,
        {
          transition: 'UPDATE',
          responders: [
            { userId: OWNER, role: 'COMMANDER', acknowledged: true },
          ],
        } as any,
        actor,
      );

      expect(res.addedResponderIds).toEqual(['responder-1']);
      expect(d.incidentsRepo.createResponder).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          responderRoleConceptId: CONCEPTS.RESPONDER_COMMANDER,
        }),
      );
    });

    it('does not add the same responder twice but records the acknowledgement', async () => {
      const d = build();
      const existing: any = { id: 'responder-prev', acknowledgedAt: undefined };
      d.incidentsRepo.findIncidentForUpdate.mockResolvedValue(liveIncident());
      d.incidentsRepo.findResponder.mockResolvedValue(existing);

      const res = await d.service.updateIncident(
        INCIDENT,
        {
          transition: 'UPDATE',
          responders: [
            { userId: OWNER, role: 'OPERATIONS', acknowledged: true },
          ],
        } as any,
        actor,
      );

      expect(res.addedResponderIds).toEqual([]);
      expect(existing.acknowledgedAt).toBeInstanceOf(Date);
      expect(d.incidentsRepo.createResponder).not.toHaveBeenCalled();
    });

    it('publishes communications with their timeline entry', async () => {
      const d = build();
      d.incidentsRepo.findIncidentForUpdate.mockResolvedValue(liveIncident());

      const res = await d.service.updateIncident(
        INCIDENT,
        {
          transition: 'UPDATE',
          communications: [
            {
              type: 'STATUS_UPDATE',
              audience: 'CUSTOMERS',
              messageText: 'seguimos en ello',
            },
          ],
        } as any,
        actor,
      );

      expect(res.communicationIds).toEqual(['communication-1']);
      expect(d.incidentsRepo.createCommunication).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          communicationTypeConceptId: CONCEPTS.COMM_TYPE_STATUS_UPDATE,
          audienceConceptId: CONCEPTS.COMM_AUDIENCE_CUSTOMERS,
        }),
      );
    });

    it('records a plain note without moving the state', async () => {
      const d = build();
      const incident = liveIncident();
      d.incidentsRepo.findIncidentForUpdate.mockResolvedValue(incident);

      const res = await d.service.updateIncident(
        INCIDENT,
        { transition: 'UPDATE', summary: 'seguimos investigando' } as any,
        actor,
      );

      expect(res.statusConceptId).toBe(CONCEPTS.INCIDENT_OPEN);
      expect(res.timelineEventIds).toHaveLength(1);
    });

    it('refuses touching a resolved incident', async () => {
      const d = build();
      d.incidentsRepo.findIncidentForUpdate.mockResolvedValue(
        liveIncident({ statusConceptId: CONCEPTS.INCIDENT_RESOLVED }),
      );

      await expect(
        d.service.updateIncident(
          INCIDENT,
          { transition: 'UPDATE' } as any,
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('fails when the incident does not exist', async () => {
      const d = build();
      d.incidentsRepo.findIncidentForUpdate.mockResolvedValue(null);

      await expect(
        d.service.updateIncident(
          INCIDENT,
          { transition: 'UPDATE' } as any,
          actor as any,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('openPostmortem (UC-46-08)', () => {
    const dto: any = {
      title: 'Caída del gateway',
      ownerUserId: OWNER,
      actionItems: [
        {
          actionCode: 'AI-1',
          description: 'Añadir alerta de saturación',
          actionType: 'DETECTIVE',
          ownerUserId: OWNER,
          priority: 'HIGH',
        },
      ],
    };

    function resolvedIncident(overrides: Record<string, unknown> = {}): any {
      return {
        id: INCIDENT,
        serviceComponentId: COMPONENT,
        statusConceptId: CONCEPTS.INCIDENT_RESOLVED,
        rootCauseText: 'fuga de conexiones',
        ...overrides,
      };
    }

    it('opens the postmortem with its actions and improvements', async () => {
      const d = build();
      d.incidentsRepo.findIncidentForUpdate.mockResolvedValue(
        resolvedIncident(),
      );

      const res = await d.service.openPostmortem(INCIDENT, dto, actor);

      expect(res).toEqual({
        id: 'postmortem-1',
        statusConceptId: CONCEPTS.POSTMORTEM_DRAFT,
        actionItemIds: ['action-1'],
        improvementItemIds: ['improvement-1'],
      });
      expect(d.improvementsRepo.createImprovementItem).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          sourceTypeConceptId: CONCEPTS.IMPROVEMENT_SOURCE_POSTMORTEM,
          priorityConceptId: CONCEPTS.IMPROVEMENT_PRIORITY_HIGH,
        }),
      );
    });

    it('takes the root cause from the incident when the postmortem omits it', async () => {
      const d = build();
      d.incidentsRepo.findIncidentForUpdate.mockResolvedValue(
        resolvedIncident(),
      );

      await d.service.openPostmortem(INCIDENT, dto, actor);

      expect(d.incidentsRepo.createPostmortem).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ rootCauseSummary: 'fuga de conexiones' }),
      );
    });

    it('defaults the improvement priority to medium', async () => {
      const d = build();
      d.incidentsRepo.findIncidentForUpdate.mockResolvedValue(
        resolvedIncident(),
      );

      await d.service.openPostmortem(
        INCIDENT,
        {
          ...dto,
          actionItems: [{ ...dto.actionItems[0], priority: undefined }],
        },
        actor,
      );

      expect(d.improvementsRepo.createImprovementItem).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          priorityConceptId: CONCEPTS.IMPROVEMENT_PRIORITY_MEDIUM,
        }),
      );
    });

    it('rejects a repeated action code', async () => {
      const d = build();

      await expect(
        d.service.openPostmortem(
          INCIDENT,
          { ...dto, actionItems: [dto.actionItems[0], dto.actionItems[0]] },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('refuses a postmortem on an incident that is not resolved', async () => {
      const d = build();
      d.incidentsRepo.findIncidentForUpdate.mockResolvedValue(
        resolvedIncident({ statusConceptId: CONCEPTS.INCIDENT_MITIGATED }),
      );

      await expect(
        d.service.openPostmortem(INCIDENT, dto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('refuses a second postmortem for the same incident', async () => {
      const d = build();
      d.incidentsRepo.findIncidentForUpdate.mockResolvedValue(
        resolvedIncident(),
      );
      d.incidentsRepo.findPostmortemByIncident.mockResolvedValue({
        id: 'postmortem-prev',
      });

      await expect(
        d.service.openPostmortem(INCIDENT, dto, actor as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('fails when the incident does not exist', async () => {
      const d = build();
      d.incidentsRepo.findIncidentForUpdate.mockResolvedValue(null);

      await expect(
        d.service.openPostmortem(INCIDENT, dto, actor as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });
});
