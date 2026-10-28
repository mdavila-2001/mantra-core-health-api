import { jest } from '@jest/globals';
import { ServiceCatalog } from '../../billing/entities';
import {
  HealthcareServices,
  PracticeSites,
  PractitionerRoleAssignments,
} from '../../practice/entities';
import { PRAC } from '../../practice/practice.concepts';
import { PerformerSiteDbReader } from './performer-site-db.reader';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

/**
 * `EntityManager` que responde `findOne` según la entidad pedida.
 *
 * @param byEntity - Respuesta por clase de entidad.
 * @param find - Respuesta de `find`.
 * @returns El doble y el mock de `findOne`.
 */
function em(byEntity: Map<unknown, unknown>, find: unknown[] = []) {
  const findOne = mockFn((entity: unknown) =>
    Promise.resolve(byEntity.get(entity) ?? null),
  );
  return {
    double: { findOne, find: mockFn().mockResolvedValue(find) } as any,
    findOne,
  };
}

describe('PerformerSiteDbReader', () => {
  const reader = new PerformerSiteDbReader();

  describe('offersProcedureWithPrice', () => {
    const full = new Map<unknown, unknown>([
      [PracticeSites, { id: 'site' }],
      [HealthcareServices, { id: 'hs', serviceCatalogId: 'cat' }],
      [ServiceCatalog, { id: 'cat' }],
    ]);

    it('es true con sede activa, servicio activo y un ítem de catálogo activo', async () => {
      const { double, findOne } = em(full);

      await expect(
        reader.offersProcedureWithPrice(double, 'site', 'proc'),
      ).resolves.toBe(true);
      expect(findOne).toHaveBeenCalledWith(
        HealthcareServices,
        expect.objectContaining({
          practiceSiteId: 'site',
          serviceConceptId: 'proc',
          statusConceptId: PRAC.SERVICE_ACTIVE,
        }),
      );
    });

    it.each([
      ['la sede no está activa', PracticeSites],
      ['el servicio no existe o está inactivo', HealthcareServices],
      ['el ítem de catálogo está inactivo', ServiceCatalog],
    ])('es false si %s', async (_name, missing) => {
      const partial = new Map(full);
      partial.delete(missing);
      const { double } = em(partial);

      await expect(
        reader.offersProcedureWithPrice(double, 'site', 'proc'),
      ).resolves.toBe(false);
    });

    it('es false si el servicio no tiene ítem de catálogo (sin precio)', async () => {
      const { double } = em(
        new Map<unknown, unknown>([
          [PracticeSites, { id: 'site' }],
          [HealthcareServices, { id: 'hs', serviceCatalogId: undefined }],
        ]),
      );

      await expect(
        reader.offersProcedureWithPrice(double, 'site', 'proc'),
      ).resolves.toBe(false);
    });
  });

  describe('isActivelyAffiliated', () => {
    it('es true si una afiliación ACTIVE y vigente apunta a un servicio de ese procedimiento', async () => {
      const { double, findOne } = em(
        new Map<unknown, unknown>([[HealthcareServices, { id: 'hs' }]]),
        [{ id: 'r1', healthcareServiceId: 'hs' }],
      );

      await expect(
        reader.isActivelyAffiliated(double, 'doc', 'site', 'proc'),
      ).resolves.toBe(true);
      expect(double.find).toHaveBeenCalledWith(
        PractitionerRoleAssignments,
        expect.objectContaining({
          practitionerProfileId: 'doc',
          practiceSiteId: 'site',
          statusConceptId: PRAC.ROLE_ASSIGNMENT_ACTIVE,
          validTo: null,
        }),
        expect.anything(),
      );
      expect(findOne).toHaveBeenCalledWith(
        HealthcareServices,
        { id: { $in: ['hs'] }, serviceConceptId: 'proc' },
        expect.anything(),
      );
    });

    it('es false sin afiliaciones activas en la sede (INVITED y PENDING no cuentan)', async () => {
      const { double, findOne } = em(new Map(), []);

      await expect(
        reader.isActivelyAffiliated(double, 'doc', 'site', 'proc'),
      ).resolves.toBe(false);
      expect(findOne).not.toHaveBeenCalled();
    });

    it('es false si su afiliación activa es de OTRO procedimiento', async () => {
      const { double } = em(new Map(), [
        { id: 'r1', healthcareServiceId: 'hs-otro' },
      ]);

      await expect(
        reader.isActivelyAffiliated(double, 'doc', 'site', 'proc'),
      ).resolves.toBe(false);
    });
  });
});
