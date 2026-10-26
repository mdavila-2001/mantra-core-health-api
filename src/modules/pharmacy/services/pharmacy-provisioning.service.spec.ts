import { jest } from '@jest/globals';
// Alias con tipado laxo: evita el 'never' que @jest/globals infiere para jest.fn() en ESM.
const fn = jest.fn as unknown as (impl?: (...a: any[]) => any) => any;
import { PharmacyProvisioningService } from './pharmacy-provisioning.service';
import { PRAC } from '../../practice/practice.concepts';
import { PHARM } from '../pharmacy.concepts';
import { CONCEPTS } from '../../../common';

const OWNER = {
  tenantId: 'tenant-1',
  code: 'FARM-1023456029',
  legalName: 'Farmacia Central S.R.L.',
  tradeName: 'Farmacia Central',
  ownerUserId: 'owner-1',
  timeZone: 'America/La_Paz',
};

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: fn().mockResolvedValue(undefined) };
  const pharmacy: { id: string; primaryPracticeSiteId?: string } = {
    id: 'pharmacy-1',
  };
  const pharmaciesRepo = { create: fn(() => pharmacy) };
  let pharmacySiteSeq = 0;
  const pharmacySitesRepo = {
    create: fn(() => ({ id: `pharmacy-site-${++pharmacySiteSeq}` })),
  };
  const practicesRepo = { create: fn(() => ({ id: 'practice-1' })) };
  let practiceSiteSeq = 0;
  const practiceSitesRepo = {
    create: fn(() => ({ id: `practice-site-${++practiceSiteSeq}` })),
  };
  let addressSeq = 0;
  const addressesRepo = {
    create: fn(() => ({ id: `address-${++addressSeq}` })),
  };
  const categories = { provisionDefaults: fn().mockResolvedValue(undefined) };
  const logger = { setContext: fn(), info: fn(), warn: fn(), error: fn() };

  const service = new PharmacyProvisioningService(
    pharmaciesRepo as never,
    pharmacySitesRepo as never,
    practicesRepo as never,
    practiceSitesRepo as never,
    addressesRepo as never,
    categories as never,
    logger as never,
  );
  return {
    categories,
    service,
    tx,
    pharmacy,
    pharmaciesRepo,
    pharmacySitesRepo,
    practicesRepo,
    practiceSitesRepo,
    addressesRepo,
  };
}

describe('PharmacyProvisioningService', () => {
  it('crea la farmacia en borrador y sin verificar, con el código del tenant', async () => {
    const d = build();

    await d.service.provision(
      d.tx as never,
      OWNER,
      { headquarters: { name: 'Casa central' } },
      OWNER.ownerUserId,
    );

    expect(d.pharmaciesRepo.create).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        tenantId: 'tenant-1',
        code: 'FARM-1023456029',
        legalName: 'Farmacia Central S.R.L.',
        statusConceptId: PHARM.PHARMACY_DRAFT,
        verificationStatusConceptId: PHARM.VERIFICATION_PENDING,
        actorUserId: 'owner-1',
      }),
    );
  });

  it('siembra las categorías por defecto del catálogo en la misma transacción (P47)', async () => {
    const d = build();

    await d.service.provision(
      d.tx as never,
      OWNER,
      { headquarters: { name: 'Casa central' } },
      OWNER.ownerUserId,
    );

    expect(d.categories.provisionDefaults).toHaveBeenCalledWith(
      d.tx,
      'pharmacy-1',
      'owner-1',
    );
  });

  it('crea la práctica propia de tipo farmacia con el owner como administrador', async () => {
    const d = build();

    await d.service.provision(
      d.tx as never,
      OWNER,
      { headquarters: { name: 'Casa central' } },
      OWNER.ownerUserId,
    );

    expect(d.practicesRepo.create).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        tenantId: 'tenant-1',
        typeConceptId: PRAC.PRACTICE_TYPE_PHARMACY,
        adminUserId: 'owner-1',
        name: 'Farmacia Central',
      }),
    );
  });

  it('enlaza la casa central en primaryPracticeSiteId y la crea como sede dispensadora', async () => {
    const d = build();

    const res = await d.service.provision(
      d.tx as never,
      OWNER,
      {
        headquarters: {
          name: 'Casa central',
          addressLines: 'Av. Cristo Redentor 1234',
          latitude: -17.78,
          longitude: -63.18,
        },
      },
      OWNER.ownerUserId,
    );

    expect(res).toEqual({
      pharmacyId: 'pharmacy-1',
      practiceId: 'practice-1',
      headquartersPracticeSiteId: 'practice-site-1',
      headquartersPharmacySiteId: 'pharmacy-site-1',
      branchPharmacySiteIds: [],
    });
    expect(d.pharmacy.primaryPracticeSiteId).toBe('practice-site-1');
    expect(d.addressesRepo.create).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        ownerTypeConceptId: CONCEPTS.OWNER_TENANT,
        ownerId: 'tenant-1',
        lines: 'Av. Cristo Redentor 1234',
        latitude: '-17.78',
        longitude: '-63.18',
      }),
    );
    expect(d.practiceSitesRepo.create).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        practiceId: 'practice-1',
        code: 'CASA-CENTRAL',
        name: 'Casa central',
        addressId: 'address-1',
        managingTenantId: 'tenant-1',
        timeZone: 'America/La_Paz',
      }),
    );
    expect(d.pharmacySitesRepo.create).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        pharmacyId: 'pharmacy-1',
        practiceSiteId: 'practice-site-1',
        code: 'CASA-CENTRAL',
        pharmacySiteTypeConceptId: PHARM.SITE_TYPE_DISPENSING,
        statusConceptId: PHARM.SITE_ACTIVE,
      }),
    );
  });

  it('sin dirección ni punto, la central nace sin fila de dirección', async () => {
    const d = build();

    await d.service.provision(
      d.tx as never,
      OWNER,
      { headquarters: { name: 'Casa central', addressLines: '   ' } },
      OWNER.ownerUserId,
    );

    expect(d.addressesRepo.create).not.toHaveBeenCalled();
    expect(d.practiceSitesRepo.create).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({ addressId: undefined }),
    );
  });

  it('acepta la coordenada 0 (no la confunde con ausencia)', async () => {
    const d = build();

    await d.service.provision(
      d.tx as never,
      OWNER,
      { headquarters: { name: 'Casa central', latitude: 0, longitude: 0 } },
      OWNER.ownerUserId,
    );

    expect(d.addressesRepo.create).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        latitude: '0',
        longitude: '0',
        lines: undefined,
      }),
    );
  });

  it('cada sucursal es otra sede de práctica y otra sede dispensadora, con código propio', async () => {
    const d = build();

    const res = await d.service.provision(
      d.tx as never,
      OWNER,
      {
        headquarters: { name: 'Casa central' },
        branches: [
          { name: 'Sucursal Equipetrol', latitude: -17.76, longitude: -63.19 },
          { name: 'Sucursal Equipetrol', latitude: -17.75, longitude: -63.2 },
        ],
      },
      OWNER.ownerUserId,
    );

    expect(res.branchPharmacySiteIds).toEqual([
      'pharmacy-site-2',
      'pharmacy-site-3',
    ]);
    const codes = d.pharmacySitesRepo.create.mock.calls.map(
      (call: unknown[]) => (call[1] as { code: string }).code,
    );
    expect(codes).toEqual([
      'CASA-CENTRAL',
      'SUCURSAL-EQUIPETROL',
      'SUCURSAL-EQUIPETROL-2',
    ]);
    // La central sigue siendo la primera: las sucursales no la pisan.
    expect(d.pharmacy.primaryPracticeSiteId).toBe('practice-site-1');
  });
});
