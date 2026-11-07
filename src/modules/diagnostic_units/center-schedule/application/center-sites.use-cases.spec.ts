import { describe, expect, it } from '@jest/globals';
import { runWithTenant } from '../../../../common';
import { DiagnosticUnitsErrorReason } from '../../diagnostic_units.error-reasons';
import {
  actor,
  build,
  mainSite,
  ORDER_ID,
  RESOURCE_ID,
  SITE_ID,
  TENANT,
  UNIT_ID,
} from './center-schedule.testing';

/**
 * Each site (branch) of a center has its own schedule, devices and bookable
 * resource; without `siteId` everything stays on the main site, as before.
 */
const NORTH = 'b6a1c2d3-0000-4000-8000-000000000002';
const NORTH_RESOURCE = 'b6a1c2d3-0000-4000-8000-0000000000aa';

function twoSites() {
  const d = build();
  d.scheduleRepo.findSites.mockResolvedValue([
    mainSite(),
    mainSite({
      site_id: NORTH,
      site_name: 'Sucursal Norte',
      is_primary: false,
      address_text: 'Av. Banzer 500, Santa Cruz',
    }),
  ]);
  d.scheduleRepo.findResource.mockImplementation(async (...args: unknown[]) => {
    const site = args[2] as { site_id: string } | null;
    return site?.site_id === NORTH
      ? { id: NORTH_RESOURCE, time_zone: 'America/La_Paz' }
      : { id: RESOURCE_ID, time_zone: 'America/La_Paz' };
  });
  return d;
}

describe('per-site center schedule', () => {
  it('without siteId the view is the main site, and lists every site main first', async () => {
    const d = twoSites();
    const view = await runWithTenant(TENANT, () => d.reader.forMe());
    expect(view.siteId).toBe(SITE_ID);
    expect(view.siteName).toBe('Sede central');
    expect(view.sites).toEqual([
      expect.objectContaining({ siteId: SITE_ID, main: true }),
      expect.objectContaining({
        siteId: NORTH,
        name: 'Sucursal Norte',
        main: false,
      }),
    ]);
    // The main site may fall back to the legacy unit-level resource.
    expect(d.scheduleRepo.findResource).toHaveBeenCalledWith(d.em, UNIT_ID, {
      site_id: SITE_ID,
      main: true,
    });
  });

  it('a secondary site reads only its own resource and its own devices', async () => {
    const d = twoSites();
    const view = await runWithTenant(TENANT, () => d.reader.forMe(NORTH));
    expect(view.siteId).toBe(NORTH);
    expect(d.scheduleRepo.findResource).toHaveBeenCalledWith(d.em, UNIT_ID, {
      site_id: NORTH,
      main: false,
    });
    expect(d.scheduleRepo.findEquipment).toHaveBeenCalledWith(
      d.em,
      UNIT_ID,
      NORTH,
    );
  });

  it('a site of another center is 404, never the main one silently', async () => {
    const d = twoSites();
    await expect(
      runWithTenant(TENANT, () =>
        d.reader.forMe('99999999-0000-4000-8000-000000000009'),
      ),
    ).rejects.toMatchObject({
      reason: DiagnosticUnitsErrorReason.DIAGNOSTIC_UNIT_RESOURCE_OUT_OF_SCOPE,
    });
  });

  it('publishing a secondary site creates its own resource and leaves the main one alone', async () => {
    const d = twoSites();
    d.scheduleRepo.findResource.mockResolvedValue(null);
    await runWithTenant(TENANT, () =>
      d.saver.execute(
        UNIT_ID,
        {
          general: {
            windows: [{ dayOfWeek: 2, startTime: '08:00', endTime: '12:00' }],
            slotMinutes: 30,
          },
          modalities: [],
          studies: [],
        },
        actor,
        NORTH,
      ),
    );
    expect(d.scheduleRepo.createResource).toHaveBeenCalledWith(
      d.em,
      expect.objectContaining({ id: UNIT_ID }),
      expect.objectContaining({ site_id: NORTH }),
      'America/La_Paz',
      actor.id,
    );
  });

  it('the patient gets one booking option per site, each with its address', async () => {
    const d = twoSites();
    const res = await d.options.execute(actor, ORDER_ID);
    expect(res.options).toEqual([
      expect.objectContaining({
        unitId: UNIT_ID,
        siteId: SITE_ID,
        siteName: 'Sede central',
      }),
      expect.objectContaining({
        unitId: UNIT_ID,
        siteId: NORTH,
        siteName: 'Sucursal Norte',
        addressText: 'Av. Banzer 500, Santa Cruz',
      }),
    ]);
  });
});
