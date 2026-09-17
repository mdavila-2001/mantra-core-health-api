import { jest } from '@jest/globals';
import { ForbiddenException } from '@nestjs/common';
import { runWithTenant } from '../../../common';
import { ClaimsReadService } from './claims-read.service';
import { INS } from '../insurance.concepts';

/**
 * Mock sin tipar, como en el resto de los specs del módulo.
 *
 * `mockFn()` de `@jest/globals` infiere `never` para el valor resuelto cuando
 * no se le da la firma de la función original, y darle esa firma a los doce
 * métodos del repositorio sería repetir el repositorio entero en el doble.
 */

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const TENANT = '11111111-1111-1111-1111-111111111111';
const CARRIER = '22222222-2222-2222-2222-222222222222';
const CLAIM = '33333333-3333-3333-3333-333333333333';
const COVERAGE = '44444444-4444-4444-4444-444444444444';
const PERSON = '55555555-5555-5555-5555-555555555555';
const MONEDA = '66666666-6666-6666-6666-666666666666';
const ESTADO = '77777777-7777-7777-7777-777777777777';
const PRACTICE = '88888888-8888-8888-8888-888888888888';

/** Un reclamo mínimo, con lo que la lectura mira de verdad. */
function reclamo(over: Record<string, unknown> = {}) {
  return {
    id: CLAIM,
    claimIdentifier: 'CLM-1',
    insuranceCarrierId: CARRIER,
    patientCoverageId: COVERAGE,
    billingProviderTypeConceptId: INS.BILLING_PROVIDER_TYPE_PRACTICE,
    billingProviderEntityId: PRACTICE,
    statusConceptId: ESTADO,
    currencyConceptId: MONEDA,
    totalAmount: '1615.125',
    submittedAt: new Date('2026-05-01T12:00:00.000Z'),
    ...over,
  };
}

/**
 * Doble del repositorio. Devuelve listas planas: lo que se prueba acá es cómo
 * el servicio las cruza, no cómo el ORM las trae.
 */
function repo(over: Record<string, unknown> = {}) {
  return {
    findClaimsPage: mockFn().mockResolvedValue([reclamo()]),
    findClaimInScope: mockFn().mockResolvedValue(reclamo()),
    findCarriersByIds: mockFn().mockResolvedValue([
      { id: CARRIER, legalName: 'Aseguradora X' },
    ]),
    findCoveragesByIds: mockFn().mockResolvedValue([
      {
        id: COVERAGE,
        patientProfileId: PERSON,
        policyIdentifier: 'POL-1',
        memberIdentifier: 'AF-1',
        insuranceBrokerId: null,
      },
    ]),
    findLinesByClaimIds: mockFn().mockResolvedValue([]),
    findAdjudicationsByClaimIds: mockFn().mockResolvedValue([]),
    findLineAdjudications: mockFn().mockResolvedValue([]),
    findDisputesByClaimIds: mockFn().mockResolvedValue([]),
    ...over,
  };
}

/**
 * Doble del puerto de `practice`: qué prácticas tiene la organización activa.
 *
 * Es la raíz del alcance desde TAREA-16 · D1.a — la pantalla es la del
 * prestador que envió la solicitud, no la de la aseguradora que la recibió.
 */
function practiceLookup(practiceIds: string[] = [PRACTICE]) {
  return {
    findActivePracticeIdsForTenant: mockFn().mockResolvedValue(practiceIds),
  };
}

/** Doble del `EntityManager`: `fork`, `find` y `findOne`. */
function em(
  porEntidad: (nombre: string) => unknown[] = () => [],
  porEntidadUno: (nombre: string, where: any) => unknown = () => undefined,
) {
  const fork = {
    find: jest.fn((entidad: { name?: string }) =>
      Promise.resolve(porEntidad(entidad.name ?? '')),
    ),
    findOne: jest.fn((entidad: { name?: string }, where: any) =>
      Promise.resolve(porEntidadUno(entidad.name ?? '', where)),
    ),
  };
  return { fork: () => fork } as never;
}

/** Doble del detector de duplicidad (subtarea 3.2): sin duplicado por defecto. */
function duplicateStudyDetector(over: Record<string, unknown> = {}) {
  return {
    describeByReportId: mockFn().mockResolvedValue(null),
    ...over,
  };
}

/** Arma el servicio con sus cuatro dependencias dobladas. */
function servicioCon(
  r: Record<string, unknown>,
  practicas: string[] = [PRACTICE],
  detector: Record<string, unknown> = duplicateStudyDetector(),
  entidadManager: unknown = em(),
) {
  return new ClaimsReadService(
    entidadManager as never,
    r as never,
    practiceLookup(practicas) as never,
    detector as never,
  );
}

/**
 * Corre dentro de un contexto de tenant: `requireTenantId()` lanza sin él, que
 * es exactamente lo que tiene que pasar y no lo que se está probando acá.
 */
function conTenant<T>(fn: () => Promise<T>): Promise<T> {
  return runWithTenant(TENANT, fn);
}

/**
 * Captura el rechazo para poder compararlo entero.
 *
 * `rejects.toThrow` comprueba el tipo; acá hace falta el objeto para verificar
 * que dos rechazos distintos producen **el mismo cuerpo** (AC-16-14).
 */
async function rechazoDe(
  fn: () => Promise<unknown>,
): Promise<ForbiddenException> {
  let capturado: unknown;
  try {
    await fn();
  } catch (error) {
    capturado = error;
  }
  expect(capturado).toBeInstanceOf(ForbiddenException);
  return capturado as ForbiddenException;
}

describe('ClaimsReadService', () => {
  describe('alcance del prestador (TAREA-16 · D1.a)', () => {
    it('acota el listado a las prácticas de la organización, no a sus aseguradoras', async () => {
      const r = repo();

      await conTenant(() => servicioCon(r).listClaims({}));

      // La lista que llega al repositorio son PRÁCTICAS. Antes eran las
      // aseguradoras del tenant, que es el otro lado del mismo dato: desde un
      // consultorio el listado salía siempre vacío.
      expect(r.findClaimsPage).toHaveBeenCalledWith(
        expect.anything(),
        [PRACTICE],
        expect.anything(),
        expect.any(Number),
        null,
        [],
      );
    });

    it('sin prácticas activas responde 403, no una lista vacía', async () => {
      const r = repo();

      // Una organización sin prácticas no envió ninguna solicitud: la pantalla
      // no es suya. Una lista vacía se leería como «no hay solicitudes».
      await expect(
        conTenant(() => servicioCon(r, []).listClaims({})),
      ).rejects.toThrow(ForbiddenException);
      expect(r.findClaimsPage).not.toHaveBeenCalled();
    });

    it('el detalle también exige prácticas antes de consultar', async () => {
      const r = repo();

      await expect(
        conTenant(() => servicioCon(r, []).getClaim(CLAIM)),
      ).rejects.toThrow(ForbiddenException);
      expect(r.findClaimInScope).not.toHaveBeenCalled();
    });
  });

  describe('listClaims', () => {
    it('descarta la fila de sondeo y emite cursor sólo si hay más', async () => {
      const filas = Array.from({ length: 3 }, (_, i) =>
        reclamo({
          id: `0000000${i}-0000-0000-0000-000000000000`,
          claimIdentifier: `CLM-${i}`,
        }),
      );
      const r = repo({ findClaimsPage: mockFn().mockResolvedValue(filas) });

      const pagina = await conTenant(() =>
        servicioCon(r).listClaims({ limit: 2 }),
      );

      expect(pagina.items).toHaveLength(2);
      expect(pagina.nextCursor).not.toBeNull();
      // Se pide una de más: es lo que responde «hay siguiente» sin un COUNT.
      expect(r.findClaimsPage).toHaveBeenCalledWith(
        expect.anything(),
        [PRACTICE],
        expect.anything(),
        2,
        null,
        [],
      );
    });

    it('no emite cursor en la última página', async () => {
      const r = repo({
        findClaimsPage: mockFn().mockResolvedValue([reclamo()]),
      });

      const pagina = await conTenant(() =>
        servicioCon(r).listClaims({ limit: 25 }),
      );

      expect(pagina.nextCursor).toBeNull();
    });

    it('la página vacía es una lista vacía, no un rechazo', async () => {
      // Tener prácticas y no tener solicitudes es un estado legítimo: la
      // pantalla es suya y todavía no presentó nada.
      const r = repo({ findClaimsPage: mockFn().mockResolvedValue([]) });

      const pagina = await conTenant(() => servicioCon(r).listClaims({}));

      expect(pagina).toEqual({ items: [], nextCursor: null });
    });

    it('deja el total aprobado en null cuando no hay dictamen', async () => {
      const pagina = await conTenant(() => servicioCon(repo()).listClaims({}));

      // No es cero: «todavía no contestaron» y «denegaron todo» son cosas
      // distintas, y esta es la línea que lo fija.
      expect(pagina.items[0].approvedTotal).toBeNull();
    });

    it('marca reclamada sólo mientras la disputa no está resuelta', async () => {
      const r = repo({
        findDisputesByClaimIds: mockFn().mockResolvedValue([
          { id: 'd1', insuranceClaimId: CLAIM, statusConceptId: 'abierta' },
        ]),
      });

      const pagina = await conTenant(() => servicioCon(r).listClaims({}));

      expect(pagina.items[0].hasOpenDispute).toBe(true);
    });
  });

  describe('getClaim', () => {
    it('responde 403 sin detalles cuando la solicitud no está en el alcance', async () => {
      const r = repo({ findClaimInScope: mockFn().mockResolvedValue(null) });

      // AC-16-14: 403, y sin `details` — si el id viajara ahí, «no es tuya» y
      // «no existe» dejarían de ser indistinguibles. Se mira el cuerpo que el
      // filtro va a serializar, no la instancia.
      const rechazo = await rechazoDe(() =>
        conTenant(() => servicioCon(r).getClaim(CLAIM)),
      );

      expect(rechazo.getStatus()).toBe(403);
      expect(rechazo.getResponse()).not.toHaveProperty('details');
      expect(JSON.stringify(rechazo.getResponse())).not.toContain(CLAIM);
    });

    it('el rechazo de una ajena y el de una inexistente son el mismo cuerpo', async () => {
      // Los dos casos llegan igual al servicio —el repositorio devuelve `null`
      // por alcance o por inexistencia— y tienen que salir igual. Se comparan
      // status y mensaje, que es lo que el cliente puede observar.
      const ajena = repo({
        findClaimInScope: mockFn().mockResolvedValue(null),
      });
      const inexistente = repo({
        findClaimInScope: mockFn().mockResolvedValue(null),
      });

      const una = await rechazoDe(() =>
        conTenant(() => servicioCon(ajena).getClaim(CLAIM)),
      );
      const otra = await rechazoDe(() =>
        conTenant(() =>
          servicioCon(inexistente).getClaim(
            '99999999-9999-9999-9999-999999999999',
          ),
        ),
      );

      expect(una.getStatus()).toBe(otra.getStatus());
      expect(una.message).toBe(otra.message);
      expect(una.getResponse()).toEqual(otra.getResponse());
    });

    it('suma los ítems en el servidor y no toca el total declarado', async () => {
      const r = repo({
        findLinesByClaimIds: mockFn().mockResolvedValue([
          {
            id: 'l1',
            insuranceClaimId: CLAIM,
            lineSequence: 1,
            billedAmount: '1200.00',
          },
          {
            id: 'l2',
            insuranceClaimId: CLAIM,
            lineSequence: 2,
            billedAmount: '75.125',
          },
          {
            id: 'l3',
            insuranceClaimId: CLAIM,
            lineSequence: 3,
            billedAmount: '340.00',
          },
        ]),
      });

      const detalle = await conTenant(() => servicioCon(r).getClaim(CLAIM));

      // Igualdad de cadena, no de número: es el contrato de AC-16-6.
      expect(detalle.lineBilledTotal.amount).toBe('1615.125');
      expect(detalle.header.billedTotal.amount).toBe('1615.125');
      // Sin dictamen por ítem, el aprobado de la suma es ausencia y no cero.
      expect(detalle.lineApprovedTotal).toBeNull();
    });

    it('toma como vigente la versión que nadie sucede, no la de número más alto', async () => {
      // El orden de llegada es descendente por número, pero la v2 declara
      // suceder a la v3: la vigente es la v2. Tomar el máximo daría la v3.
      const r = repo({
        findAdjudicationsByClaimIds: mockFn().mockResolvedValue([
          {
            id: 'v2',
            insuranceClaimId: CLAIM,
            adjudicationVersion: 2,
            supersedesVersionId: 'v3',
            adjudicatedAt: new Date('2026-06-01T00:00:00.000Z'),
            totalApprovedAmount: '900.00',
          },
          {
            id: 'v3',
            insuranceClaimId: CLAIM,
            adjudicationVersion: 3,
            supersedesVersionId: null,
            adjudicatedAt: new Date('2026-05-01T00:00:00.000Z'),
            totalApprovedAmount: '100.00',
          },
        ]),
      });

      const detalle = await conTenant(() => servicioCon(r).getClaim(CLAIM));

      expect(detalle.adjudication?.id).toBe('v2');
      expect(detalle.adjudicationHistory).toHaveLength(2);
    });

    it('no afirma el tipo de documento cuando sólo hay una referencia de texto', async () => {
      const r = repo({
        findLinesByClaimIds: mockFn().mockResolvedValue([
          {
            id: 'l1',
            insuranceClaimId: CLAIM,
            lineSequence: 1,
            billedAmount: '10.00',
            supportingClinicalReference: 'ORD-2026-77',
          },
        ]),
      });

      const detalle = await conTenant(() => servicioCon(r).getClaim(CLAIM));

      expect(detalle.lines[0].reference).toBe('ORD-2026-77');
      // `supporting_clinical_reference` es un varchar sin integridad
      // referencial: no dice qué es, así que el tipo queda sin declarar.
      expect(detalle.lines[0].referenceType).toBeNull();
    });

    it('declara el tipo cuando sí hay clave foránea', async () => {
      const r = repo({
        findLinesByClaimIds: mockFn().mockResolvedValue([
          {
            id: 'l1',
            insuranceClaimId: CLAIM,
            lineSequence: 1,
            billedAmount: '10.00',
            diagnosticStudyOfferingId: 'off-1',
          },
        ]),
      });

      const detalle = await conTenant(() => servicioCon(r).getClaim(CLAIM));

      expect(detalle.lines[0].referenceType).toBe('DIAGNOSTIC_STUDY');
      expect(detalle.lines[0].reference).toBe('off-1');
    });

    /**
     * `policyClauseReference`/`denialRationale` — subtarea 2.2. La cita de la
     * cláusula y la justificación viven en la adjudicación de línea y viajan
     * tal cual al DTO de lectura, sin tocar los importes.
     */
    it('lleva la cláusula y la justificación de la adjudicación de línea', async () => {
      const r = repo({
        findLinesByClaimIds: mockFn().mockResolvedValue([
          {
            id: 'l1',
            insuranceClaimId: CLAIM,
            lineSequence: 1,
            billedAmount: '120.00',
          },
        ]),
        findAdjudicationsByClaimIds: mockFn().mockResolvedValue([
          {
            id: 'v1',
            insuranceClaimId: CLAIM,
            adjudicationVersion: 1,
            supersedesVersionId: null,
            adjudicatedAt: new Date('2026-09-01T00:00:00.000Z'),
          },
        ]),
        findLineAdjudications: mockFn().mockResolvedValue([
          {
            insuranceClaimLineId: 'l1',
            decisionConceptId: 'dec-denied',
            approvedAmount: '0.00',
            deniedAmount: '120.00',
            policyClauseReference: 'Cláusula 12.3: Fármaco fuera de vademécum',
            denialRationale: 'Requiere autorización previa según la póliza.',
          },
        ]),
      });

      const detalle = await conTenant(() => servicioCon(r).getClaim(CLAIM));

      expect(detalle.lines[0].policyClauseReference).toBe(
        'Cláusula 12.3: Fármaco fuera de vademécum',
      );
      expect(detalle.lines[0].denialRationale).toBe(
        'Requiere autorización previa según la póliza.',
      );
      // Los importes no se alteran por agregar la cláusula.
      expect(detalle.lines[0].deniedAmount?.amount).toBe('120.00');
    });

    it('sin adjudicación de línea, la cláusula y la justificación quedan en null, no undefined', async () => {
      const r = repo({
        findLinesByClaimIds: mockFn().mockResolvedValue([
          {
            id: 'l1',
            insuranceClaimId: CLAIM,
            lineSequence: 1,
            billedAmount: '10.00',
          },
        ]),
      });

      const detalle = await conTenant(() => servicioCon(r).getClaim(CLAIM));

      expect(detalle.lines[0].policyClauseReference).toBeNull();
      expect(detalle.lines[0].denialRationale).toBeNull();
    });

    it('trae los canales de contacto de la aseguradora en la cabecera (subtarea 2.3)', async () => {
      const r = repo({
        findCarriersByIds: mockFn().mockResolvedValue([
          {
            id: CARRIER,
            legalName: 'Aseguradora X',
            whatsappNumber: '+59171548278',
            callCenterPhone: '800-10-6060',
            supportEmail: 'siniestros@aseguradora.com.bo',
          },
        ]),
      });

      const detalle = await conTenant(() => servicioCon(r).getClaim(CLAIM));

      expect(detalle.header.carrierWhatsappNumber).toBe('+59171548278');
      expect(detalle.header.carrierCallCenterPhone).toBe('800-10-6060');
      expect(detalle.header.carrierSupportEmail).toBe(
        'siniestros@aseguradora.com.bo',
      );
    });

    it('sin canales registrados por la aseguradora, los tres quedan en null', async () => {
      const r = repo();

      const detalle = await conTenant(() => servicioCon(r).getClaim(CLAIM));

      expect(detalle.header.carrierWhatsappNumber).toBeNull();
      expect(detalle.header.carrierCallCenterPhone).toBeNull();
      expect(detalle.header.carrierSupportEmail).toBeNull();
    });
  });

  describe('antiduplicación de estudios (subtarea 3.2, T-26)', () => {
    const UNIT = 'unit-1';
    const ORDER = 'sr-1';
    const REPORT = 'report-1';

    /** `em()` con una unidad diagnóstica activa del tenant. */
    function emConUnidad() {
      return em((nombre) =>
        nombre === 'DiagnosticUnits' ? [{ id: UNIT }] : [],
      );
    }

    it('amplía el alcance a las unidades diagnósticas activas del tenant', async () => {
      const r = repo();

      await conTenant(() =>
        servicioCon(r, [], duplicateStudyDetector(), emConUnidad()).listClaims(
          {},
        ),
      );

      expect(r.findClaimsPage).toHaveBeenCalledWith(
        expect.anything(),
        [],
        expect.anything(),
        expect.any(Number),
        null,
        [UNIT],
      );
    });

    it('sin prácticas ni unidades diagnósticas activas, responde 403', async () => {
      const r = repo();

      await expect(
        conTenant(() => servicioCon(r, []).listClaims({})),
      ).rejects.toThrow(ForbiddenException);
      expect(r.findClaimsPage).not.toHaveBeenCalled();
    });

    it('resuelve duplicateStudy cuando la orden de origen está enlazada a un informe previo', async () => {
      const orderById = (nombre: string, where: any) =>
        nombre === 'ServiceRequests' && where.id === ORDER
          ? {
              id: ORDER,
              previousDiagnosticReportId: REPORT,
              duplicateOverrideReason: 'Control post-quirúrgico inmediato',
              createdAt: new Date('2026-09-10T09:00:00.000Z'),
            }
          : undefined;

      const r = repo({
        findClaimInScope: mockFn().mockResolvedValue(
          reclamo({ serviceRequestId: ORDER }),
        ),
        findLinesByClaimIds: mockFn().mockResolvedValue([
          {
            id: 'l1',
            insuranceClaimId: CLAIM,
            lineSequence: 1,
            billedAmount: '350.00',
          },
        ]),
      });
      const detector = duplicateStudyDetector({
        describeByReportId: mockFn().mockResolvedValue({
          reportId: REPORT,
          studyName: 'Ecografía abdominal',
          providerName: 'Centro San Gabriel',
          performedAt: new Date('2026-08-27T09:00:00.000Z'),
          daysAgo: 14,
          resultsAvailable: true,
          conclusionText: null,
          reportDownloadUrl: null,
          sameOrganization: true,
          serviceRequestId: null,
        }),
      });

      const detalle = await conTenant(() =>
        servicioCon(
          r,
          [PRACTICE],
          detector,
          em(() => [], orderById),
        ).getClaim(CLAIM),
      );

      expect(detalle.lines[0].duplicateStudy).toEqual({
        previousDiagnosticReportId: REPORT,
        studyName: 'Ecografía abdominal',
        performedAt: new Date('2026-08-27T09:00:00.000Z'),
        daysAgo: 14,
        providerName: 'Centro San Gabriel',
        justification: 'Control post-quirúrgico inmediato',
        reused: false,
      });
    });

    it('duplicateStudy es null cuando la orden no tiene enlace', async () => {
      const r = repo({
        findClaimInScope: mockFn().mockResolvedValue(
          reclamo({ serviceRequestId: ORDER }),
        ),
        findLinesByClaimIds: mockFn().mockResolvedValue([
          {
            id: 'l1',
            insuranceClaimId: CLAIM,
            lineSequence: 1,
            billedAmount: '350.00',
          },
        ]),
      });
      const orderSinEnlace = (nombre: string, where: any) =>
        nombre === 'ServiceRequests' && where.id === ORDER
          ? { id: ORDER, previousDiagnosticReportId: undefined }
          : undefined;

      const detalle = await conTenant(() =>
        servicioCon(
          r,
          [PRACTICE],
          duplicateStudyDetector(),
          em(() => [], orderSinEnlace),
        ).getClaim(CLAIM),
      );

      expect(detalle.lines[0].duplicateStudy).toBeNull();
    });

    it('duplicateStudy es null cuando la solicitud no viene de una orden', async () => {
      const r = repo({
        findLinesByClaimIds: mockFn().mockResolvedValue([
          {
            id: 'l1',
            insuranceClaimId: CLAIM,
            lineSequence: 1,
            billedAmount: '350.00',
          },
        ]),
      });

      const detalle = await conTenant(() => servicioCon(r).getClaim(CLAIM));

      expect(detalle.lines[0].duplicateStudy).toBeNull();
    });

    it('marca reused=true cuando la orden reutilizó el informe (sin justificación)', async () => {
      const orderReutilizada = (nombre: string, where: any) =>
        nombre === 'ServiceRequests' && where.id === ORDER
          ? {
              id: ORDER,
              previousDiagnosticReportId: REPORT,
              duplicateOverrideReason: undefined,
              createdAt: new Date('2026-09-10T09:00:00.000Z'),
            }
          : undefined;

      const r = repo({
        findClaimInScope: mockFn().mockResolvedValue(
          reclamo({ serviceRequestId: ORDER }),
        ),
        findLinesByClaimIds: mockFn().mockResolvedValue([
          {
            id: 'l1',
            insuranceClaimId: CLAIM,
            lineSequence: 1,
            billedAmount: '350.00',
          },
        ]),
      });
      const detector = duplicateStudyDetector({
        describeByReportId: mockFn().mockResolvedValue({
          reportId: REPORT,
          studyName: 'Ecografía abdominal',
          providerName: 'Centro San Gabriel',
          performedAt: new Date('2026-08-27T09:00:00.000Z'),
          daysAgo: 14,
          resultsAvailable: true,
          conclusionText: null,
          reportDownloadUrl: null,
          sameOrganization: true,
          serviceRequestId: null,
        }),
      });

      const detalle = await conTenant(() =>
        servicioCon(
          r,
          [PRACTICE],
          detector,
          em(() => [], orderReutilizada),
        ).getClaim(CLAIM),
      );

      expect(detalle.lines[0].duplicateStudy?.reused).toBe(true);
      expect(detalle.lines[0].duplicateStudy?.justification).toBeNull();
    });
  });
});
