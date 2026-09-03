import { jest } from '@jest/globals';
import { ResourceNotFoundException, runWithTenant } from '../../../common';
import { ClaimsReadService } from './claims-read.service';

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

/** Un reclamo mínimo, con lo que la lectura mira de verdad. */
function reclamo(over: Record<string, unknown> = {}) {
  return {
    id: CLAIM,
    claimIdentifier: 'CLM-1',
    insuranceCarrierId: CARRIER,
    patientCoverageId: COVERAGE,
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
    findCarrierIdsByTenant: mockFn().mockResolvedValue([CARRIER]),
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

/** Doble del `EntityManager`: sólo hace falta `fork` y `find`. */
function em(porEntidad: (nombre: string) => unknown[] = () => []) {
  const fork = {
    find: jest.fn((entidad: { name?: string }) =>
      Promise.resolve(porEntidad(entidad.name ?? '')),
    ),
  };
  return { fork: () => fork } as never;
}

/**
 * Corre dentro de un contexto de tenant: `requireTenantId()` lanza sin él, que
 * es exactamente lo que tiene que pasar y no lo que se está probando acá.
 */
function conTenant<T>(fn: () => Promise<T>): Promise<T> {
  return runWithTenant(TENANT, fn);
}

describe('ClaimsReadService', () => {
  describe('listClaims', () => {
    it('sin aseguradoras del tenant no consulta solicitudes', async () => {
      const r = repo({
        findCarrierIdsByTenant: mockFn().mockResolvedValue([]),
      });
      const servicio = new ClaimsReadService(em(), r as never);

      const pagina = await conTenant(() => servicio.listClaims({}));

      expect(pagina).toEqual({ items: [], nextCursor: null });
      // El alcance vacío corta antes de pedir nada: no es un filtro en
      // memoria, es no preguntar.
      expect(r.findClaimsPage).not.toHaveBeenCalled();
    });

    it('descarta la fila de sondeo y emite cursor sólo si hay más', async () => {
      const filas = Array.from({ length: 3 }, (_, i) =>
        reclamo({
          id: `0000000${i}-0000-0000-0000-000000000000`,
          claimIdentifier: `CLM-${i}`,
        }),
      );
      const r = repo({ findClaimsPage: mockFn().mockResolvedValue(filas) });
      const servicio = new ClaimsReadService(em(), r as never);

      const pagina = await conTenant(() => servicio.listClaims({ limit: 2 }));

      expect(pagina.items).toHaveLength(2);
      expect(pagina.nextCursor).not.toBeNull();
      // Se pide una de más: es lo que responde «hay siguiente» sin un COUNT.
      expect(r.findClaimsPage).toHaveBeenCalledWith(
        expect.anything(),
        [CARRIER],
        expect.anything(),
        2,
        null,
      );
    });

    it('no emite cursor en la última página', async () => {
      const r = repo({
        findClaimsPage: mockFn().mockResolvedValue([reclamo()]),
      });
      const servicio = new ClaimsReadService(em(), r as never);

      const pagina = await conTenant(() => servicio.listClaims({ limit: 25 }));

      expect(pagina.nextCursor).toBeNull();
    });

    it('deja el total aprobado en null cuando no hay dictamen', async () => {
      const servicio = new ClaimsReadService(em(), repo() as never);

      const pagina = await conTenant(() => servicio.listClaims({}));

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
      const servicio = new ClaimsReadService(em(), r as never);

      const pagina = await conTenant(() => servicio.listClaims({}));

      expect(pagina.items[0].hasOpenDispute).toBe(true);
    });
  });

  describe('getClaim', () => {
    it('responde 404 sin detalles cuando la solicitud no está en el alcance', async () => {
      const r = repo({ findClaimInScope: mockFn().mockResolvedValue(null) });
      const servicio = new ClaimsReadService(em(), r as never);

      // Sin `details`: si el id viajara ahí, «no es tuya» y «no existe»
      // dejarían de ser indistinguibles.
      await expect(conTenant(() => servicio.getClaim(CLAIM))).rejects.toThrow(
        ResourceNotFoundException,
      );
      await expect(
        conTenant(() => servicio.getClaim(CLAIM)),
      ).rejects.toMatchObject({ details: undefined });
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
      const servicio = new ClaimsReadService(em(), r as never);

      const detalle = await conTenant(() => servicio.getClaim(CLAIM));

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
      const servicio = new ClaimsReadService(em(), r as never);

      const detalle = await conTenant(() => servicio.getClaim(CLAIM));

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
      const servicio = new ClaimsReadService(em(), r as never);

      const detalle = await conTenant(() => servicio.getClaim(CLAIM));

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
      const servicio = new ClaimsReadService(em(), r as never);

      const detalle = await conTenant(() => servicio.getClaim(CLAIM));

      expect(detalle.lines[0].referenceType).toBe('DIAGNOSTIC_STUDY');
      expect(detalle.lines[0].reference).toBe('off-1');
    });
  });
});
