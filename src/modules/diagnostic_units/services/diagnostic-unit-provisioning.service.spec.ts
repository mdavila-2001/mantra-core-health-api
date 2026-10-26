import { jest } from '@jest/globals';
// Alias con tipado laxo: evita el 'never' que @jest/globals infiere para jest.fn() en ESM.
const fn = jest.fn as unknown as (impl?: (...a: any[]) => any) => any;
import { DiagnosticUnitProvisioningService } from './diagnostic-unit-provisioning.service';
import { PRAC } from '../../practice/practice.concepts';
import { DUNIT } from '../diagnostic_units.concepts';
import { CONCEPTS } from '../../../common';

const OWNER = {
  tenantId: 'tenant-1',
  tenantCode: 'CENTRO_Z',
  legalName: 'Centro de Diagnóstico Z',
  ownerUserId: 'owner-1',
};

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: fn().mockResolvedValue(undefined) };
  const practicesRepo = { create: fn(() => ({ id: 'practice-1' })) };
  const sitesRepo = {
    findByPracticeAndCode: fn().mockResolvedValue(null),
    create: fn(() => ({ id: 'site-1' })),
  };
  const addressesRepo = { create: fn(() => ({ id: 'address-1' })) };
  const unitsRepo = { create: fn(() => ({ id: 'unit-1' })) };
  const unitSitesRepo = { create: fn(() => ({ id: 'unit-site-1' })) };
  const offeringsRepo = {
    create: fn((_tx: unknown, data: { studyCode: string }) => ({
      id: `offering-${data.studyCode}`,
    })),
  };
  const logger = { setContext: fn(), info: fn(), warn: fn(), error: fn() };

  const service = new DiagnosticUnitProvisioningService(
    practicesRepo as never,
    sitesRepo as never,
    addressesRepo as never,
    unitsRepo as never,
    unitSitesRepo as never,
    offeringsRepo as never,
    logger as never,
  );
  return {
    service,
    tx,
    practicesRepo,
    sitesRepo,
    addressesRepo,
    unitsRepo,
    unitSitesRepo,
    offeringsRepo,
  };
}

describe('DiagnosticUnitProvisioningService', () => {
  describe('provision', () => {
    it('crea la práctica, la sede primaria, la unidad y la sede de unidad, en ese orden', async () => {
      const d = build();

      const res = await d.service.provision(
        d.tx as never,
        OWNER,
        {},
        OWNER.ownerUserId,
      );

      expect(d.practicesRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          tenantId: OWNER.tenantId,
          code: OWNER.tenantCode,
          name: OWNER.legalName,
          typeConceptId: PRAC.PRACTICE_TYPE_DIAGNOSTIC_CENTER,
          adminUserId: OWNER.ownerUserId,
          statusConceptId: PRAC.PRACTICE_ACTIVE,
          actorUserId: OWNER.ownerUserId,
        }),
      );
      expect(d.sitesRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          practiceId: 'practice-1',
          name: 'Sede central',
          siteTypeConceptId: PRAC.SITE_TYPE_OFFICE,
          operationalStatusConceptId: PRAC.SITE_OP_PLANNED,
          managingTenantId: OWNER.tenantId,
          statusConceptId: PRAC.SITE_ACTIVE,
        }),
      );
      expect(d.unitsRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          tenantId: OWNER.tenantId,
          code: OWNER.tenantCode,
          name: OWNER.legalName,
          // Sin tipo ni modalidades de imagen, la unidad es de laboratorio
          // (P51, D-1): antes era imágenes por omisión.
          diagnosticUnitTypeConceptId: DUNIT.UNIT_TYPE_LABORATORY,
          ownershipTypeConceptId: DUNIT.OWNERSHIP_PRIVATE,
          practiceId: 'practice-1',
          primaryPracticeSiteId: 'site-1',
          acceptsExternalOrders: true,
          walkInAvailable: true,
          homeCollectionAvailable: false,
        }),
      );
      expect(d.unitSitesRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          diagnosticUnitId: 'unit-1',
          practiceSiteId: 'site-1',
          siteRoleConceptId: DUNIT.SITE_ROLE_PRIMARY,
          imagingAvailable: undefined,
          sampleCollectionAvailable: true,
        }),
      );
      expect(res).toMatchObject({
        unitId: 'unit-1',
        practiceId: 'practice-1',
        siteId: 'site-1',
        addressId: undefined,
        offeringIds: [],
      });
    });

    it('sin tipo declarado, una modalidad de imagen hace la unidad de imágenes (P51, D-1)', async () => {
      const d = build();

      await d.service.provision(
        d.tx as never,
        OWNER,
        {
          modalityConceptIds: [DUNIT.MODALITY_LABORATORY, DUNIT.MODALITY_XRAY],
        },
        OWNER.ownerUserId,
      );

      expect(d.unitsRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          diagnosticUnitTypeConceptId: DUNIT.UNIT_TYPE_IMAGING,
        }),
      );
      expect(d.unitSitesRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          siteRoleConceptId: DUNIT.SITE_ROLE_PRIMARY,
          imagingAvailable: true,
          sampleCollectionAvailable: undefined,
        }),
      );
    });

    it('sin tipo declarado, sólo la modalidad de laboratorio hace la unidad de laboratorio (P51, D-1)', async () => {
      const d = build();

      await d.service.provision(
        d.tx as never,
        OWNER,
        { modalityConceptIds: [DUNIT.MODALITY_LABORATORY] },
        OWNER.ownerUserId,
      );

      expect(d.unitsRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          diagnosticUnitTypeConceptId: DUNIT.UNIT_TYPE_LABORATORY,
        }),
      );
    });

    it('usa el código, el nombre y el tipo declarados en vez de los defaults', async () => {
      const d = build();

      await d.service.provision(
        d.tx as never,
        OWNER,
        {
          code: 'IMAGEN_CENTRAL',
          name: 'Centro de Imágenes Central',
          diagnosticUnitTypeConceptId: DUNIT.UNIT_TYPE_LABORATORY,
        },
        OWNER.ownerUserId,
      );

      expect(d.practicesRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          code: 'IMAGEN_CENTRAL',
          name: 'Centro de Imágenes Central',
        }),
      );
      expect(d.unitsRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          diagnosticUnitTypeConceptId: DUNIT.UNIT_TYPE_LABORATORY,
        }),
      );
      // Laboratorio: toma de muestras, no imágenes.
      expect(d.unitSitesRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          imagingAvailable: undefined,
          sampleCollectionAvailable: true,
        }),
      );
    });

    it('no crea dirección cuando el perfil no declara sede primaria', async () => {
      const d = build();

      const res = await d.service.provision(
        d.tx as never,
        OWNER,
        {},
        OWNER.ownerUserId,
      );

      expect(d.addressesRepo.create).not.toHaveBeenCalled();
      expect(d.sitesRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ addressId: undefined }),
      );
      expect(res.addressId).toBeUndefined();
    });

    it('crea la dirección de la sede primaria, con las líneas recortadas y las coordenadas como texto', async () => {
      const d = build();

      const res = await d.service.provision(
        d.tx as never,
        OWNER,
        {
          primarySite: {
            name: 'Sede Santa Cruz',
            address: {
              lines: ['  Av. San Martín 123  ', '  ', 'Piso 2'],
              city: 'Santa Cruz',
              municipalityConceptId: 'mun-1',
              latitude: -17.78,
              longitude: -63.18,
            },
          },
        },
        OWNER.ownerUserId,
      );

      expect(d.addressesRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          ownerTypeConceptId: CONCEPTS.OWNER_USER,
          ownerId: OWNER.ownerUserId,
          lines: 'Av. San Martín 123\nPiso 2',
          city: 'Santa Cruz',
          municipalityConceptId: 'mun-1',
          countryConceptId: CONCEPTS.COUNTRY_BO,
          useConceptId: CONCEPTS.ADDR_USE_WORK,
          typeConceptId: CONCEPTS.ADDR_TYPE_POSTAL,
          latitude: '-17.78',
          longitude: '-63.18',
        }),
      );
      expect(d.sitesRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          name: 'Sede Santa Cruz',
          addressId: 'address-1',
        }),
      );
      expect(res.addressId).toBe('address-1');
    });

    it('crea una oferta activa por cada modalidad declarada, con el rótulo en castellano', async () => {
      const d = build();

      const res = await d.service.provision(
        d.tx as never,
        OWNER,
        { modalityConceptIds: [DUNIT.MODALITY_XRAY, DUNIT.MODALITY_MRI] },
        OWNER.ownerUserId,
      );

      expect(d.offeringsRepo.create).toHaveBeenCalledTimes(2);
      expect(d.offeringsRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          diagnosticUnitId: 'unit-1',
          diagnosticUnitSiteId: 'unit-site-1',
          studyCode: 'MODALITY_XRAY',
          studyConceptId: DUNIT.STUDY_GENERIC,
          modalityConceptId: DUNIT.MODALITY_XRAY,
          displayName: 'Rayos X',
        }),
      );
      expect(d.offeringsRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          studyCode: 'MODALITY_MRI',
          modalityConceptId: DUNIT.MODALITY_MRI,
          displayName: 'Resonancia magnética',
        }),
      );
      expect(res.offeringIds).toEqual([
        'offering-MODALITY_XRAY',
        'offering-MODALITY_MRI',
      ]);
    });

    it('sin modalidades declaradas, no crea ninguna oferta', async () => {
      const d = build();

      const res = await d.service.provision(
        d.tx as never,
        OWNER,
        {},
        OWNER.ownerUserId,
      );

      expect(d.offeringsRepo.create).not.toHaveBeenCalled();
      expect(res.offeringIds).toEqual([]);
    });

    it('resuelve un choque de código de sede con un sufijo numérico', async () => {
      const d = build();
      d.sitesRepo.findByPracticeAndCode
        .mockResolvedValueOnce({ id: 'existing' })
        .mockResolvedValueOnce(null);

      await d.service.provision(
        d.tx as never,
        OWNER,
        { primarySite: { name: 'Sede central' } },
        OWNER.ownerUserId,
      );

      expect(d.sitesRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ code: 'SEDE-CENTRAL-2' }),
      );
    });

    it('deriva el código de la unidad de la razón social cuando no hay código de tenant ni declarado', async () => {
      const d = build();

      await d.service.provision(
        d.tx as never,
        { ...OWNER, tenantCode: undefined },
        {},
        OWNER.ownerUserId,
      );

      expect(d.practicesRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ code: 'CENTRO-DE-DIAGNOSTICO-Z' }),
      );
    });

    it('flushea al padre antes de crear cada fila dependiente', async () => {
      const d = build();

      await d.service.provision(
        d.tx as never,
        OWNER,
        {
          primarySite: { address: { lines: ['Av. Siempre Viva 742'] } },
          modalityConceptIds: [DUNIT.MODALITY_XRAY],
        },
        OWNER.ownerUserId,
      );

      // Práctica, dirección, sede, unidad, sede de unidad y la oferta: seis
      // filas con FK a la anterior.
      expect(d.tx.flush).toHaveBeenCalledTimes(6);
    });

    it('crea cada sucursal como sede de práctica y sede de unidad con rol de toma de muestras', async () => {
      const d = build();
      let n = 0;
      d.sitesRepo.create.mockImplementation(() => ({ id: `site-${++n}` }));

      const res = await d.service.provision(
        d.tx as never,
        OWNER,
        {
          diagnosticUnitTypeConceptId: DUNIT.UNIT_TYPE_LABORATORY,
          branches: [
            {
              name: 'Sucursal Norte',
              address: {
                lines: ['Av. Banzer 100'],
                latitude: -17.7,
                longitude: -63.1,
              },
            },
            { name: 'Sucursal Sur' },
          ],
        },
        OWNER.ownerUserId,
      );

      // central + 2 sucursales
      expect(d.sitesRepo.create).toHaveBeenCalledTimes(3);
      expect(d.sitesRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          practiceId: 'practice-1',
          name: 'Sucursal Norte',
        }),
      );
      expect(d.addressesRepo.create).toHaveBeenCalledTimes(1);
      expect(d.unitSitesRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          practiceSiteId: 'site-3',
          siteRoleConceptId: DUNIT.SITE_ROLE_COLLECTION,
          sampleCollectionAvailable: true,
        }),
      );
      expect(res.siteId).toBe('site-1');
      expect(res.branchSiteIds).toEqual(['site-2', 'site-3']);
    });
  });
});
