import { jest } from '@jest/globals';
// Alias con tipado laxo: evita el 'never' que @jest/globals infiere para jest.fn() en ESM.
const fn = jest.fn as unknown as (impl?: (...a: any[]) => any) => any;
import { TenantTypeProfileService } from './tenant-type-profile.service';
import { PreconditionFailedException } from '../../../common';
import { INS } from '../../insurance/insurance.concepts';
import { DUNIT } from '../../diagnostic_units/diagnostic_units.concepts';
import { TERRITORIAL_TENANT_TYPES } from '../directory.concepts';

describe('TenantTypeProfileService', () => {
  /**
   * Construye el sistema bajo prueba con dependencias controladas.
   * @returns Resultado de build.
   */
  function build() {
    const catalogRepo = {
      createCarrier: fn(() => ({ id: 'carrier-1' })),
      createBroker: fn(() => ({ id: 'broker-1' })),
    };
    // Por defecto el catálogo reconoce todo lo que se le pregunta; los tests que
    // ejercen el rechazo devuelven un mapa vacío.
    const conceptsRepo = {
      findByIds: fn(
        async (_em: unknown, ids: string[]) =>
          new Map(ids.map((id) => [id, { id }])),
      ),
    };
    const diagnosticUnitProvisioning = {
      provision: fn(async () => ({
        unitId: 'diagnostic-unit-1',
        practiceId: 'practice-1',
        siteId: 'site-1',
        offeringIds: [],
      })),
    };
    const service = new TenantTypeProfileService(
      catalogRepo as never,
      conceptsRepo as never,
      diagnosticUnitProvisioning as never,
    );
    return {
      service,
      catalogRepo,
      conceptsRepo,
      diagnosticUnitProvisioning,
      tx: {} as never,
    };
  }

  describe('assertProfileMatchesType', () => {
    it('exige el bloque payer cuando el tipo es PAYER', () => {
      const { service } = build();

      expect(() =>
        service.assertProfileMatchesType({
          tenantType: 'PAYER',
          legalName: 'Aseguradora X',
        }),
      ).toThrow(PreconditionFailedException);
    });

    it('exige el bloque broker cuando el tipo es BROKER', () => {
      const { service } = build();

      expect(() =>
        service.assertProfileMatchesType({
          tenantType: 'BROKER',
          legalName: 'Corredora Y',
        }),
      ).toThrow(PreconditionFailedException);
    });

    it('exige país y jurisdicción en todos los tipos territoriales', () => {
      const { service } = build();

      // No solo PROVIDER: una universidad, una farmacia o un hospital también
      // operan bajo un regulador, y sin jurisdicción no se sabe cuál.
      for (const tenantType of TERRITORIAL_TENANT_TYPES) {
        expect(() =>
          service.assertProfileMatchesType({
            tenantType,
            legalName: 'Institución Z',
            countryConceptId: 'country-1',
          }),
        ).toThrow(PreconditionFailedException);
      }
    });

    it('acepta los ocho tipos nuevos con país y jurisdicción', () => {
      const { service } = build();

      // El alta de una universidad, una farmacia o un consultorio no puede
      // quedar fuera solo porque el enum se quedó en PROVIDER/PAYER/BROKER.
      for (const tenantType of [
        'UNIVERSITY',
        'PHARMACY',
        'HOSPITAL',
        'MEDICAL_OFFICE',
        'NURSING',
        'HEALTH_OTHER',
        'HEALTH_BUSINESS',
        'DIAGNOSTIC_CENTER',
      ] as const) {
        expect(() =>
          service.assertProfileMatchesType({
            tenantType,
            legalName: 'Institución Z',
            countryConceptId: 'country-1',
            jurisdictionConceptId: 'jur-1',
          }),
        ).not.toThrow();
      }
    });

    it('no exige país ni jurisdicción a los tipos de seguros', () => {
      const { service } = build();

      // Su regulador viaja dentro de su propio bloque, no en la jurisdicción.
      expect(TERRITORIAL_TENANT_TYPES).not.toContain('PAYER');
      expect(TERRITORIAL_TENANT_TYPES).not.toContain('BROKER');
    });

    it('rechaza un bloque que no corresponde al tipo declarado', () => {
      const { service } = build();

      // Aceptarlo dejaría un tenant PROVIDER con datos de aseguradora que nadie
      // va a materializar: el cliente se equivocó de tipo o de bloque.
      expect(() =>
        service.assertProfileMatchesType({
          tenantType: 'PROVIDER',
          legalName: 'Clínica Z',
          countryConceptId: 'country-1',
          jurisdictionConceptId: 'jur-1',
          payer: {
            carrierCode: 'C1',
            regulatorIdentifier: 'R1',
            sigla: 'C1',
            address: 'Calle Falsa 123',
          },
        }),
      ).toThrow(PreconditionFailedException);
    });

    it('acepta cada tipo con lo que le corresponde', () => {
      const { service } = build();

      expect(() =>
        service.assertProfileMatchesType({
          tenantType: 'PROVIDER',
          legalName: 'Clínica Z',
          countryConceptId: 'country-1',
          jurisdictionConceptId: 'jur-1',
        }),
      ).not.toThrow();

      expect(() =>
        service.assertProfileMatchesType({
          tenantType: 'PAYER',
          legalName: 'Aseguradora X',
          payer: {
            carrierCode: 'C1',
            regulatorIdentifier: 'R1',
            sigla: 'C1',
            address: 'Calle Falsa 123',
          },
        }),
      ).not.toThrow();

      expect(() =>
        service.assertProfileMatchesType({
          tenantType: 'BROKER',
          legalName: 'Corredora Y',
          broker: { brokerCode: 'B1', licenseNumber: 'L1' },
        }),
      ).not.toThrow();
    });
  });

  /**
   * El centro de diagnóstico (subtarea 1.5): territorial como el resto de
   * las instituciones, pero a diferencia de PAYER/BROKER su bloque de datos
   * es opcional — declarar sólo el tipo es válido, la unidad se puede
   * completar después desde el módulo 23.
   */
  describe('assertProfileMatchesType · DIAGNOSTIC_CENTER (1.5)', () => {
    it('acepta el tipo sin el bloque diagnosticUnit', () => {
      const { service } = build();

      expect(() =>
        service.assertProfileMatchesType({
          tenantType: 'DIAGNOSTIC_CENTER',
          legalName: 'Centro de Imagen Z',
          countryConceptId: 'country-1',
          jurisdictionConceptId: 'jur-1',
        }),
      ).not.toThrow();
    });

    it('acepta el bloque diagnosticUnit completo', () => {
      const { service } = build();

      expect(() =>
        service.assertProfileMatchesType({
          tenantType: 'DIAGNOSTIC_CENTER',
          legalName: 'Centro de Imagen Z',
          countryConceptId: 'country-1',
          jurisdictionConceptId: 'jur-1',
          diagnosticUnit: {
            code: 'CENTRO_Z',
            modalityConceptIds: [DUNIT.MODALITY_XRAY, DUNIT.MODALITY_MRI],
          },
        }),
      ).not.toThrow();
    });

    it('rechaza diagnosticUnit con un tipo que no es DIAGNOSTIC_CENTER', () => {
      const { service } = build();

      expect(() =>
        service.assertProfileMatchesType({
          tenantType: 'PROVIDER',
          legalName: 'Clínica Z',
          countryConceptId: 'country-1',
          jurisdictionConceptId: 'jur-1',
          diagnosticUnit: { code: 'X' },
        }),
      ).toThrow(PreconditionFailedException);
    });

    it('rechaza un tipo de unidad que no es IMAGING ni LABORATORY', () => {
      const { service } = build();

      expect(() =>
        service.assertProfileMatchesType({
          tenantType: 'DIAGNOSTIC_CENTER',
          legalName: 'Centro de Imagen Z',
          countryConceptId: 'country-1',
          jurisdictionConceptId: 'jur-1',
          diagnosticUnit: {
            diagnosticUnitTypeConceptId: 'no-es-una-unidad-diagnostica',
          },
        }),
      ).toThrow(PreconditionFailedException);
    });

    it('rechaza una modalidad que no pertenece a la lista cerrada, nombrándola', () => {
      const { service } = build();
      const modalidadInventada = 'no-existe-como-modalidad';

      try {
        service.assertProfileMatchesType({
          tenantType: 'DIAGNOSTIC_CENTER',
          legalName: 'Centro de Imagen Z',
          countryConceptId: 'country-1',
          jurisdictionConceptId: 'jur-1',
          diagnosticUnit: { modalityConceptIds: [modalidadInventada] },
        });
        throw new Error('debía rechazar');
      } catch (error) {
        expect(error).toBeInstanceOf(PreconditionFailedException);
        expect((error as PreconditionFailedException).details).toMatchObject({
          invalidModalities: [modalidadInventada],
        });
      }
    });
  });

  describe('assertConceptsExist', () => {
    it('rechaza un concepto que no está en el catálogo, nombrando el campo', async () => {
      const { service, conceptsRepo, tx } = build();
      // El catálogo solo conoce la jurisdicción: el país que se declaró no existe.
      conceptsRepo.findByIds.mockResolvedValue(
        new Map([['jur-1', { id: 'jur-1' }]]),
      );

      const declared = service.declaredConcepts({
        tenantType: 'PROVIDER',
        legalName: 'Clínica Z',
        countryConceptId: 'no-existe',
        jurisdictionConceptId: 'jur-1',
      });

      // Sin esta comprobación el uuid llegaba al INSERT y la violación de FK
      // salía como 500 «Error interno del servidor», sin decir qué campo era.
      await expect(service.assertConceptsExist(tx, declared)).rejects.toThrow(
        PreconditionFailedException,
      );
      await expect(
        service.assertConceptsExist(tx, declared),
      ).rejects.toMatchObject({
        details: {
          unknown: [{ field: 'countryConceptId', conceptId: 'no-existe' }],
        },
      });
    });

    it('acepta cuando todos existen, con una sola consulta', async () => {
      const { service, conceptsRepo, tx } = build();

      await expect(
        service.assertConceptsExist(tx, {
          countryConceptId: 'country-1',
          jurisdictionConceptId: 'jur-1',
          'payer.jurisdictionConceptId': 'jur-2',
        }),
      ).resolves.toBeUndefined();

      // Una query para los tres: de a uno sería N+1 sobre la tabla más consultada.
      expect(conceptsRepo.findByIds).toHaveBeenCalledTimes(1);
      expect(conceptsRepo.findByIds).toHaveBeenCalledWith(tx, [
        'country-1',
        'jur-1',
        'jur-2',
      ]);
    });

    it('no consulta nada si el alta no declara ningún concepto', async () => {
      const { service, conceptsRepo, tx } = build();

      await expect(
        service.assertConceptsExist(tx, {
          countryConceptId: undefined,
          jurisdictionConceptId: undefined,
        }),
      ).resolves.toBeUndefined();
      expect(conceptsRepo.findByIds).not.toHaveBeenCalled();
    });

    it('incluye los conceptos de los bloques payer y broker', () => {
      const { service } = build();

      // Se recogen etiquetados con la ruta que usa el cliente: `payer.jurisdictionConceptId`
      // y `jurisdictionConceptId` son campos distintos y el error tiene que distinguirlos.
      expect(
        service.declaredConcepts({
          tenantType: 'PAYER',
          legalName: 'Aseguradora X',
          payer: {
            carrierCode: 'C1',
            regulatorIdentifier: 'R1',
            sigla: 'C1',
            address: 'Calle Falsa 123',
            jurisdictionConceptId: 'jur-payer',
          },
        }),
      ).toMatchObject({ 'payer.jurisdictionConceptId': 'jur-payer' });
    });
  });

  describe('materializeProfile', () => {
    it('crea la aseguradora del tenant PAYER pendiente de verificación', async () => {
      const { service, catalogRepo, tx } = build();

      const id = await service.materializeProfile(
        tx,
        'tenant-1',
        {
          tenantType: 'PAYER',
          legalName: 'Aseguradora X',
          payer: {
            carrierCode: 'CAR-1',
            regulatorIdentifier: 'APS-4821',
            sigla: 'ASX',
            address: 'Av. Siempre Viva 742',
            jurisdictionConceptId: 'jur-1',
          },
        },
        'actor-1',
      );

      expect(id).toBe('carrier-1');
      expect(catalogRepo.createCarrier).toHaveBeenCalledWith(
        tx,
        expect.objectContaining({
          tenantId: 'tenant-1',
          carrierCode: 'CAR-1',
          regulatorIdentifier: 'APS-4821',
          sigla: 'ASX',
          address: 'Av. Siempre Viva 742',
          // Declarar que se es aseguradora no equivale a serlo: lo contrasta la
          // plataforma, igual que con el tenant y con la matrícula del médico.
          verificationStatusConceptId: INS.VERIFY_PENDING,
        }),
      );
    });

    it('crea el corredor del tenant BROKER con su licencia', async () => {
      const { service, catalogRepo, tx } = build();

      const id = await service.materializeProfile(
        tx,
        'tenant-2',
        {
          tenantType: 'BROKER',
          legalName: 'Corredora Y',
          broker: { brokerCode: 'BRO-1', licenseNumber: 'LIC-9' },
        },
        'actor-1',
      );

      expect(id).toBe('broker-1');
      expect(catalogRepo.createBroker).toHaveBeenCalledWith(
        tx,
        expect.objectContaining({
          tenantId: 'tenant-2',
          brokerCode: 'BRO-1',
          licenseNumber: 'LIC-9',
          verificationStatusConceptId: INS.VERIFY_PENDING,
        }),
      );
    });

    it('no crea fila propia para PROVIDER: su realidad son las sedes', async () => {
      const { service, catalogRepo, tx } = build();

      const id = await service.materializeProfile(
        tx,
        'tenant-3',
        {
          tenantType: 'PROVIDER',
          legalName: 'Clínica Z',
          countryConceptId: 'country-1',
          jurisdictionConceptId: 'jur-1',
        },
        'actor-1',
      );

      expect(id).toBeUndefined();
      expect(catalogRepo.createCarrier).not.toHaveBeenCalled();
      expect(catalogRepo.createBroker).not.toHaveBeenCalled();
    });

    it('delega la unidad diagnostica en DiagnosticUnitProvisioningService con los defaults', async () => {
      const { service, diagnosticUnitProvisioning, tx } = build();

      const id = await service.materializeProfile(
        tx,
        'tenant-4',
        {
          tenantType: 'DIAGNOSTIC_CENTER',
          legalName: 'Centro de Imagen Z',
          code: 'CENTRO_Z',
          countryConceptId: 'country-1',
          jurisdictionConceptId: 'jur-1',
          diagnosticUnit: {
            modalityConceptIds: [DUNIT.MODALITY_XRAY],
          },
        },
        'actor-1',
      );

      expect(id).toBe('diagnostic-unit-1');
      expect(diagnosticUnitProvisioning.provision).toHaveBeenCalledWith(
        tx,
        {
          tenantId: 'tenant-4',
          tenantCode: 'CENTRO_Z',
          legalName: 'Centro de Imagen Z',
          // Sin quinto parámetro (autorregistro), el administrador de la
          // práctica es el mismo actor que ejecuta el alta.
          ownerUserId: 'actor-1',
        },
        { modalityConceptIds: [DUNIT.MODALITY_XRAY] },
        'actor-1',
      );
    });

    it('usa practiceAdminUserId como dueño de la práctica cuando se lo pasan', async () => {
      const { service, diagnosticUnitProvisioning, tx } = build();

      await service.materializeProfile(
        tx,
        'tenant-5',
        {
          tenantType: 'DIAGNOSTIC_CENTER',
          legalName: 'Centro de Imagen Z',
          countryConceptId: 'country-1',
          jurisdictionConceptId: 'jur-1',
          diagnosticUnit: {},
        },
        'admin-de-plataforma',
        'dueno-real-del-centro',
      );

      expect(diagnosticUnitProvisioning.provision).toHaveBeenCalledWith(
        tx,
        expect.objectContaining({ ownerUserId: 'dueno-real-del-centro' }),
        {},
        'admin-de-plataforma',
      );
    });

    it('no crea la unidad si DIAGNOSTIC_CENTER no declaró diagnosticUnit', async () => {
      const { service, diagnosticUnitProvisioning, tx } = build();

      const id = await service.materializeProfile(
        tx,
        'tenant-6',
        {
          tenantType: 'DIAGNOSTIC_CENTER',
          legalName: 'Centro de Imagen Z',
          countryConceptId: 'country-1',
          jurisdictionConceptId: 'jur-1',
        },
        'actor-1',
      );

      expect(id).toBeUndefined();
      expect(diagnosticUnitProvisioning.provision).not.toHaveBeenCalled();
    });
  });
});
