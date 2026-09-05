import { jest } from '@jest/globals';
import { ForbiddenException } from '@nestjs/common';
import { runWithTenant } from '../../../common';
import { ClaimsService } from './claims.service';
import { INS } from '../insurance.concepts';

/** Mock laxo, como en el resto de los specs del módulo. */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const TENANT = '11111111-1111-1111-1111-111111111111';
const CLAIM = '33333333-3333-3333-3333-333333333333';
const PRACTICE = '88888888-8888-8888-8888-888888888888';
const OTRA_PRACTICE = '99999999-9999-9999-9999-999999999999';
const VERSION = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

const actor = { id: 'user-1', roles: ['BILLING_OPERATOR'] } as never;

/** Un reclamo presentado por `PRACTICE`. */
function reclamo(over: Record<string, unknown> = {}) {
  return {
    id: CLAIM,
    billingProviderTypeConceptId: INS.BILLING_PROVIDER_TYPE_PRACTICE,
    billingProviderEntityId: PRACTICE,
    statusConceptId: INS.CLAIM_ADJUDICATED,
    ...over,
  };
}

/**
 * Doble del `EntityManager`: `transactional` corre el callback con el mismo
 * doble, que es lo que este servicio necesita.
 */
function em() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  return {
    transactional: (fn: (t: unknown) => Promise<unknown>) => fn(tx),
  } as never;
}

function repo(over: Record<string, unknown> = {}) {
  return {
    findClaimForUpdate: mockFn().mockResolvedValue(reclamo()),
    findOpenDispute: mockFn().mockResolvedValue(null),
    createDispute: mockFn((_tx: unknown, data: Record<string, unknown>) => ({
      id: 'disputa-nueva',
      statusConceptId: data.statusConceptId,
      createdAt: new Date('2026-09-04T00:00:00.000Z'),
    })),
    ...over,
  };
}

function practiceLookup(practiceIds: string[] = [PRACTICE]) {
  return {
    findActivePracticeIdsForTenant: mockFn().mockResolvedValue(practiceIds),
  };
}

const logger = { setContext: mockFn(), info: mockFn() } as never;

function servicioCon(
  r: Record<string, unknown>,
  practicas: string[] = [PRACTICE],
) {
  return new ClaimsService(
    em(),
    r as never,
    {} as never,
    {} as never,
    practiceLookup(practicas) as never,
    logger,
  );
}

function conTenant<T>(fn: () => Promise<T>): Promise<T> {
  return runWithTenant(TENANT, fn);
}

/** Captura el rechazo para poder comparar dos cuerpos entre sí (AC-16-14). */
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

const dto = {
  claimAdjudicationVersionId: VERSION,
  initiatedBy: 'PROVIDER',
} as never;

/**
 * «Reclamar» (UC-26-11) tras TAREA-16: es el acto del **prestador** que
 * presentó la solicitud, con el alcance y la idempotencia que eso exige.
 */
describe('ClaimsService.openDispute', () => {
  describe('alcance del prestador (D1.a)', () => {
    it('abre la disputa cuando la solicitud la envió una práctica propia', async () => {
      const r = repo();

      const resultado = await conTenant(() =>
        servicioCon(r).openDispute(CLAIM, dto, actor),
      );

      expect(resultado.id).toBe('disputa-nueva');
      expect(r.createDispute).toHaveBeenCalledTimes(1);
      // La disputa la inicia el prestador, que es quien opera esta pantalla.
      expect(r.createDispute).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          insuranceClaimId: CLAIM,
          initiatedByPartyTypeConceptId: INS.PARTY_PROVIDER,
          statusConceptId: INS.DISPUTE_OPEN,
        }),
      );
    });

    it('rechaza con 403 la solicitud que envió otra organización', async () => {
      const r = repo({
        findClaimForUpdate: mockFn().mockResolvedValue(
          reclamo({ billingProviderEntityId: OTRA_PRACTICE }),
        ),
      });

      await expect(
        conTenant(() => servicioCon(r).openDispute(CLAIM, dto, actor)),
      ).rejects.toThrow(ForbiddenException);
      expect(r.createDispute).not.toHaveBeenCalled();
    });

    it('rechaza con 403 —y el mismo cuerpo— la solicitud inexistente', async () => {
      const ajena = repo({
        findClaimForUpdate: mockFn().mockResolvedValue(
          reclamo({ billingProviderEntityId: OTRA_PRACTICE }),
        ),
      });
      const inexistente = repo({
        findClaimForUpdate: mockFn().mockResolvedValue(null),
      });

      const unRechazo = await rechazoDe(() =>
        conTenant(() => servicioCon(ajena).openDispute(CLAIM, dto, actor)),
      );
      const otroRechazo = await rechazoDe(() =>
        conTenant(() =>
          servicioCon(inexistente).openDispute(CLAIM, dto, actor),
        ),
      );

      // AC-16-14 también acá: reclamar no puede servir para averiguar qué
      // identificadores existen.
      expect(unRechazo.getStatus()).toBe(otroRechazo.getStatus());
      expect(unRechazo.getResponse()).toEqual(otroRechazo.getResponse());
    });

    it('no consulta el reclamo si la organización no tiene prácticas', async () => {
      const r = repo();

      await expect(
        conTenant(() => servicioCon(r, []).openDispute(CLAIM, dto, actor)),
      ).rejects.toThrow(ForbiddenException);
      expect(r.findClaimForUpdate).not.toHaveBeenCalled();
    });

    it('no acepta un facturador que no sea una práctica', async () => {
      // El día que exista un segundo tipo de facturador, un uuid de otra tabla
      // no debe entrar por coincidencia de valor.
      const r = repo({
        findClaimForUpdate: mockFn().mockResolvedValue(
          reclamo({ billingProviderTypeConceptId: 'otro-tipo' }),
        ),
      });

      await expect(
        conTenant(() => servicioCon(r).openDispute(CLAIM, dto, actor)),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('idempotencia (AC-16-13)', () => {
    it('reclamar dos veces devuelve la misma disputa y no crea otra', async () => {
      const existente = {
        id: 'disputa-existente',
        statusConceptId: INS.DISPUTE_OPEN,
        createdAt: new Date('2026-09-01T00:00:00.000Z'),
      };
      const r = repo({
        findOpenDispute: mockFn().mockResolvedValue(existente),
      });

      const resultado = await conTenant(() =>
        servicioCon(r).openDispute(CLAIM, dto, actor),
      );

      expect(resultado.id).toBe('disputa-existente');
      expect(r.createDispute).not.toHaveBeenCalled();
    });

    it('bloquea la fila del reclamo antes de decidir si crea', async () => {
      const r = repo();

      await conTenant(() => servicioCon(r).openDispute(CLAIM, dto, actor));

      // El `FOR UPDATE` es lo que hace idempotente al reclamo entre peticiones
      // concurrentes: `claim_disputes` no tiene índice único que lo impida, así
      // que leer sin lock deja pasar dos inserciones simultáneas.
      expect(r.findClaimForUpdate).toHaveBeenCalledWith(
        expect.anything(),
        CLAIM,
      );
      const ordenLock = (r.findClaimForUpdate as any).mock
        .invocationCallOrder[0];
      const ordenBusqueda = (r.findOpenDispute as any).mock
        .invocationCallOrder[0];
      expect(ordenLock).toBeLessThan(ordenBusqueda);
    });
  });
});
