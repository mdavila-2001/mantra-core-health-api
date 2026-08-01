import { jest } from '@jest/globals';
// Alias con tipado laxo: evita el 'never' que @jest/globals infiere para jest.fn() en ESM.
const fn = jest.fn as unknown as (impl?: (...a: any[]) => any) => any;
import { TenantTypeProfileService } from './tenant-type-profile.service';
import { PreconditionFailedException } from '../../../common';
import { INS } from '../../insurance/insurance.concepts';

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
    const service = new TenantTypeProfileService(catalogRepo as never);
    return { service, catalogRepo, tx: {} as never };
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

    it('exige país y jurisdicción cuando el tipo es PROVIDER', () => {
      const { service } = build();

      expect(() =>
        service.assertProfileMatchesType({
          tenantType: 'PROVIDER',
          legalName: 'Clínica Z',
          countryConceptId: 'country-1',
        }),
      ).toThrow(PreconditionFailedException);
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
          payer: { carrierCode: 'C1', regulatorIdentifier: 'R1' },
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
          payer: { carrierCode: 'C1', regulatorIdentifier: 'R1' },
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

  describe('materializeProfile', () => {
    it('crea la aseguradora del tenant PAYER pendiente de verificación', () => {
      const { service, catalogRepo, tx } = build();

      const id = service.materializeProfile(
        tx,
        'tenant-1',
        {
          tenantType: 'PAYER',
          legalName: 'Aseguradora X',
          payer: {
            carrierCode: 'CAR-1',
            regulatorIdentifier: 'APS-4821',
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
          // Declarar que se es aseguradora no equivale a serlo: lo contrasta la
          // plataforma, igual que con el tenant y con la matrícula del médico.
          verificationStatusConceptId: INS.VERIFY_PENDING,
        }),
      );
    });

    it('crea el corredor del tenant BROKER con su licencia', () => {
      const { service, catalogRepo, tx } = build();

      const id = service.materializeProfile(
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

    it('no crea fila propia para PROVIDER: su realidad son las sedes', () => {
      const { service, catalogRepo, tx } = build();

      const id = service.materializeProfile(
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
  });
});
