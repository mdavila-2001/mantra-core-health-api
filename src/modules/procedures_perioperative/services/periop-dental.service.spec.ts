import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { PeriopDentalService } from './periop-dental.service';
import { ForbiddenException } from '@nestjs/common';
import { PreconditionFailedException, runWithTenant } from '../../../common';
import { CLIN } from '../../clinical/clinical.concepts';
import { PERIOP } from '../procedures_perioperative.concepts';
import { ProceduresPerioperativeErrorReason } from '../procedures_perioperative.error-reasons';

const actor = {
  id: 'user-1',
  roles: ['CLINICIAN'],
  practitionerProfileId: 'hp-1',
};
const TENANT = '11111111-1111-1111-1111-111111111111';
const PATIENT = '22222222-2222-2222-2222-222222222222';
const CODE = '33333333-3333-3333-3333-333333333333';

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn() };
  const em = {
    transactional: mockFn((cb: any) => cb(tx)),
  };
  const dentalRepo = {
    createProcedure: mockFn().mockReturnValue({
      id: 'proc-1',
      patientProfileId: PATIENT,
      statusConceptId: CLIN.PROCEDURE_COMPLETED,
      createdAt: new Date('2026-08-14T12:00:00.000Z'),
    }),
    createSite: mockFn(),
    findByPatient: mockFn().mockResolvedValue([]),
    countByPatient: mockFn().mockResolvedValue(0),
    findSitesByProcedures: mockFn().mockResolvedValue([]),
  };
  const auditTrail = { record: mockFn().mockResolvedValue(undefined) };
  const receivedServices = {
    projectProcedure: mockFn().mockResolvedValue(undefined),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  // El actor tiene base clínica sobre el paciente, salvo que el test diga otra
  // cosa (la regla de `clinical.procedures`, #893).
  const clinicalRead = {
    assertCanReadHistory: mockFn().mockResolvedValue(undefined),
    assertCanWriteHistory: mockFn().mockResolvedValue(undefined),
  };
  const raw = new PeriopDentalService(
    em as any,
    dentalRepo as any,
    clinicalRead as any,
    receivedServices as any,
    auditTrail as any,
    logger as any,
  );
  // Cada llamada corre con TENANT como tenant activo, como la deja el interceptor.
  const service = new Proxy(raw, {
    get(target, property, receiver) {
      const value = Reflect.get(target, property, receiver);
      if (typeof value !== 'function') return value;
      return (...args: unknown[]) =>
        runWithTenant(TENANT, () => value.apply(target, args));
    },
  });
  return {
    service,
    em,
    tx,
    dentalRepo,
    clinicalRead,
    auditTrail,
    receivedServices,
    logger,
  };
}

/**
 * Cuerpo mínimo del alta.
 *
 * @param overrides - Valor de overrides requerido por la operación.
 * @returns Resultado de dto conforme al contrato `any`.
 */
function dto(overrides: Record<string, unknown> = {}): any {
  return {
    patientProfileId: PATIENT,
    procedureCodeConceptId: CODE,
    ...overrides,
  };
}

describe('PeriopDentalService', () => {
  describe('record', () => {
    /**
     * La categoría es lo único que separa el histórico odontológico del resto de
     * los procedimientos de la persona. Si el alta la olvidara, el tratamiento
     * quedaría escrito y la lectura no lo encontraría nunca.
     */
    it('escribe el procedimiento con la categoría odontológica', async () => {
      const d = build();

      await d.service.record(dto(), TENANT, actor as any);

      expect(d.dentalRepo.createProcedure).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          custodianTenantId: TENANT,
          patientProfileId: PATIENT,
          codeConceptId: CODE,
          categoryConceptId: PERIOP.DENTAL_PROCEDURE_CATEGORY,
          statusConceptId: CLIN.PROCEDURE_COMPLETED,
        }),
      );
    });

    it('proyecta el tratamiento a «Servicios recibidos», porque este camino no pasa por ProceduresService', async () => {
      const d = build();
      await d.service.record(dto(), TENANT, actor as any);
      expect(d.receivedServices.projectProcedure).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ id: 'proc-1' }),
        actor.id,
      );
    });

    it('registra la pieza tratada como sitio anatómico', async () => {
      const d = build();

      await d.service.record(
        dto({
          toothSiteConceptId: PERIOP.TOOTH_36,
          siteDetail: 'Cara oclusal',
        }),
        TENANT,
        actor as any,
      );

      expect(d.dentalRepo.createSite).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          procedureId: 'proc-1',
          bodySiteConceptId: PERIOP.TOOTH_36,
          roleConceptId: PERIOP.DENTAL_SITE_ROLE,
          description: 'Cara oclusal',
        }),
      );
    });

    it('un cuadrante también es un sitio válido', async () => {
      const d = build();

      await d.service.record(
        dto({ toothSiteConceptId: PERIOP.QUADRANT_3 }),
        TENANT,
        actor as any,
      );

      expect(d.dentalRepo.createSite).toHaveBeenCalled();
    });

    it('sin pieza no se escribe ningún sitio', async () => {
      const d = build();

      await d.service.record(dto(), TENANT, actor as any);

      expect(d.dentalRepo.createSite).not.toHaveBeenCalled();
    });

    /**
     * La clave foránea sólo exige que el concepto exista, así que sin esta
     * comprobación un estado de usuario entraría como «pieza tratada» y la base
     * lo aceptaría sin chistar.
     */
    it('rechaza un concepto que no es pieza ni cuadrante', async () => {
      const d = build();

      await expect(
        d.service.record(
          dto({ toothSiteConceptId: CLIN.PROCEDURE_COMPLETED }),
          TENANT,
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(d.dentalRepo.createProcedure).not.toHaveBeenCalled();
    });

    it('rechaza precisar la cara sin decir sobre qué pieza', async () => {
      const d = build();

      await expect(
        d.service.record(
          dto({ siteDetail: 'Cara oclusal' }),
          TENANT,
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    /**
     * Un procedimiento sin autor es una fecha sin responsable. El profesional
     * sale del claim de la sesión cuando no se manda otro, que es el caso
     * corriente: quien registra es quien trató.
     */
    it('toma el profesional de la sesión si no viene en el cuerpo', async () => {
      const d = build();

      await d.service.record(dto(), TENANT, actor as any);

      expect(d.dentalRepo.createProcedure).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ performerProfileId: 'hp-1' }),
      );
    });

    it('respeta el profesional explícito por encima del de la sesión', async () => {
      const d = build();

      await d.service.record(
        dto({ performerProfileId: 'hp-otro' }),
        TENANT,
        actor as any,
      );

      expect(d.dentalRepo.createProcedure).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ performerProfileId: 'hp-otro' }),
      );
    });

    it('deja sello de auditoría del alta', async () => {
      const d = build();

      await d.service.record(dto(), TENANT, actor as any);

      expect(d.auditTrail.record).toHaveBeenCalledWith(
        d.tx,
        actor,
        expect.objectContaining({
          action: 'DENTAL_PROCEDURE_RECORDED',
          entityId: 'proc-1',
          tenantId: TENANT,
        }),
      );
    });
  });

  describe('#893: paciente sin base clínica del actor', () => {
    /**
     * Ajeno o inexistente, la respuesta es la misma: el 403 con el mismo texto
     * que da `ClinicalReadService` en toda la historia clínica.
     */
    it('el alta responde lo mismo que la historia y no escribe nada', async () => {
      const d = build();
      const denied = new ForbiddenException('Sin acceso a la historia');
      d.clinicalRead.assertCanWriteHistory.mockRejectedValue(denied);

      await expect(d.service.record(dto(), TENANT, actor as any)).rejects.toBe(
        denied,
      );
      expect(d.clinicalRead.assertCanWriteHistory).toHaveBeenCalledWith(
        PATIENT,
        actor,
      );
      expect(d.em.transactional).not.toHaveBeenCalled();
      expect(d.dentalRepo.createProcedure).not.toHaveBeenCalled();
    });

    it('el histórico responde lo mismo que la historia y no lee nada', async () => {
      const d = build();
      const denied = new ForbiddenException('Sin acceso a la historia');
      d.clinicalRead.assertCanReadHistory.mockRejectedValue(denied);

      await expect(
        d.service.listByPatient(
          { patientProfileId: PATIENT } as any,
          actor as any,
        ),
      ).rejects.toBe(denied);
      expect(d.clinicalRead.assertCanReadHistory).toHaveBeenCalledWith(
        PATIENT,
        actor,
      );
      expect(d.dentalRepo.findByPatient).not.toHaveBeenCalled();
      expect(d.dentalRepo.countByPatient).not.toHaveBeenCalled();
    });

    it('el histórico sólo trae lo que custodia el tenant activo', async () => {
      const d = build();

      await d.service.listByPatient(
        { patientProfileId: PATIENT } as any,
        actor as any,
      );

      expect(d.dentalRepo.findByPatient).toHaveBeenCalledWith(
        expect.anything(),
        PATIENT,
        TENANT,
        PERIOP.DENTAL_PROCEDURE_CATEGORY,
        50,
      );
      expect(d.dentalRepo.countByPatient).toHaveBeenCalledWith(
        expect.anything(),
        PATIENT,
        TENANT,
        PERIOP.DENTAL_PROCEDURE_CATEGORY,
      );
    });
  });

  describe('listByPatient', () => {
    it('filtra por paciente y por categoría odontológica', async () => {
      const d = build();

      await d.service.listByPatient(
        { patientProfileId: PATIENT } as any,
        actor as any,
      );

      expect(d.dentalRepo.findByPatient).toHaveBeenCalledWith(
        expect.anything(),
        PATIENT,
        TENANT,
        PERIOP.DENTAL_PROCEDURE_CATEGORY,
        50,
      );
    });

    it('respeta el tope pedido', async () => {
      const d = build();

      await d.service.listByPatient(
        {
          patientProfileId: PATIENT,
          limit: 10,
        } as any,
        actor as any,
      );

      expect(d.dentalRepo.findByPatient).toHaveBeenCalledWith(
        expect.anything(),
        PATIENT,
        TENANT,
        PERIOP.DENTAL_PROCEDURE_CATEGORY,
        10,
      );
    });

    it('cuelga cada sitio de su procedimiento', async () => {
      const d = build();
      d.dentalRepo.findByPatient.mockResolvedValue([
        {
          id: 'proc-1',
          patientProfileId: PATIENT,
          codeConceptId: CODE,
          statusConceptId: CLIN.PROCEDURE_COMPLETED,
          createdAt: new Date('2026-08-14T12:00:00.000Z'),
        },
        {
          id: 'proc-2',
          patientProfileId: PATIENT,
          codeConceptId: CODE,
          statusConceptId: CLIN.PROCEDURE_COMPLETED,
          createdAt: new Date('2026-08-13T12:00:00.000Z'),
        },
      ]);
      d.dentalRepo.findSitesByProcedures.mockResolvedValue([
        {
          id: 'site-1',
          procedureId: 'proc-1',
          bodySiteConceptId: PERIOP.TOOTH_36,
          description: 'Cara oclusal',
        },
      ]);

      const page = await d.service.listByPatient(
        {
          patientProfileId: PATIENT,
        } as any,
        actor as any,
      );

      expect(page.items[0].sites).toHaveLength(1);
      expect(page.items[0].sites[0].bodySiteConceptId).toBe(PERIOP.TOOTH_36);
      // Sin sitio registrado va un arreglo vacío, no `undefined`: un tratamiento
      // sin pieza es corriente y no debería obligar a distinguir dos ausencias.
      expect(page.items[1].sites).toEqual([]);
    });

    /**
     * El total va aparte de la página porque un histórico clínico recortado en
     * silencio se lee como «no hay más antecedentes».
     */
    it('devuelve el total sin paginar', async () => {
      const d = build();
      d.dentalRepo.countByPatient.mockResolvedValue(120);

      const page = await d.service.listByPatient(
        {
          patientProfileId: PATIENT,
          limit: 1,
        } as any,
        actor as any,
      );

      expect(page.total).toBe(120);
    });

    it('sin procedimientos no consulta la tabla de sitios', async () => {
      const d = build();

      await d.service.listByPatient(
        { patientProfileId: PATIENT } as any,
        actor as any,
      );

      expect(d.dentalRepo.findSitesByProcedures).toHaveBeenCalledWith(
        expect.anything(),
        [],
      );
    });
  });

  describe('catalog', () => {
    it('trae las 32 piezas permanentes y los cuatro cuadrantes', () => {
      const d = build();

      const catalog = d.service.catalog();

      expect(catalog.teeth).toHaveLength(32);
      expect(catalog.quadrants).toHaveLength(4);
      expect(catalog.procedureCodes.length).toBeGreaterThan(0);
    });

    /**
     * El catálogo existe para que el cliente no lleve los UUID escritos a mano:
     * si el identificador que sirve no fuera el mismo que el alta valida, la
     * pantalla mandaría un sitio que el backend rechazaría.
     */
    it('sirve los mismos identificadores que el alta acepta', () => {
      const d = build();

      const catalog = d.service.catalog();

      expect(catalog.teeth.map((t) => t.conceptId)).toContain(PERIOP.TOOTH_11);
      expect(catalog.quadrants[0].conceptId).toBe(PERIOP.QUADRANT_1);
    });

    it('cada entrada trae su código y su etiqueta', () => {
      const d = build();

      const catalog = d.service.catalog();

      expect(catalog.teeth[0]).toMatchObject({
        conceptId: PERIOP.TOOTH_11,
        code: 'FDI_11',
      });
      expect(catalog.teeth[0].display).toContain('Tooth 11');
    });
  });
});
