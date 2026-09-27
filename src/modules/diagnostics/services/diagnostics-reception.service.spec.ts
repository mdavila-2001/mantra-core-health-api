import { describe, expect, it, jest } from '@jest/globals';
import { BadRequestException } from '@nestjs/common';
import { encodeKeysetCursor } from '../../../common';
import { CLIN } from '../../clinical/clinical.concepts';
import { DIAG } from '../diagnostics.concepts';
import {
  DiagnosticsReceptionService,
  normalizeForSearch,
} from './diagnostics-reception.service';

/**
 * Crea una función simulada con la implementación dada.
 *
 * @param impl - Implementación que ejecuta el doble.
 * @returns La función simulada.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const LAB = 'aaaaaaaa-0000-0000-0000-00000000000a';
const CLINIC = 'bbbbbbbb-0000-0000-0000-00000000000b';

/** Una orden de laboratorio dirigida a LAB, emitida el minuto `i`. */
function order(i: number, patient = `patient-${i}`) {
  return {
    id: `sr-${String(i).padStart(3, '0')}`,
    custodianTenantId: CLINIC,
    performerTenantId: LAB,
    patientProfileId: patient,
    codeConceptId: 'study-hemograma',
    categoryConceptId: CLIN.SERVICE_REQUEST_CATEGORY_LAB,
    priorityConceptId: CLIN.SERVICE_REQUEST_PRIORITY_ROUTINE,
    statusConceptId: CLIN.SERVICE_REQUEST_ACTIVE,
    requesterProfileId: 'doc-1',
    createdAt: new Date(Date.UTC(2026, 8, 26, 8, i)),
  };
}

/**
 * Arma el servicio sobre una tabla de órdenes en memoria. El doble del
 * repositorio respeta el orden y el cursor keyset, que es lo que el servicio
 * da por cierto de la consulta real.
 *
 * @param orders - Órdenes dirigidas al laboratorio (ya vigentes y de categoría con espécimen).
 * @param accessioned - Órdenes que ya tienen acesión en el laboratorio.
 * @returns El servicio y sus dobles.
 */
function build(
  orders: ReturnType<typeof order>[],
  accessioned: readonly string[] = [],
) {
  const sorted = [...orders].sort(
    (a, b) =>
      a.createdAt.getTime() - b.createdAt.getTime() || a.id.localeCompare(b.id),
  );
  const receptionRepo = {
    findInboxCandidates: mockFn(
      (
        _em: unknown,
        _tenant: string,
        _cats: string[],
        _status: string,
        after: { createdAt: Date; id: string } | undefined,
        limit: number,
      ) =>
        Promise.resolve(
          sorted
            .filter(
              (o) =>
                !after ||
                o.createdAt > after.createdAt ||
                (o.createdAt.getTime() === after.createdAt.getTime() &&
                  o.id > after.id),
            )
            .slice(0, limit),
        ),
    ),
    findAccessionedServiceRequestIds: mockFn(
      (_em: unknown, _tenant: string, ids: string[]) =>
        Promise.resolve(new Set(ids.filter((id) => accessioned.includes(id)))),
    ),
    findSpecimensForServiceRequests: mockFn(() =>
      Promise.resolve([
        {
          id: 'spec-1',
          patientProfileId: 'patient-1',
          serviceRequestId: 'sr-001',
          specimenTypeConceptId: DIAG.SPECIMEN_TYPE_BLOOD_VENOUS,
          statusConceptId: DIAG.SPECIMEN_COLLECTED,
          collectedAt: new Date('2026-09-26T09:00:00Z'),
        },
      ]),
    ),
    findPatientLabels: mockFn((_em: unknown, ids: string[]) =>
      Promise.resolve(
        new Map(
          ids.map((id) => [
            id,
            id === 'patient-ana'
              ? { displayName: 'Ana Lucía Pérez', patientCode: 'HC-0042' }
              : { displayName: `Paciente ${id}`, patientCode: null },
          ]),
        ),
      ),
    ),
    findConceptDisplays: mockFn(() =>
      Promise.resolve(new Map([['study-hemograma', 'Hemograma completo']])),
    ),
    findTenantNames: mockFn(() =>
      Promise.resolve(new Map([[CLINIC, 'Clínica Los Olivos']])),
    ),
  };
  const specimensRepo = {
    findContainersBySpecimenIds: mockFn(() =>
      Promise.resolve([
        {
          id: 'cont-1',
          specimenId: 'spec-1',
          containerIdentifier: 'TUBO-0001',
          containerTypeConceptId: DIAG.CONTAINER_TYPE_TUBE_LAVENDER_EDTA,
          statusConceptId: DIAG.CONTAINER_ACTIVE,
        },
      ]),
    ),
    findCustodyEventsBySpecimenIds: mockFn(() => Promise.resolve([])),
  };
  const logger = { setContext: mockFn(), info: mockFn() };
  const service = new DiagnosticsReceptionService(
    { fork: () => ({}) } as any,
    receptionRepo as any,
    specimensRepo as any,
    logger as any,
  );
  return { service, receptionRepo, logger };
}

describe('DiagnosticsReceptionService.listInbox', () => {
  describe('correcto', () => {
    it('devuelve las órdenes pendientes, de la más vieja a la más nueva, con paciente, estudio, organización y muestras', async () => {
      const { service } = build([order(2), order(1)]);
      const page = await service.listInbox(LAB, {});

      expect(page.items.map((i) => i.serviceRequestId)).toEqual([
        'sr-001',
        'sr-002',
      ]);
      expect(page.nextCursor).toBeNull();
      expect(page.count).toBe(2);
      expect(page.limit).toBe(25);
      const first = page.items[0];
      expect(first).toMatchObject({
        patientDisplayName: 'Paciente patient-1',
        codeDisplay: 'Hemograma completo',
        requestingTenantId: CLINIC,
        requestingTenantName: 'Clínica Los Olivos',
        statusConceptId: CLIN.SERVICE_REQUEST_ACTIVE,
      });
      // La muestra ya recibida viaja con su contenedor: es lo que permite
      // acesionarla desde la misma fila.
      expect(first.specimens).toHaveLength(1);
      expect(first.specimens[0].containers[0].containerIdentifier).toBe(
        'TUBO-0001',
      );
      expect(page.items[1].specimens).toEqual([]);
    });

    it('lee siempre las órdenes derivadas al laboratorio del contexto, vigentes y de categoría con espécimen', async () => {
      const { service, receptionRepo } = build([order(1)]);
      await service.listInbox(LAB, {});
      const [, tenant, categories, status] =
        receptionRepo.findInboxCandidates.mock.calls[0];
      expect(tenant).toBe(LAB);
      expect(categories).toEqual([
        CLIN.SERVICE_REQUEST_CATEGORY_LAB,
        CLIN.SERVICE_REQUEST_CATEGORY_PATHOLOGY,
      ]);
      expect(status).toBe(CLIN.SERVICE_REQUEST_ACTIVE);
    });

    it('una orden ya acesionada sale de la recepción', async () => {
      const { service } = build([order(1), order(2), order(3)], ['sr-002']);
      const page = await service.listInbox(LAB, {});
      expect(page.items.map((i) => i.serviceRequestId)).toEqual([
        'sr-001',
        'sr-003',
      ]);
    });

    it('busca por nombre sin distinguir mayúsculas ni tildes, y por código de paciente', async () => {
      const { service } = build([order(1), order(2, 'patient-ana'), order(3)]);
      const byName = await service.listInbox(LAB, { patientQuery: 'perez' });
      expect(byName.items.map((i) => i.serviceRequestId)).toEqual(['sr-002']);
      const byCode = await service.listInbox(LAB, { patientQuery: 'hc-0042' });
      expect(byCode.items.map((i) => i.patientCode)).toEqual(['HC-0042']);
    });

    it('nunca escribe el texto buscado en el log: es PHI', async () => {
      const { service, logger } = build([order(1, 'patient-ana')]);
      await service.listInbox(LAB, { patientQuery: 'Pérez' });
      expect(JSON.stringify(logger.info.mock.calls)).not.toContain('rez');
      expect(logger.info.mock.calls[0][0]).toMatchObject({
        hasPatientQuery: true,
      });
    });
  });

  describe('límite', () => {
    it('pagina por cursor sin repetir ni saltear filas', async () => {
      const orders = Array.from({ length: 7 }, (_, i) => order(i + 1));
      const { service } = build(orders);

      const seen: string[] = [];
      let cursor: string | undefined;
      let pages = 0;
      do {
        const page = await service.listInbox(LAB, { limit: 3, cursor });
        seen.push(...page.items.map((i) => i.serviceRequestId));
        cursor = page.nextCursor ?? undefined;
        pages++;
      } while (cursor && pages < 10);

      expect(seen).toEqual(orders.map((o) => o.id));
      expect(pages).toBe(3);
    });

    it('página exactamente llena y nada más: sin cursor siguiente', async () => {
      const { service } = build([order(1), order(2)]);
      const page = await service.listInbox(LAB, { limit: 2 });
      expect(page.items).toHaveLength(2);
      expect(page.nextCursor).toBeNull();
    });

    it('si el techo de lecturas corta antes de llenar la página, sale corta pero con cursor', async () => {
      // 300 órdenes acesionadas antes de la única pendiente: con bloques de 50
      // y 5 lecturas como máximo, la pendiente queda fuera de esta petición.
      const orders = Array.from({ length: 301 }, (_, i) => order(i + 1));
      const accessioned = orders.slice(0, 300).map((o) => o.id);
      const { service, receptionRepo } = build(orders, accessioned);

      const first = await service.listInbox(LAB, { limit: 10 });
      expect(first.items).toEqual([]);
      expect(first.nextCursor).not.toBeNull();
      expect(receptionRepo.findInboxCandidates).toHaveBeenCalledTimes(5);

      const second = await service.listInbox(LAB, {
        limit: 10,
        cursor: first.nextCursor!,
      });
      expect(second.items.map((i) => i.serviceRequestId)).toEqual(['sr-301']);
      expect(second.nextCursor).toBeNull();
    });

    it('bandeja vacía: página vacía sin cursor y sin consultar muestras', async () => {
      const { service, receptionRepo } = build([]);
      const page = await service.listInbox(LAB, {});
      expect(page).toEqual({
        items: [],
        count: 0,
        limit: 25,
        nextCursor: null,
      });
      expect(
        receptionRepo.findSpecimensForServiceRequests,
      ).not.toHaveBeenCalled();
    });

    it('una búsqueda sin coincidencias devuelve vacío', async () => {
      const { service } = build([order(1), order(2)]);
      const page = await service.listInbox(LAB, { patientQuery: 'zzz' });
      expect(page.items).toEqual([]);
      expect(page.nextCursor).toBeNull();
    });
  });

  describe('inválido', () => {
    it('un cursor corrupto es 400, no 500', async () => {
      const { service } = build([order(1)]);
      await expect(
        service.listInbox(LAB, { cursor: '%%no-es-base64%%' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('un cursor bien formado pero de otro listado es 400', async () => {
      const { service } = build([order(1)]);
      const foreign = encodeKeysetCursor({ code: 'X' });
      await expect(
        service.listInbox(LAB, { cursor: foreign }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('un cursor con una fecha imposible es 400', async () => {
      const { service } = build([order(1)]);
      const bad = encodeKeysetCursor({ createdAt: 'ayer', id: 'sr-001' });
      await expect(
        service.listInbox(LAB, { cursor: bad }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});

describe('normalizeForSearch', () => {
  it('quita tildes y mayúsculas', () => {
    expect(normalizeForSearch('  PÉREZ Ñandú ')).toBe('perez nandu');
  });
});
