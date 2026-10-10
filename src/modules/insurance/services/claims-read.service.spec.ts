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
const CURRENCY = '66666666-6666-6666-6666-666666666666';
const STATUS = '77777777-7777-7777-7777-777777777777';
const PRACTICE = '88888888-8888-8888-8888-888888888888';

/** Un reclamo mínimo, con lo que la lectura mira de verdad. */
function claim(over: Record<string, unknown> = {}) {
  return {
    id: CLAIM,
    claimIdentifier: 'CLM-1',
    insuranceCarrierId: CARRIER,
    patientCoverageId: COVERAGE,
    billingProviderTypeConceptId: INS.BILLING_PROVIDER_TYPE_PRACTICE,
    billingProviderEntityId: PRACTICE,
    statusConceptId: STATUS,
    currencyConceptId: CURRENCY,
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
    findClaimsPage: mockFn().mockResolvedValue([claim()]),
    findClaimInScope: mockFn().mockResolvedValue(claim()),
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
    findEobsByVersionIds: mockFn().mockResolvedValue([]),
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
  byEntity: (name: string) => unknown[] = () => [],
  byEntityOne: (name: string, where: any) => unknown = () => undefined,
) {
  const fork = {
    find: jest.fn((entity: { name?: string }) =>
      Promise.resolve(byEntity(entity.name ?? '')),
    ),
    findOne: jest.fn((entity: { name?: string }, where: any) =>
      Promise.resolve(byEntityOne(entity.name ?? '', where)),
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

/** Doble del catálogo de aseguradoras: no es aseguradora por omisión. */
function catalogRepo(over: Record<string, unknown> = {}) {
  return {
    findCarrierByTenantId: mockFn().mockResolvedValue(null),
    ...over,
  };
}

/** Arma el servicio con sus cinco dependencias dobladas. */
function serviceWith(
  r: Record<string, unknown>,
  practices: string[] = [PRACTICE],
  detector: Record<string, unknown> = duplicateStudyDetector(),
  entityManager: unknown = em(),
  catalog: Record<string, unknown> = catalogRepo(),
) {
  return new ClaimsReadService(
    entityManager as never,
    r as never,
    practiceLookup(practices) as never,
    detector as never,
    catalog as never,
  );
}

/**
 * Corre dentro de un contexto de tenant: `requireTenantId()` lanza sin él, que
 * es exactamente lo que tiene que pasar y no lo que se está probando acá.
 */
function withTenant<T>(fn: () => Promise<T>): Promise<T> {
  return runWithTenant(TENANT, fn);
}

/**
 * Captura el rechazo para poder compararlo entero.
 *
 * `rejects.toThrow` comprueba el tipo; acá hace falta el objeto para verificar
 * que dos rechazos distintos producen **el mismo cuerpo** (AC-16-14).
 */
async function rejection(
  fn: () => Promise<unknown>,
): Promise<ForbiddenException> {
  let captured: unknown;
  try {
    await fn();
  } catch (error) {
    captured = error;
  }
  expect(captured).toBeInstanceOf(ForbiddenException);
  return captured as ForbiddenException;
}

describe('ClaimsReadService', () => {
  describe('alcance del prestador (TAREA-16 · D1.a)', () => {
    it('acota el listado a las prácticas de la organización, no a sus aseguradoras', async () => {
      const r = repo();

      await withTenant(() => serviceWith(r).listClaims({}));

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
        withTenant(() => serviceWith(r, []).listClaims({})),
      ).rejects.toThrow(ForbiddenException);
      expect(r.findClaimsPage).not.toHaveBeenCalled();
    });

    it('el detalle también exige prácticas antes de consultar', async () => {
      const r = repo();

      await expect(
        withTenant(() => serviceWith(r, []).getClaim(CLAIM)),
      ).rejects.toThrow(ForbiddenException);
      expect(r.findClaimInScope).not.toHaveBeenCalled();
    });
  });

  describe('alcance de la aseguradora (bandeja de solicitudes recibidas)', () => {
    it('cuando el tenant es aseguradora, acota por insuranceCarrierId sin requerir prácticas', async () => {
      const r = repo();
      const catalog = catalogRepo({
        findCarrierByTenantId: mockFn().mockResolvedValue({ id: CARRIER }),
      });

      await withTenant(() =>
        serviceWith(r, [], duplicateStudyDetector(), em(), catalog).listClaims(
          {},
        ),
      );

      expect(r.findClaimsPage).toHaveBeenCalledWith(
        expect.anything(),
        [],
        expect.objectContaining({ insuranceCarrierId: undefined }),
        expect.any(Number),
        null,
        [],
        CARRIER,
      );
    });

    it('la aseguradora puede consultar el detalle de sus solicitudes recibidas', async () => {
      const r = repo();
      const catalog = catalogRepo({
        findCarrierByTenantId: mockFn().mockResolvedValue({ id: CARRIER }),
      });

      const res = await withTenant(() =>
        serviceWith(r, [], duplicateStudyDetector(), em(), catalog).getClaim(
          CLAIM,
        ),
      );

      expect(r.findClaimInScope).toHaveBeenCalledWith(
        expect.anything(),
        [],
        CLAIM,
        [],
        CARRIER,
      );
      expect(res.header.id).toBe(CLAIM);
    });
  });

  describe('listClaims', () => {
    it('descarta la fila de sondeo y emite cursor sólo si hay más', async () => {
      const rows = Array.from({ length: 3 }, (_, i) =>
        claim({
          id: `0000000${i}-0000-0000-0000-000000000000`,
          claimIdentifier: `CLM-${i}`,
        }),
      );
      const r = repo({ findClaimsPage: mockFn().mockResolvedValue(rows) });

      const page = await withTenant(() =>
        serviceWith(r).listClaims({ limit: 2 }),
      );

      expect(page.items).toHaveLength(2);
      expect(page.nextCursor).not.toBeNull();
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
        findClaimsPage: mockFn().mockResolvedValue([claim()]),
      });

      const page = await withTenant(() =>
        serviceWith(r).listClaims({ limit: 25 }),
      );

      expect(page.nextCursor).toBeNull();
    });

    it('la página vacía es una lista vacía, no un rechazo', async () => {
      // Tener prácticas y no tener solicitudes es un estado legítimo: la
      // pantalla es suya y todavía no presentó nada.
      const r = repo({ findClaimsPage: mockFn().mockResolvedValue([]) });

      const page = await withTenant(() => serviceWith(r).listClaims({}));

      expect(page).toEqual({ items: [], nextCursor: null });
    });

    it('deja el total aprobado en null cuando no hay dictamen', async () => {
      const page = await withTenant(() => serviceWith(repo()).listClaims({}));

      // No es cero: «todavía no contestaron» y «denegaron todo» son cosas
      // distintas, y esta es la línea que lo fija.
      expect(page.items[0].approvedTotal).toBeNull();
    });

    it('marca reclamada sólo mientras la disputa no está resuelta', async () => {
      const r = repo({
        findDisputesByClaimIds: mockFn().mockResolvedValue([
          { id: 'd1', insuranceClaimId: CLAIM, statusConceptId: 'abierta' },
        ]),
      });

      const page = await withTenant(() => serviceWith(r).listClaims({}));

      expect(page.items[0].hasOpenDispute).toBe(true);
    });
  });

  describe('getClaim', () => {
    it('responde 403 sin detalles cuando la solicitud no está en el alcance', async () => {
      const r = repo({ findClaimInScope: mockFn().mockResolvedValue(null) });

      // AC-16-14: 403, y sin `details` — si el id viajara ahí, «no es tuya» y
      // «no existe» dejarían de ser indistinguibles. Se mira el cuerpo que el
      // filtro va a serializar, no la instancia.
      const rejectionError = await rejection(() =>
        withTenant(() => serviceWith(r).getClaim(CLAIM)),
      );

      expect(rejectionError.getStatus()).toBe(403);
      expect(rejectionError.getResponse()).not.toHaveProperty('details');
      expect(JSON.stringify(rejectionError.getResponse())).not.toContain(CLAIM);
    });

    it('el rechazo de una ajena y el de una inexistente son el mismo cuerpo', async () => {
      // Los dos casos llegan igual al servicio —el repositorio devuelve `null`
      // por alcance o por inexistencia— y tienen que salir igual. Se comparan
      // status y mensaje, que es lo que el cliente puede observar.
      const foreign = repo({
        findClaimInScope: mockFn().mockResolvedValue(null),
      });
      const nonexistent = repo({
        findClaimInScope: mockFn().mockResolvedValue(null),
      });

      const una = await rejection(() =>
        withTenant(() => serviceWith(foreign).getClaim(CLAIM)),
      );
      const other = await rejection(() =>
        withTenant(() =>
          serviceWith(nonexistent).getClaim(
            '99999999-9999-9999-9999-999999999999',
          ),
        ),
      );

      expect(una.getStatus()).toBe(other.getStatus());
      expect(una.message).toBe(other.message);
      expect(una.getResponse()).toEqual(other.getResponse());
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

      const detail = await withTenant(() => serviceWith(r).getClaim(CLAIM));

      // Igualdad de cadena, no de número: es el contrato de AC-16-6.
      expect(detail.lineBilledTotal.amount).toBe('1615.125');
      expect(detail.header.billedTotal.amount).toBe('1615.125');
      // Sin dictamen por ítem, el aprobado de la suma es ausencia y no cero.
      expect(detail.lineApprovedTotal).toBeNull();
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

      const detail = await withTenant(() => serviceWith(r).getClaim(CLAIM));

      expect(detail.adjudication?.id).toBe('v2');
      expect(detail.adjudicationHistory).toHaveLength(2);
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

      const detail = await withTenant(() => serviceWith(r).getClaim(CLAIM));

      expect(detail.lines[0].reference).toBe('ORD-2026-77');
      // `supporting_clinical_reference` es un varchar sin integridad
      // referencial: no dice qué es, así que el tipo queda sin declarar.
      expect(detail.lines[0].referenceType).toBeNull();
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

      const detail = await withTenant(() => serviceWith(r).getClaim(CLAIM));

      expect(detail.lines[0].referenceType).toBe('DIAGNOSTIC_STUDY');
      expect(detail.lines[0].reference).toBe('off-1');
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

      const detail = await withTenant(() => serviceWith(r).getClaim(CLAIM));

      expect(detail.lines[0].policyClauseReference).toBe(
        'Cláusula 12.3: Fármaco fuera de vademécum',
      );
      expect(detail.lines[0].denialRationale).toBe(
        'Requiere autorización previa según la póliza.',
      );
      // Los importes no se alteran por agregar la cláusula.
      expect(detail.lines[0].deniedAmount?.amount).toBe('120.00');
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

      const detail = await withTenant(() => serviceWith(r).getClaim(CLAIM));

      expect(detail.lines[0].policyClauseReference).toBeNull();
      expect(detail.lines[0].denialRationale).toBeNull();
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

      const detail = await withTenant(() => serviceWith(r).getClaim(CLAIM));

      expect(detail.header.carrierWhatsappNumber).toBe('+59171548278');
      expect(detail.header.carrierCallCenterPhone).toBe('800-10-6060');
      expect(detail.header.carrierSupportEmail).toBe(
        'siniestros@aseguradora.com.bo',
      );
    });

    it('sin canales registrados por la aseguradora, los tres quedan en null', async () => {
      const r = repo();

      const detail = await withTenant(() => serviceWith(r).getClaim(CLAIM));

      expect(detail.header.carrierWhatsappNumber).toBeNull();
      expect(detail.header.carrierCallCenterPhone).toBeNull();
      expect(detail.header.carrierSupportEmail).toBeNull();
    });
  });

  /** Desglose conciliado de liquidación (Tarea 3 · H8, CA-3.1/CA-3.3/CA-3.4). */
  describe('desglose de liquidación (Tarea 3 · H8)', () => {
    it('un reclamo parcialmente aprobado con EOB publicada concilia los tres importes', async () => {
      const r = repo({
        findClaimInScope: mockFn().mockResolvedValue(
          claim({
            statusConceptId: INS.CLAIM_ADJUDICATED,
            totalAmount: '300.00',
          }),
        ),
        findLinesByClaimIds: mockFn().mockResolvedValue([
          {
            id: 'l1',
            insuranceClaimId: CLAIM,
            lineSequence: 1,
            billedAmount: '180.00',
          },
          {
            id: 'l2',
            insuranceClaimId: CLAIM,
            lineSequence: 2,
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
            totalApprovedAmount: '150.00',
            totalPatientAmount: '30.00',
            totalDeniedAmount: '120.00',
          },
        ]),
        findLineAdjudications: mockFn().mockResolvedValue([
          {
            insuranceClaimLineId: 'l1',
            decisionConceptId: INS.LINE_DECISION_APPROVED,
            approvedAmount: '150.00',
            patientAmount: '30.00',
            deniedAmount: '0.00',
          },
          {
            insuranceClaimLineId: 'l2',
            decisionConceptId: INS.LINE_DECISION_DENIED,
            approvedAmount: '0.00',
            patientAmount: '0.00',
            deniedAmount: '120.00',
            policyClauseReference:
              'Cláusula 12.3: estudios complementarios sin autorización previa',
          },
        ]),
        findEobsByVersionIds: mockFn().mockResolvedValue([
          {
            id: 'eob-1',
            claimAdjudicationVersionId: 'v1',
            statusConceptId: INS.EOB_PUBLISHED,
            publishedAt: new Date('2026-09-02T00:00:00.000Z'),
          },
        ]),
      });

      const detail = await withTenant(() => serviceWith(r).getClaim(CLAIM));

      expect(detail.settlement.availability).toBe('AVAILABLE');
      expect(detail.settlement.reconciled).toBe(true);
      expect(detail.settlement.totalBilledAmount).toBe('300.00');
      expect(detail.settlement.totalApprovedAmount).toBe('150.00');
      expect(detail.settlement.totalPatientAmount).toBe('30.00');
      expect(detail.settlement.totalDeniedAmount).toBe('120.00');
      expect(detail.settlement.exclusions).toHaveLength(1);
      expect(detail.settlement.exclusions[0]?.policyClauseReference).toBe(
        'Cláusula 12.3: estudios complementarios sin autorización previa',
      );
      expect(detail.eob).toEqual({
        id: 'eob-1',
        publishedAt: '2026-09-02T00:00:00.000Z',
      });
    });

    it('sin versión de adjudicación, la liquidación está pendiente de publicación', async () => {
      const r = repo();

      const detail = await withTenant(() => serviceWith(r).getClaim(CLAIM));

      expect(detail.settlement.availability).toBe('PENDING_PUBLICATION');
      expect(detail.settlement.totalApprovedAmount).toBeNull();
      expect(detail.eob).toBeNull();
    });

    it('una exclusión sin cláusula degrada la liquidación a revisión', async () => {
      const r = repo({
        findLinesByClaimIds: mockFn().mockResolvedValue([
          {
            id: 'l1',
            insuranceClaimId: CLAIM,
            lineSequence: 1,
            billedAmount: '100.00',
          },
        ]),
        findAdjudicationsByClaimIds: mockFn().mockResolvedValue([
          {
            id: 'v1',
            insuranceClaimId: CLAIM,
            adjudicationVersion: 1,
            supersedesVersionId: null,
            adjudicatedAt: new Date('2026-09-01T00:00:00.000Z'),
            totalApprovedAmount: '0.00',
            totalPatientAmount: '0.00',
            totalDeniedAmount: '100.00',
          },
        ]),
        findLineAdjudications: mockFn().mockResolvedValue([
          {
            insuranceClaimLineId: 'l1',
            decisionConceptId: INS.LINE_DECISION_DENIED,
            approvedAmount: '0.00',
            patientAmount: '0.00',
            deniedAmount: '100.00',
            policyClauseReference: '   ',
          },
        ]),
        findEobsByVersionIds: mockFn().mockResolvedValue([
          {
            id: 'eob-1',
            claimAdjudicationVersionId: 'v1',
            statusConceptId: INS.EOB_PUBLISHED,
            publishedAt: new Date('2026-09-02T00:00:00.000Z'),
          },
        ]),
      });

      const detail = await withTenant(() => serviceWith(r).getClaim(CLAIM));

      expect(detail.settlement.availability).toBe('UNDER_REVIEW');
      expect(detail.settlement.reconciled).toBe(false);
      expect(detail.settlement.exclusions).toHaveLength(0);
    });
  });

  describe('antiduplicación de estudios (subtarea 3.2, T-26)', () => {
    const UNIT = 'unit-1';
    const ORDER = 'sr-1';
    const REPORT = 'report-1';

    /** `em()` con una unidad diagnóstica activa del tenant. */
    function emWithUnit() {
      return em((name) => (name === 'DiagnosticUnits' ? [{ id: UNIT }] : []));
    }

    it('amplía el alcance a las unidades diagnósticas activas del tenant', async () => {
      const r = repo();

      await withTenant(() =>
        serviceWith(r, [], duplicateStudyDetector(), emWithUnit()).listClaims(
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
        withTenant(() => serviceWith(r, []).listClaims({})),
      ).rejects.toThrow(ForbiddenException);
      expect(r.findClaimsPage).not.toHaveBeenCalled();
    });

    it('resuelve duplicateStudy cuando la orden de origen está enlazada a un informe previo', async () => {
      const orderById = (name: string, where: any) =>
        name === 'ServiceRequests' && where.id === ORDER
          ? {
              id: ORDER,
              previousDiagnosticReportId: REPORT,
              duplicateOverrideReason: 'Control post-quirúrgico inmediato',
              createdAt: new Date('2026-09-10T09:00:00.000Z'),
            }
          : undefined;

      const r = repo({
        findClaimInScope: mockFn().mockResolvedValue(
          claim({ serviceRequestId: ORDER }),
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

      const detail = await withTenant(() =>
        serviceWith(
          r,
          [PRACTICE],
          detector,
          em(() => [], orderById),
        ).getClaim(CLAIM),
      );

      expect(detail.lines[0].duplicateStudy).toEqual({
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
          claim({ serviceRequestId: ORDER }),
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
      const orderWithoutLink = (name: string, where: any) =>
        name === 'ServiceRequests' && where.id === ORDER
          ? { id: ORDER, previousDiagnosticReportId: undefined }
          : undefined;

      const detail = await withTenant(() =>
        serviceWith(
          r,
          [PRACTICE],
          duplicateStudyDetector(),
          em(() => [], orderWithoutLink),
        ).getClaim(CLAIM),
      );

      expect(detail.lines[0].duplicateStudy).toBeNull();
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

      const detail = await withTenant(() => serviceWith(r).getClaim(CLAIM));

      expect(detail.lines[0].duplicateStudy).toBeNull();
    });

    it('marca reused=true cuando la orden reutilizó el informe (sin justificación)', async () => {
      const orderReused = (name: string, where: any) =>
        name === 'ServiceRequests' && where.id === ORDER
          ? {
              id: ORDER,
              previousDiagnosticReportId: REPORT,
              duplicateOverrideReason: undefined,
              createdAt: new Date('2026-09-10T09:00:00.000Z'),
            }
          : undefined;

      const r = repo({
        findClaimInScope: mockFn().mockResolvedValue(
          claim({ serviceRequestId: ORDER }),
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

      const detail = await withTenant(() =>
        serviceWith(
          r,
          [PRACTICE],
          detector,
          em(() => [], orderReused),
        ).getClaim(CLAIM),
      );

      expect(detail.lines[0].duplicateStudy?.reused).toBe(true);
      expect(detail.lines[0].duplicateStudy?.justification).toBeNull();
    });
  });
});
