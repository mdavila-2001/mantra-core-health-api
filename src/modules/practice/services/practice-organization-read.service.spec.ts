import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { PracticeOrganizationReadService } from './practice-organization-read.service';
import { ResourceNotFoundException } from '../../../common';

const PRACTICA = {
  id: 'prac-1',
  tenantId: 'tenant-1',
  code: 'HOSP-CENTRAL',
  name: 'Hospital Central',
  typeConceptId: 'c-tipo',
  statusConceptId: 'c-activa',
  timeZone: 'America/La_Paz',
  currencyConceptId: 'c-bob',
};

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 *
 * Todas las lecturas devuelven vacío por omisión: cada prueba llena sólo la que
 * le interesa, y así el resto no arrastra datos que no está afirmando.
 *
 * @returns El servicio y sus dobles.
 */
function build() {
  const em = { fork: mockFn(() => em) };
  const practicesRepo = { findById: mockFn().mockResolvedValue(PRACTICA) };
  const readRepo = {
    findSites: mockFn().mockResolvedValue([]),
    findClinicalUnits: mockFn().mockResolvedValue([]),
    findCareSpaces: mockFn().mockResolvedValue([]),
    findHealthcareServices: mockFn().mockResolvedValue([]),
    findRoleAssignments: mockFn().mockResolvedValue([]),
    findAccreditations: mockFn().mockResolvedValue([]),
    findInventoryItems: mockFn().mockResolvedValue([]),
    findPractitionerNames: mockFn().mockResolvedValue(new Map()),
    findConcepts: mockFn().mockResolvedValue([]),
  };

  const service = new PracticeOrganizationReadService(
    em as any,
    practicesRepo as any,
    readRepo as any,
  );
  return { service, em, practicesRepo, readRepo };
}

describe('PracticeOrganizationReadService', () => {
  describe('aislamiento por tenant', () => {
    it('404 cuando la práctica no existe', async () => {
      const d = build();
      d.practicesRepo.findById.mockResolvedValue(null);

      await expect(d.service.getConsole('prac-1', 'tenant-1')).rejects.toThrow(
        ResourceNotFoundException,
      );
    });

    it('404 —y no 403— cuando la práctica es de otro tenant', async () => {
      const d = build();

      // El mismo error que una práctica inexistente: distinguirlos convertiría
      // el endpoint en un detector de qué identificadores existen fuera.
      await expect(
        d.service.getConsole('prac-1', 'otro-tenant'),
      ).rejects.toThrow(ResourceNotFoundException);
      expect(d.readRepo.findSites).not.toHaveBeenCalled();
    });
  });

  describe('cabecera de la organización', () => {
    it('traduce los conceptos y conserva la zona horaria', async () => {
      const d = build();
      d.readRepo.findConcepts.mockResolvedValue([
        { id: 'c-tipo', code: 'PR_TYPE_CLINIC', display: 'Clínica' },
        { id: 'c-activa', code: 'PR_ACTIVE', display: 'Activa' },
        { id: 'c-bob', code: 'DU_CUR_BOB', display: 'Boliviano' },
      ]);

      const consola = await d.service.getConsole('prac-1', 'tenant-1');

      expect(consola.organization).toEqual({
        id: 'prac-1',
        code: 'HOSP-CENTRAL',
        name: 'Hospital Central',
        type: { code: 'PR_TYPE_CLINIC', display: 'Clínica' },
        status: { code: 'PR_ACTIVE', display: 'Activa' },
        timeZone: 'America/La_Paz',
        currency: { code: 'DU_CUR_BOB', display: 'Boliviano' },
      });
    });

    it('marca el concepto que el catálogo no conoce, sin esconder la fila', async () => {
      const d = build();

      const consola = await d.service.getConsole('prac-1', 'tenant-1');

      expect(consola.organization.type).toEqual({
        code: 'UNKNOWN',
        display: 'Sin registrar',
      });
    });
  });

  describe('sedes', () => {
    it('cuenta las áreas y los espacios de cada sede', async () => {
      const d = build();
      d.readRepo.findSites.mockResolvedValue([
        {
          id: 'sede-1',
          code: 'S1',
          name: 'Sede Central',
          siteTypeConceptId: 'c-hosp',
          statusConceptId: 'c-activa',
        },
        {
          id: 'sede-2',
          code: 'S2',
          name: 'Sede Norte',
          siteTypeConceptId: 'c-hosp',
          statusConceptId: 'c-activa',
        },
      ]);
      d.readRepo.findClinicalUnits.mockResolvedValue([
        {
          id: 'area-1',
          practiceSiteId: 'sede-1',
          code: 'A1',
          name: 'Cirugía',
          unitTypeConceptId: 'c-dept',
          statusConceptId: 'c-activa',
        },
      ]);
      d.readRepo.findCareSpaces.mockResolvedValue([
        {
          id: 'esp-1',
          practiceSiteId: 'sede-1',
          code: 'Q1',
          name: 'Quirófano 1',
          spaceTypeConceptId: 'c-room',
          statusConceptId: 'c-activa',
        },
        {
          id: 'esp-2',
          practiceSiteId: 'sede-1',
          code: 'C1',
          name: 'Consultorio 1',
          spaceTypeConceptId: 'c-room',
          statusConceptId: 'c-activa',
        },
      ]);

      const consola = await d.service.getConsole('prac-1', 'tenant-1');

      expect(consola.sites[0]).toMatchObject({
        id: 'sede-1',
        clinicalUnitCount: 1,
        careSpaceCount: 2,
      });
      expect(consola.sites[1]).toMatchObject({
        id: 'sede-2',
        clinicalUnitCount: 0,
        careSpaceCount: 0,
      });
    });

    it('pide áreas y espacios por el lote de sedes, no de a una', async () => {
      const d = build();
      d.readRepo.findSites.mockResolvedValue([
        {
          id: 'sede-1',
          code: 'S1',
          name: 'A',
          siteTypeConceptId: 'c',
          statusConceptId: 'c',
        },
        {
          id: 'sede-2',
          code: 'S2',
          name: 'B',
          siteTypeConceptId: 'c',
          statusConceptId: 'c',
        },
      ]);

      await d.service.getConsole('prac-1', 'tenant-1');

      expect(d.readRepo.findClinicalUnits).toHaveBeenCalledTimes(1);
      expect(d.readRepo.findClinicalUnits).toHaveBeenCalledWith(d.em, [
        'sede-1',
        'sede-2',
      ]);
    });
  });

  describe('plantilla profesional', () => {
    it('resuelve el nombre del profesional y no repite el mismo perfil', async () => {
      const d = build();
      d.readRepo.findRoleAssignments.mockResolvedValue([
        {
          id: 'asg-1',
          practitionerProfileId: 'perfil-1',
          roleConceptId: 'c-rol',
          statusConceptId: 'c-activa',
        },
        {
          id: 'asg-2',
          practitionerProfileId: 'perfil-1',
          roleConceptId: 'c-rol',
          statusConceptId: 'c-activa',
        },
      ]);
      d.readRepo.findPractitionerNames.mockResolvedValue(
        new Map([['perfil-1', 'Dra. Valeria Fuentes']]),
      );

      const consola = await d.service.getConsole('prac-1', 'tenant-1');

      expect(d.readRepo.findPractitionerNames).toHaveBeenCalledWith(d.em, [
        'perfil-1',
      ]);
      expect(consola.staff.map((row) => row.practitionerName)).toEqual([
        'Dra. Valeria Fuentes',
        'Dra. Valeria Fuentes',
      ]);
    });

    it('deja el nombre en null cuando el perfil no tiene persona detrás', async () => {
      const d = build();
      d.readRepo.findRoleAssignments.mockResolvedValue([
        {
          id: 'asg-1',
          practitionerProfileId: 'perfil-huerfano',
          roleConceptId: 'c-rol',
          statusConceptId: 'c-activa',
        },
      ]);

      const consola = await d.service.getConsole('prac-1', 'tenant-1');

      // `null` y no el uuid: el uuid en una columna «Profesional» no le dice
      // nada a nadie, y la pantalla tiene que poder decir que falta el dato.
      expect(consola.staff[0].practitionerName).toBeNull();
    });

    it('normaliza las fechas de vigencia a fecha sola', async () => {
      const d = build();
      d.readRepo.findRoleAssignments.mockResolvedValue([
        {
          id: 'asg-1',
          practitionerProfileId: 'perfil-1',
          roleConceptId: 'c-rol',
          statusConceptId: 'c-activa',
          validFrom: new Date('2026-03-01T00:00:00.000Z'),
          validTo: undefined,
        },
      ]);

      const consola = await d.service.getConsole('prac-1', 'tenant-1');

      expect(consola.staff[0].validFrom).toBe('2026-03-01');
      expect(consola.staff[0].validTo).toBeNull();
    });
  });

  describe('documentación legal', () => {
    it('calcula los días que faltan hasta el vencimiento', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-08-15T18:30:00.000Z'));
      try {
        const d = build();
        d.readRepo.findAccreditations.mockResolvedValue([
          {
            id: 'doc-1',
            accreditationTypeConceptId: 'c-iso',
            verificationStatusConceptId: 'c-verificado',
            validTo: new Date('2026-08-25T00:00:00.000Z'),
          },
        ]);

        const consola = await d.service.getConsole('prac-1', 'tenant-1');

        expect(consola.legalDocuments[0].daysToExpiry).toBe(10);
      } finally {
        jest.useRealTimers();
      }
    });

    it('da 0 el día del vencimiento, aunque queden horas', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-08-15T23:00:00.000Z'));
      try {
        const d = build();
        d.readRepo.findAccreditations.mockResolvedValue([
          {
            id: 'doc-1',
            accreditationTypeConceptId: 'c-iso',
            verificationStatusConceptId: 'c-verificado',
            validTo: new Date('2026-08-15T00:00:00.000Z'),
          },
        ]);

        const consola = await d.service.getConsole('prac-1', 'tenant-1');

        expect(consola.legalDocuments[0].daysToExpiry).toBe(0);
      } finally {
        jest.useRealTimers();
      }
    });

    it('da negativo cuando ya venció', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-08-15T10:00:00.000Z'));
      try {
        const d = build();
        d.readRepo.findAccreditations.mockResolvedValue([
          {
            id: 'doc-1',
            accreditationTypeConceptId: 'c-iso',
            verificationStatusConceptId: 'c-verificado',
            validTo: new Date('2026-08-01T00:00:00.000Z'),
          },
        ]);

        const consola = await d.service.getConsole('prac-1', 'tenant-1');

        expect(consola.legalDocuments[0].daysToExpiry).toBe(-14);
      } finally {
        jest.useRealTimers();
      }
    });

    it('deja el vencimiento en null cuando el documento no declara uno', async () => {
      const d = build();
      d.readRepo.findAccreditations.mockResolvedValue([
        {
          id: 'doc-1',
          accreditationTypeConceptId: 'c-iso',
          verificationStatusConceptId: 'c-verificado',
        },
      ]);

      const consola = await d.service.getConsole('prac-1', 'tenant-1');

      expect(consola.legalDocuments[0].daysToExpiry).toBeNull();
      expect(consola.legalDocuments[0].validTo).toBeNull();
    });
  });

  describe('inventario', () => {
    it('marca el faltante cuando las existencias llegan al umbral', async () => {
      const d = build();
      d.readRepo.findInventoryItems.mockResolvedValue([
        {
          id: 'inv-1',
          name: 'Gasas',
          quantityOnHand: '10.000',
          reorderLevel: '10.000',
          statusConceptId: 'c-activo',
        },
        {
          id: 'inv-2',
          name: 'Guantes',
          quantityOnHand: '11.000',
          reorderLevel: '10.000',
          statusConceptId: 'c-activo',
        },
      ]);

      const consola = await d.service.getConsole('prac-1', 'tenant-1');

      expect(consola.inventory[0].belowReorderLevel).toBe(true);
      expect(consola.inventory[1].belowReorderLevel).toBe(false);
    });

    it('no inventa un faltante cuando no hay umbral configurado', async () => {
      const d = build();
      d.readRepo.findInventoryItems.mockResolvedValue([
        {
          id: 'inv-1',
          name: 'Gasas',
          quantityOnHand: '0.000',
          statusConceptId: 'c-activo',
        },
      ]);

      const consola = await d.service.getConsole('prac-1', 'tenant-1');

      expect(consola.inventory[0].belowReorderLevel).toBe(false);
    });

    it('conserva la cantidad como cadena, sin perder precisión', async () => {
      const d = build();
      d.readRepo.findInventoryItems.mockResolvedValue([
        {
          id: 'inv-1',
          name: 'Suero',
          quantityOnHand: '1234.5670',
          statusConceptId: 'c-activo',
        },
      ]);

      const consola = await d.service.getConsole('prac-1', 'tenant-1');

      expect(consola.inventory[0].quantityOnHand).toBe('1234.5670');
    });
  });

  describe('una sola lectura de terminología', () => {
    it('pide los conceptos de todo el árbol juntos y sin repetir', async () => {
      const d = build();
      d.readRepo.findSites.mockResolvedValue([
        {
          id: 'sede-1',
          code: 'S1',
          name: 'A',
          siteTypeConceptId: 'c-hosp',
          statusConceptId: 'c-activa',
        },
      ]);
      d.readRepo.findRoleAssignments.mockResolvedValue([
        {
          id: 'asg-1',
          practitionerProfileId: 'perfil-1',
          roleConceptId: 'c-rol',
          statusConceptId: 'c-activa',
        },
      ]);

      await d.service.getConsole('prac-1', 'tenant-1');

      expect(d.readRepo.findConcepts).toHaveBeenCalledTimes(1);
      const [, ids] = d.readRepo.findConcepts.mock.calls[0];
      expect(new Set(ids)).toEqual(
        new Set(['c-tipo', 'c-activa', 'c-bob', 'c-hosp', 'c-rol']),
      );
    });
  });
});
