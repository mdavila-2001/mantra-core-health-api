import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { DiagnosticUnitsAdminReadService } from './diagnostic-units-admin-read.service';
import { DUNIT } from '../diagnostic_units.concepts';
import { ResourceNotFoundException, runWithTenant } from '../../../common';

const UNIDAD_PUBLICADA = {
  id: 'unit-1',
  tenantId: 'tenant-1',
  code: 'LAB-CENTRAL',
  name: 'Laboratorio Central',
  diagnosticUnitTypeConceptId: DUNIT.UNIT_TYPE_LABORATORY,
  statusConceptId: DUNIT.UNIT_ACTIVE,
  verificationStatusConceptId: DUNIT.VERIFICATION_VERIFIED,
};

const UNIDAD_EN_BORRADOR = {
  ...UNIDAD_PUBLICADA,
  id: 'unit-2',
  code: 'LAB-NORTE',
  name: 'Laboratorio Norte',
  verificationStatusConceptId: DUNIT.VERIFICATION_PENDING,
};

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 *
 * @returns El servicio y sus dobles.
 */
function build() {
  const em = { fork: mockFn(() => em) };
  const readRepo = {
    findByTenant: mockFn().mockResolvedValue([]),
    findById: mockFn().mockResolvedValue(UNIDAD_PUBLICADA),
    findSites: mockFn().mockResolvedValue([]),
    findEquipment: mockFn().mockResolvedValue([]),
    findOfferings: mockFn().mockResolvedValue([]),
    findPriceSchedules: mockFn().mockResolvedValue([]),
    findPrices: mockFn().mockResolvedValue([]),
    findAccreditations: mockFn().mockResolvedValue([]),
    findPractitionerAssignments: mockFn().mockResolvedValue([]),
    findRoleAssignments: mockFn().mockResolvedValue([]),
    findPracticeSites: mockFn().mockResolvedValue([]),
    findPractitionerNames: mockFn().mockResolvedValue(new Map()),
    findConcepts: mockFn().mockResolvedValue([]),
  };

  const service = new DiagnosticUnitsAdminReadService(
    em as any,
    readRepo as any,
  );
  return { service, em, readRepo };
}

/** Ejecuta con el tenant fijado, como haría el interceptor de contexto. */
function conTenant<T>(fn: () => Promise<T>, tenantId = 'tenant-1'): Promise<T> {
  return runWithTenant(tenantId, fn);
}

describe('DiagnosticUnitsAdminReadService', () => {
  describe('list', () => {
    it('devuelve la unidad sin publicar, que el directorio esconde', async () => {
      const d = build();
      d.readRepo.findByTenant.mockResolvedValue([
        UNIDAD_PUBLICADA,
        UNIDAD_EN_BORRADOR,
      ]);

      const lista = await conTenant(() => d.service.list());

      expect(lista.count).toBe(2);
      expect(lista.items.map((item) => item.code)).toEqual([
        'LAB-CENTRAL',
        'LAB-NORTE',
      ]);
    });

    it('marca cuál se ve hoy en el directorio y cuál no', async () => {
      const d = build();
      d.readRepo.findByTenant.mockResolvedValue([
        UNIDAD_PUBLICADA,
        UNIDAD_EN_BORRADOR,
      ]);

      const lista = await conTenant(() => d.service.list());

      // La regla es la misma que aplica el directorio —activa y verificada—;
      // acá se informa en vez de filtrar, para poder decir por qué no se ve.
      expect(lista.items[0].publiclyListed).toBe(true);
      expect(lista.items[1].publiclyListed).toBe(false);
    });

    it('no consulta nada más cuando el tenant no tiene unidades', async () => {
      const d = build();

      const lista = await conTenant(() => d.service.list());

      expect(lista).toEqual({ items: [], count: 0 });
      expect(d.readRepo.findSites).not.toHaveBeenCalled();
    });

    it('cuenta sedes, estudios y equipos de cada unidad', async () => {
      const d = build();
      d.readRepo.findByTenant.mockResolvedValue([UNIDAD_PUBLICADA]);
      d.readRepo.findSites.mockResolvedValue([
        {
          id: 'sede-1',
          diagnosticUnitId: 'unit-1',
          practiceSiteId: 'ps-1',
          siteRoleConceptId: 'c-rol',
          statusConceptId: 'c-activa',
        },
      ]);
      d.readRepo.findOfferings.mockResolvedValue([
        {
          id: 'of-1',
          diagnosticUnitId: 'unit-1',
          studyCode: 'HEM',
          displayName: 'Hemograma',
          statusConceptId: 'c-activa',
        },
        {
          id: 'of-2',
          diagnosticUnitId: 'unit-1',
          studyCode: 'GLU',
          displayName: 'Glucemia',
          statusConceptId: 'c-borrador',
        },
      ]);
      d.readRepo.findEquipment.mockResolvedValue([
        {
          id: 'eq-1',
          diagnosticUnitSiteId: 'sede-1',
          equipmentTypeConceptId: 'c-analizador',
          operationalStatusConceptId: 'c-operativo',
        },
      ]);

      const lista = await conTenant(() => d.service.list());

      expect(lista.items[0]).toMatchObject({
        siteCount: 1,
        studyCount: 2,
        equipmentCount: 1,
      });
    });
  });

  describe('getById', () => {
    it('404 cuando la unidad no existe o es de otro tenant', async () => {
      const d = build();
      d.readRepo.findById.mockResolvedValue(null);

      await expect(
        conTenant(() => d.service.getById('unit-1')),
      ).rejects.toThrow(ResourceNotFoundException);
    });

    it('acota la búsqueda al tenant del contexto', async () => {
      const d = build();

      await conTenant(() => d.service.getById('unit-1'), 'tenant-9');

      expect(d.readRepo.findById).toHaveBeenCalledWith(
        d.em,
        'tenant-9',
        'unit-1',
      );
    });

    it('toma el nombre de la sede de `practice`, no el prefijo de accesión', async () => {
      const d = build();
      d.readRepo.findSites.mockResolvedValue([
        {
          id: 'sede-1',
          diagnosticUnitId: 'unit-1',
          practiceSiteId: 'ps-1',
          accessionPrefix: 'LC',
          siteRoleConceptId: 'c-rol',
          statusConceptId: 'c-activa',
        },
      ]);
      d.readRepo.findPracticeSites.mockResolvedValue([
        { id: 'ps-1', code: 'S-CENTRAL', name: 'Sede Central' },
      ]);

      const ficha = await conTenant(() => d.service.getById('unit-1'));

      expect(ficha.sites[0]).toMatchObject({
        code: 'S-CENTRAL',
        name: 'Sede Central',
        accessionPrefix: 'LC',
      });
    });

    it('cae al prefijo de accesión cuando la sede de práctica no está', async () => {
      const d = build();
      d.readRepo.findSites.mockResolvedValue([
        {
          id: 'sede-1',
          diagnosticUnitId: 'unit-1',
          practiceSiteId: 'ps-huerfana',
          accessionPrefix: 'LC',
          siteRoleConceptId: 'c-rol',
          statusConceptId: 'c-activa',
        },
      ]);

      const ficha = await conTenant(() => d.service.getById('unit-1'));

      expect(ficha.sites[0].code).toBe('LC');
      expect(ficha.sites[0].name).toBe('Sede sin nombre registrado');
    });

    it('devuelve también los precios de cronogramas no públicos', async () => {
      const d = build();
      d.readRepo.findOfferings.mockResolvedValue([
        {
          id: 'of-1',
          diagnosticUnitId: 'unit-1',
          studyCode: 'HEM',
          displayName: 'Hemograma',
          statusConceptId: 'c-activa',
        },
      ]);
      d.readRepo.findPriceSchedules.mockResolvedValue([
        {
          id: 'sch-publico',
          code: 'PUBLICO',
          publicVisibility: true,
          currencyConceptId: 'c-bob',
          statusConceptId: 'c-activo',
        },
        {
          id: 'sch-aseguradora',
          code: 'ASEGURADORA-A',
          publicVisibility: false,
          currencyConceptId: 'c-bob',
          statusConceptId: 'c-activo',
        },
      ]);
      d.readRepo.findPrices.mockResolvedValue([
        {
          id: 'pr-1',
          priceScheduleId: 'sch-publico',
          diagnosticStudyOfferingId: 'of-1',
          versionNumber: 1,
          baseAmount: '120.00',
          effectiveFrom: new Date('2026-01-01T00:00:00.000Z'),
          statusConceptId: 'c-vigente',
        },
        {
          id: 'pr-2',
          priceScheduleId: 'sch-aseguradora',
          diagnosticStudyOfferingId: 'of-1',
          versionNumber: 1,
          baseAmount: '85.00',
          effectiveFrom: new Date('2026-01-01T00:00:00.000Z'),
          statusConceptId: 'c-vigente',
        },
      ]);

      const ficha = await conTenant(() => d.service.getById('unit-1'));

      // El directorio sólo publica el primero; la consola tiene que ver los dos
      // o no habría manera de administrar el convenio con la aseguradora.
      expect(ficha.studies[0].prices.map((p) => p.scheduleCode)).toEqual([
        'PUBLICO',
        'ASEGURADORA-A',
      ]);
      expect(ficha.studies[0].prices[1].schedulePublic).toBe(false);
    });

    it('descarta el precio cuyo cronograma no vino, en vez de inventarlo', async () => {
      const d = build();
      d.readRepo.findOfferings.mockResolvedValue([
        {
          id: 'of-1',
          diagnosticUnitId: 'unit-1',
          studyCode: 'HEM',
          displayName: 'Hemograma',
          statusConceptId: 'c-activa',
        },
      ]);
      d.readRepo.findPrices.mockResolvedValue([
        {
          id: 'pr-1',
          priceScheduleId: 'sch-fantasma',
          diagnosticStudyOfferingId: 'of-1',
          versionNumber: 1,
          baseAmount: '120.00',
          effectiveFrom: new Date('2026-01-01T00:00:00.000Z'),
          statusConceptId: 'c-vigente',
        },
      ]);

      const ficha = await conTenant(() => d.service.getById('unit-1'));

      expect(ficha.studies[0].prices).toEqual([]);
    });

    it('resuelve el nombre del personal por su asignación de rol', async () => {
      const d = build();
      d.readRepo.findPractitionerAssignments.mockResolvedValue([
        {
          id: 'asg-1',
          diagnosticUnitId: 'unit-1',
          practitionerRoleAssignmentId: 'rol-1',
          mayValidateResults: true,
          maySignReports: false,
          statusConceptId: 'c-activa',
        },
      ]);
      d.readRepo.findRoleAssignments.mockResolvedValue([
        { id: 'rol-1', practitionerProfileId: 'perfil-1' },
      ]);
      d.readRepo.findPractitionerNames.mockResolvedValue(
        new Map([['perfil-1', 'Dr. Marco Rojas']]),
      );

      const ficha = await conTenant(() => d.service.getById('unit-1'));

      expect(ficha.staff[0]).toMatchObject({
        practitionerProfileId: 'perfil-1',
        practitionerName: 'Dr. Marco Rojas',
        mayValidateResults: true,
        maySignReports: false,
      });
    });

    it('no pierde al integrante cuya asignación de rol no se pudo resolver', async () => {
      const d = build();
      d.readRepo.findPractitionerAssignments.mockResolvedValue([
        {
          id: 'asg-1',
          diagnosticUnitId: 'unit-1',
          practitionerRoleAssignmentId: 'rol-huerfano',
          statusConceptId: 'c-activa',
        },
      ]);

      const ficha = await conTenant(() => d.service.getById('unit-1'));

      // Sigue en la lista con el dato faltante explícito: esconderlo dejaría
      // una vinculación activa sin que nadie pueda verla ni cerrarla.
      expect(ficha.staff).toHaveLength(1);
      expect(ficha.staff[0].practitionerProfileId).toBeNull();
      expect(ficha.staff[0].practitionerName).toBeNull();
    });

    it('calcula los días hasta la próxima calibración', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-08-15T12:00:00.000Z'));
      try {
        const d = build();
        d.readRepo.findSites.mockResolvedValue([
          {
            id: 'sede-1',
            diagnosticUnitId: 'unit-1',
            practiceSiteId: 'ps-1',
            siteRoleConceptId: 'c-rol',
            statusConceptId: 'c-activa',
          },
        ]);
        d.readRepo.findEquipment.mockResolvedValue([
          {
            id: 'eq-1',
            diagnosticUnitSiteId: 'sede-1',
            equipmentTypeConceptId: 'c-analizador',
            operationalStatusConceptId: 'c-operativo',
            nextCalibrationDueAt: new Date('2026-08-20T00:00:00.000Z'),
          },
          {
            id: 'eq-2',
            diagnosticUnitSiteId: 'sede-1',
            equipmentTypeConceptId: 'c-analizador',
            operationalStatusConceptId: 'c-operativo',
          },
        ]);

        const ficha = await conTenant(() => d.service.getById('unit-1'));

        expect(ficha.equipment[0].daysToCalibration).toBe(5);
        expect(ficha.equipment[1].daysToCalibration).toBeNull();
      } finally {
        jest.useRealTimers();
      }
    });

    it('calcula negativo el vencimiento de una acreditación ya vencida', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-08-15T12:00:00.000Z'));
      try {
        const d = build();
        d.readRepo.findAccreditations.mockResolvedValue([
          {
            id: 'acc-1',
            accreditationConceptId: 'c-iso',
            verificationStatusConceptId: 'c-verificada',
            validTo: new Date('2026-07-31T00:00:00.000Z'),
          },
        ]);

        const ficha = await conTenant(() => d.service.getById('unit-1'));

        expect(ficha.accreditations[0].daysToExpiry).toBe(-15);
      } finally {
        jest.useRealTimers();
      }
    });

    it('pide los conceptos de toda la ficha en una sola lectura', async () => {
      const d = build();
      d.readRepo.findSites.mockResolvedValue([
        {
          id: 'sede-1',
          diagnosticUnitId: 'unit-1',
          practiceSiteId: 'ps-1',
          siteRoleConceptId: 'c-rol-sede',
          statusConceptId: 'c-sede-activa',
        },
      ]);

      await conTenant(() => d.service.getById('unit-1'));

      expect(d.readRepo.findConcepts).toHaveBeenCalledTimes(1);
      const [, ids] = d.readRepo.findConcepts.mock.calls[0];
      expect(ids).toContain('c-rol-sede');
      expect(ids).toContain('c-sede-activa');
      expect(new Set(ids).size).toBe(ids.length);
    });
  });
});
