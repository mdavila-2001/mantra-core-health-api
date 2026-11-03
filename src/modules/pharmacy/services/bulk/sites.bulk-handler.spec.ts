import { jest } from '@jest/globals';
import { BulkRowRejection } from './bulk-handler';
import { SitesBulkHandler } from './sites.bulk-handler';
import { PharmacySitesService } from '../pharmacy-sites.service';

const CTX = {
  pharmacy: {
    id: 'pharmacy-1',
    tenantId: 'tenant-1',
    code: 'FAR',
    legalName: 'Farmacia SRL',
    primaryPracticeSiteId: 'ps-central',
  },
  actor: { id: 'user-1' },
} as any;

function build(options: { practiceClash?: boolean } = {}) {
  const created = {
    id: 'site-new',
    pickupAvailable: undefined,
    homeDeliveryAvailable: undefined,
  } as any;
  const sitesRepo = { findByPharmacyAndCode: jest.fn(async () => created) };
  const practiceSitesRepo = {
    findById: jest.fn(async () => ({
      id: 'ps-central',
      practiceId: 'practice-1',
      timeZone: 'America/La_Paz',
    })),
    findByPracticeAndCode: jest.fn(async () =>
      options.practiceClash ? { id: 'x' } : null,
    ),
  };
  const provisioning = {
    addSite: jest.fn(async () => ({
      practiceSiteId: 'ps-new',
      pharmacySiteId: 'site-new',
    })),
  };
  const logger = { setContext: jest.fn() };
  const sites = new PharmacySitesService(
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    logger as any,
  );
  const handler = new SitesBulkHandler(
    sitesRepo as any,
    practiceSitesRepo as any,
    provisioning as any,
    sites,
  );
  const tx = { flush: jest.fn(async () => undefined) };
  return { handler, provisioning, created, tx };
}

describe('SitesBulkHandler', () => {
  it('creates the practice site + sales site chain with the same code, like the sign-up', async () => {
    const d = build();
    const row = {
      code: 'SUR',
      name: 'Sucursal Sur',
      addressLines: 'Av. Ejemplo 123',
      latitude: -17.78,
      longitude: -63.18,
      pickupAvailable: true,
    };
    await expect(d.handler.create(d.tx as any, CTX, row)).resolves.toBe(
      'site-new',
    );
    expect(d.provisioning.addSite).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        tenantId: 'tenant-1',
        timeZone: 'America/La_Paz',
      }),
      'practice-1',
      'pharmacy-1',
      {
        name: 'Sucursal Sur',
        addressLines: 'Av. Ejemplo 123',
        latitude: -17.78,
        longitude: -63.18,
      },
      'SUR',
      'user-1',
    );
    expect(d.created.pickupAvailable).toBe(true);
  });

  it('a practice site with the same code in the organization → ALREADY_EXISTS', async () => {
    const d = build({ practiceClash: true });
    await expect(
      d.handler.create(d.tx as any, CTX, { code: 'SUR', name: 'Sur' }),
    ).rejects.toBeInstanceOf(BulkRowRejection);
    expect(d.provisioning.addSite).not.toHaveBeenCalled();
  });

  it('latitude without longitude is rejected', async () => {
    const d = build();
    const rejection = await d.handler
      .create(d.tx as any, CTX, { code: 'SUR', name: 'Sur', latitude: -17.7 })
      .catch((e: BulkRowRejection) => e);
    expect((rejection as BulkRowRejection).errors[0]).toEqual(
      expect.objectContaining({
        field: 'longitude',
        reason: 'COORDINATES_INCOMPLETE',
      }),
    );
  });

  it('changes the name and pickup/delivery; the same values are UNCHANGED', async () => {
    const d = build();
    const site = {
      id: 'site-1',
      name: 'Sucursal Sur',
      pickupAvailable: false,
      homeDeliveryAvailable: false,
    } as any;
    await expect(
      d.handler.update(d.tx as any, CTX, site, {
        code: 'SUR',
        name: 'Sucursal Sur 2',
        pickupAvailable: true,
      }),
    ).resolves.toEqual({ id: 'site-1', changed: true });
    expect(site).toEqual(
      expect.objectContaining({
        name: 'Sucursal Sur 2',
        pickupAvailable: true,
      }),
    );
    await expect(
      d.handler.update(d.tx as any, CTX, site, {
        code: 'SUR',
        name: 'Sucursal Sur 2',
      }),
    ).resolves.toEqual({ id: 'site-1', changed: false });
  });
});
