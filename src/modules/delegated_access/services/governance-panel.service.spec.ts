import { GovernancePanelService } from './governance-panel.service';
import { DELEG } from '../delegated_access.concepts';
import {
  NOW,
  engagement,
  fakeEm,
  grant,
  ids,
  mockFn,
  worldOf,
} from './governance-world.testing';

const doctor: any = {
  id: ids.perez,
  roles: ['PRACTITIONER'],
  practitionerProfileId: ids.perez,
};

function build() {
  const em = fakeEm();
  const world = worldOf([
    engagement({
      engagementId: 'e-ana',
      subjectUserId: ids.ana,
      acceptedPractitionerProfileIds: [ids.perez],
      grants: [grant({ grantId: 'g1', actions: ['agenda.appointment.view'] })],
    }),
    engagement({
      engagementId: 'e-otro',
      subjectUserId: ids.marcos,
      acceptedPractitionerProfileIds: ['otro-doctor'],
      grants: [grant({ grantId: 'g2', actions: ['agenda.appointment.view'] })],
    }),
  ]);
  const loader = { load: mockFn().mockResolvedValue(world) };
  const queries: any = {
    pendingItemIdsOfReviewer: mockFn().mockResolvedValue(['i1', 'i2']),
  };
  const anomalies: any = {
    findByTenant: mockFn().mockResolvedValue([
      {
        id: 'a1',
        userId: ids.ana,
        kindConceptId: DELEG.ANOMALY_SEARCH_SPIKE,
        windowStart: NOW,
        observedValue: '18.00',
        thresholdValue: '15.00',
      },
      {
        id: 'a2',
        userId: ids.marcos,
        kindConceptId: DELEG.ANOMALY_SEARCH_SPIKE,
        windowStart: NOW,
        observedValue: '20.00',
        thresholdValue: '15.00',
      },
    ]),
  };
  const scope = { resolveTenant: mockFn().mockReturnValue(ids.tenant) };
  const service = new GovernancePanelService(
    em,
    loader as any,
    queries,
    anomalies,
    scope as any,
  );
  return { service };
}

describe('GovernancePanelService.panel («Mi equipo» del doctor)', () => {
  it('muestra solo a quienes lo aceptaron a él, sus revisiones pendientes y las anomalías de su equipo', async () => {
    const { service } = build();
    const r = await service.panel(doctor);
    expect(r.team.map((t: any) => t.userId)).toEqual([ids.ana]);
    expect(r.pendingReviews).toBe(2);
    expect(r.openAnomalies.map((a: any) => a.id)).toEqual(['a1']);
    expect(JSON.stringify(r)).not.toContain(ids.marcos);
  });

  it('sin perfil de doctor en el token responde vacío (nunca la organización entera)', async () => {
    const { service } = build();
    const r = await service.panel({
      id: ids.perez,
      roles: ['CLINICIAN'],
    } as any);
    expect(r.team).toEqual([]);
    expect(r.openAnomalies).toEqual([]);
  });
});
