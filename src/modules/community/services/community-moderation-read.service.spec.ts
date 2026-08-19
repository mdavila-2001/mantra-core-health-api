import { jest } from '@jest/globals';

// Loose-typed mock factory: runtime 'jest' pero sin los tipos estrictos Mock<never>.
/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { CommunityModerationReadService } from './community-moderation-read.service';
import { decodeKeysetCursor, runWithTenant } from '../../../common';
import {
  APPEAL_STATUS_BY_CODE,
  COMM,
  CONTENT_TYPE_BY_CODE,
  MODERATION_DECISION_BY_CODE,
  QUEUE_PRIORITY_BY_CODE,
  QUEUE_STATUS_BY_CODE,
} from '../community.concepts';

/** Tenant del contexto: la cola se acota a él, así que las pruebas lo fijan. */
const TENANT = '11111111-1111-1111-1111-111111111111';

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const em = { fork: mockFn(() => ({})) };
  const moderationRepo = {
    listQueuePage: mockFn().mockResolvedValue([]),
    listReportsByIds: mockFn().mockResolvedValue([]),
    countReportsByContent: mockFn().mockResolvedValue([]),
    listDecisionsPage: mockFn().mockResolvedValue([]),
    listDecisionsByIds: mockFn().mockResolvedValue([]),
    listAppealsPage: mockFn().mockResolvedValue([]),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new CommunityModerationReadService(
    em as any,
    moderationRepo as any,
    logger as any,
  );
  return { service, moderationRepo };
}

/** Una fila de cola mínima. */
const fila = (id: string, extra: Record<string, unknown> = {}) => ({
  id,
  contentTypeConceptId: COMM.CONTENT_TYPE_POST,
  contentRefId: `post-${id}`,
  sourceConceptId: COMM.QUEUE_SOURCE_USER_REPORT,
  priorityConceptId: COMM.QUEUE_PRIORITY_NORMAL,
  statusConceptId: COMM.QUEUE_QUEUED,
  queuedAt: new Date('2026-08-10T10:00:00Z'),
  createdAt: new Date('2026-08-10T10:00:00Z'),
  ...extra,
});

describe('CommunityModerationReadService', () => {
  describe('listQueue', () => {
    it('pide una fila más que el tope, para saber si hay siguiente', async () => {
      const d = build();
      await runWithTenant(TENANT, () => d.service.listQueue({} as any, 20));

      expect(d.moderationRepo.listQueuePage).toHaveBeenCalledWith(
        expect.anything(),
        TENANT,
        expect.anything(),
        undefined,
        21,
      );
    });

    /**
     * La pantalla filtra por `QUEUED` o `HIGH`, no por el uuid del concepto:
     * pedirle uuids la ataría a la semilla de terminología de cada ambiente.
     */
    it('traduce los códigos de filtro a conceptos', async () => {
      const d = build();
      await runWithTenant(TENANT, () =>
        d.service.listQueue(
          {
            status: ['QUEUED', 'IN_REVIEW'],
            priority: ['HIGH'],
            contentType: ['POST'],
          } as any,
          20,
        ),
      );

      expect(d.moderationRepo.listQueuePage).toHaveBeenCalledWith(
        expect.anything(),
        TENANT,
        expect.objectContaining({
          statusConceptIds: [
            QUEUE_STATUS_BY_CODE.QUEUED,
            QUEUE_STATUS_BY_CODE.IN_REVIEW,
          ],
          priorityConceptIds: [QUEUE_PRIORITY_BY_CODE.HIGH],
          contentTypeConceptIds: [CONTENT_TYPE_BY_CODE.POST],
        }),
        undefined,
        21,
      );
    });

    /**
     * La antigüedad se pide en horas —«qué lleva más de N horas sin decisión»— y
     * se traduce a un instante para la consulta.
     */
    it('traduce la antigüedad en horas a un instante', async () => {
      const d = build();
      await runWithTenant(TENANT, () =>
        d.service.listQueue({ minAgeHours: 24 } as any, 20),
      );

      // `[2]` y no `[1]`: el tenant va ahora entre el `em` y los filtros.
      const filtros = d.moderationRepo.listQueuePage.mock.calls[0][2];
      expect(filtros.queuedBefore).toBeInstanceOf(Date);
      const horas =
        (Date.now() - (filtros.queuedBefore as Date).getTime()) /
        (60 * 60 * 1000);
      expect(horas).toBeGreaterThanOrEqual(23.9);
      expect(horas).toBeLessThanOrEqual(24.1);
    });

    it('no emite cursor cuando la página no está llena', async () => {
      const d = build();
      d.moderationRepo.listQueuePage.mockResolvedValue([fila('q1')]);

      const page = await runWithTenant(TENANT, () =>
        d.service.listQueue({} as any, 20),
      );

      expect(page.count).toBe(1);
      expect(page.nextCursor).toBeNull();
    });

    it('emite cursor y recorta la fila extra cuando hay más', async () => {
      const d = build();
      d.moderationRepo.listQueuePage.mockResolvedValue([
        fila('q1'),
        fila('q2'),
      ]);

      const page = await runWithTenant(TENANT, () =>
        d.service.listQueue({} as any, 1),
      );

      expect(page.count).toBe(1);
      expect(page.items[0]!.id).toBe('q1');
      expect(decodeKeysetCursor(page.nextCursor!)).toEqual({
        queuedAt: '2026-08-10T10:00:00.000Z',
        id: 'q1',
      });
    });

    /**
     * `queued_at` es nullable en filas viejas. Sin el `coalesce`, el cursor
     * saldría inválido justo en esas filas y la paginación se rompería.
     */
    it('el cursor cae en createdAt si la fila no tiene queuedAt', async () => {
      const d = build();
      d.moderationRepo.listQueuePage.mockResolvedValue([
        fila('q1', {
          queuedAt: undefined,
          createdAt: new Date('2026-08-01T08:00:00Z'),
        }),
        fila('q2'),
      ]);

      const page = await runWithTenant(TENANT, () =>
        d.service.listQueue({} as any, 1),
      );

      expect(decodeKeysetCursor(page.nextCursor!)).toEqual({
        queuedAt: '2026-08-01T08:00:00.000Z',
        id: 'q1',
      });
    });

    /**
     * La cola deduplica por contenido: sin el recuento, una entrada reportada
     * por diez personas se ve igual que una reportada por una.
     */
    it('trae el recuento de reportes y el reporte que la originó', async () => {
      const d = build();
      d.moderationRepo.listQueuePage.mockResolvedValue([
        fila('q1', { contentReportId: 'rep-1' }),
      ]);
      d.moderationRepo.countReportsByContent.mockResolvedValue([
        { targetId: 'post-q1', count: 7 },
      ]);
      d.moderationRepo.listReportsByIds.mockResolvedValue([
        {
          id: 'rep-1',
          reasonConceptId: COMM.REPORT_OPEN,
          detailText: 'Publica datos de un paciente.',
          createdAt: new Date('2026-08-10T09:00:00Z'),
        },
      ]);

      const page = await runWithTenant(TENANT, () =>
        d.service.listQueue({} as any, 20),
      );

      expect(page.items[0]!.reportCount).toBe(7);
      expect(page.items[0]!.report?.detailText).toBe(
        'Publica datos de un paciente.',
      );
    });

    /**
     * La cola se listaba **sin filtro de tenant**: un moderador de una clínica
     * veía los reportes de todas las demás —el contenido denunciado, quién lo
     * denunció y por qué—. Es la prueba que impide que vuelva a pasar.
     */
    it('acota la cola al tenant del contexto', async () => {
      const d = build();

      await runWithTenant(TENANT, () => d.service.listQueue({} as any, 20));

      expect(d.moderationRepo.listQueuePage).toHaveBeenCalledWith(
        expect.anything(),
        TENANT,
        expect.anything(),
        undefined,
        21,
      );
    });

    it('sin tenant en el contexto falla en vez de servir la cola de todos', async () => {
      const d = build();

      // Servir vacío mentiría sobre el motivo; servir sin acotar sería la fuga.
      await expect(d.service.listQueue({} as any, 20)).rejects.toThrow();
      expect(d.moderationRepo.listQueuePage).not.toHaveBeenCalled();
    });

    it('una entrada sin reporte asociado trae report en null, no undefined', async () => {
      const d = build();
      d.moderationRepo.listQueuePage.mockResolvedValue([fila('q1')]);

      const page = await runWithTenant(TENANT, () =>
        d.service.listQueue({} as any, 20),
      );

      expect(page.items[0]!.report).toBeNull();
      expect(page.items[0]!.reportCount).toBe(0);
    });
  });

  describe('listDecisions', () => {
    it('traduce el código de decisión a concepto', async () => {
      const d = build();
      await d.service.listDecisions({ decision: ['REMOVED'] } as any, 20);

      expect(d.moderationRepo.listDecisionsPage).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          decisionConceptIds: [MODERATION_DECISION_BY_CODE.REMOVED.decision],
        }),
        undefined,
        21,
      );
    });

    it('emite cursor por (decidedAt, id)', async () => {
      const d = build();
      const decision = {
        id: 'dec1',
        moderationQueueId: 'q1',
        decisionConceptId: MODERATION_DECISION_BY_CODE.REMOVED.decision,
        policyConceptId: COMM.POLICY_COMMUNITY_GUIDELINES,
        decidedByUserId: 'mod-1',
        decidedAt: new Date('2026-08-12T15:00:00Z'),
        createdAt: new Date('2026-08-12T15:00:00Z'),
      };
      d.moderationRepo.listDecisionsPage.mockResolvedValue([
        decision,
        { ...decision, id: 'dec2' },
      ]);

      const page = await d.service.listDecisions({} as any, 1);

      expect(decodeKeysetCursor(page.nextCursor!)).toEqual({
        decidedAt: '2026-08-12T15:00:00.000Z',
        id: 'dec1',
      });
    });
  });

  describe('listAppeals', () => {
    it('traduce OPEN, que no es una resolución', async () => {
      const d = build();
      await d.service.listAppeals({ status: ['OPEN'] } as any, 20);

      expect(d.moderationRepo.listAppealsPage).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          statusConceptIds: [APPEAL_STATUS_BY_CODE.OPEN],
        }),
        undefined,
        21,
      );
    });

    /**
     * Resolver una apelación sin leer qué se decidió es resolverla a ciegas, y
     * pedir la decisión por fila serían N lecturas por pantalla.
     */
    it('embebe la decisión impugnada, resuelta en una consulta', async () => {
      const d = build();
      d.moderationRepo.listAppealsPage.mockResolvedValue([
        {
          id: 'ap-1',
          moderationDecisionId: 'dec1',
          appellantProfileId: 'pp-1',
          reasonText: 'No era PII.',
          statusConceptId: COMM.APPEAL_OPEN,
          createdAt: new Date('2026-08-13T10:00:00Z'),
        },
        {
          id: 'ap-2',
          moderationDecisionId: 'dec1',
          appellantProfileId: 'pp-2',
          reasonText: 'Tampoco.',
          statusConceptId: COMM.APPEAL_OPEN,
          createdAt: new Date('2026-08-13T11:00:00Z'),
        },
      ]);
      d.moderationRepo.listDecisionsByIds.mockResolvedValue([
        {
          id: 'dec1',
          moderationQueueId: 'q1',
          decisionConceptId: MODERATION_DECISION_BY_CODE.REMOVED.decision,
          policyConceptId: COMM.POLICY_COMMUNITY_GUIDELINES,
          rationaleText: 'Incluía el nombre de un paciente.',
          decidedByUserId: 'mod-1',
          decidedAt: new Date('2026-08-12T15:00:00Z'),
          createdAt: new Date('2026-08-12T15:00:00Z'),
        },
      ]);

      const page = await d.service.listAppeals({} as any, 20);

      expect(page.items[0]!.decision?.rationaleText).toBe(
        'Incluía el nombre de un paciente.',
      );
      // Dos apelaciones sobre la misma decisión: una sola consulta, sin repetir
      // el id en la lista que se pide.
      expect(d.moderationRepo.listDecisionsByIds).toHaveBeenCalledTimes(1);
      expect(d.moderationRepo.listDecisionsByIds.mock.calls[0][1]).toEqual([
        'dec1',
      ]);
    });

    it('una apelación cuya decisión no se encontró trae decision en null', async () => {
      const d = build();
      d.moderationRepo.listAppealsPage.mockResolvedValue([
        {
          id: 'ap-1',
          moderationDecisionId: 'dec-x',
          appellantProfileId: 'pp-1',
          reasonText: 'Apelo.',
          statusConceptId: COMM.APPEAL_OPEN,
          createdAt: new Date('2026-08-13T10:00:00Z'),
        },
      ]);

      const page = await d.service.listAppeals({} as any, 20);

      expect(page.items[0]!.decision).toBeNull();
    });
  });
});
