import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { CommunityModerationService } from './community-moderation.service';
import { ForbiddenException } from '@nestjs/common';
import { ConflictException, ResourceNotFoundException } from '../../../common';
import { COMM } from '../community.concepts';

const actor = { id: 'mod-1', roles: ['SECURITY_ADMIN'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const moderationRepo = {
    createReport: mockFn(),
    findReportsByTarget: mockFn().mockResolvedValue([]),
    findQueueById: mockFn(),
    findOpenQueueForContent: mockFn(),
    createQueue: mockFn(),
    findDecisionById: mockFn(),
    createDecision: mockFn(),
    createStrike: mockFn(),
    createAppeal: mockFn(),
    findOpenAppealForDecision: mockFn(),
    findAppealById: mockFn(),
    // AG-18: por defecto el perfil que apela SÍ es el sancionado, para que
    // los specs que no prueban esta regla sigan probando lo suyo sin tener
    // que repetir el doble. Los que sí la prueban lo pisan.
    findStrikeByDecisionAndSubject: mockFn().mockResolvedValue({
      id: 'strike-1',
    }),
  };
  // Por defecto la propiedad se concede; los casos de perfil ajeno hacen que el
  // doble rechace. La regla en sí vive en `CommunityVisibilityService`, que
  // tiene su propia prueba con la implementación real.
  const visibility = {
    assertActsAsProfile: mockFn(() => Promise.resolve(undefined)),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new CommunityModerationService(
    em as any,
    moderationRepo as any,
    visibility as any,
    logger as any,
  );
  return { service, tx, moderationRepo, visibility };
}

describe('CommunityModerationService', () => {
  describe('report (UC-19-08)', () => {
    it('creates the report and a new queue entry when none is open', async () => {
      const d = build();
      d.moderationRepo.createReport.mockReturnValue({ id: 'rep1' });
      d.moderationRepo.findOpenQueueForContent.mockResolvedValue(null);
      d.moderationRepo.createQueue.mockReturnValue({ id: 'q1' });
      const res = await d.service.report(
        { targetType: 'POST', targetId: 'post1', reason: 'SPAM' } as any,
        actor,
      );
      expect(res).toEqual({ id: 'rep1', moderationQueueId: 'q1' });
    });

    it('reuses an existing open queue entry (dedup)', async () => {
      const d = build();
      d.moderationRepo.createReport.mockReturnValue({ id: 'rep2' });
      d.moderationRepo.findOpenQueueForContent.mockResolvedValue({
        id: 'qExisting',
      });
      const res = await d.service.report(
        { targetType: 'POST', targetId: 'post1', reason: 'ABUSE' } as any,
        actor,
      );
      expect(res.moderationQueueId).toBe('qExisting');
      expect(d.moderationRepo.createQueue).not.toHaveBeenCalled();
    });
  });

  describe('decide (UC-19-09)', () => {
    it('throws when the queue entry does not exist', async () => {
      const d = build();
      d.moderationRepo.findQueueById.mockResolvedValue(null);
      await expect(
        d.service.decide('missing', { decision: 'REMOVED' } as any, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('rejects deciding an already resolved queue', async () => {
      const d = build();
      d.moderationRepo.findQueueById.mockResolvedValue({
        id: 'q1',
        statusConceptId: COMM.QUEUE_RESOLVED,
      });
      await expect(
        d.service.decide('q1', { decision: 'REMOVED' } as any, actor),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('records the decision, resolves the queue and issues a strike', async () => {
      const d = build();
      const queue = {
        id: 'q1',
        statusConceptId: COMM.QUEUE_QUEUED,
        contentRefId: 'post1',
        updatedAt: new Date(),
      };
      d.moderationRepo.findQueueById.mockResolvedValue(queue);
      d.moderationRepo.createDecision.mockReturnValue({ id: 'dec1' });
      d.moderationRepo.createStrike.mockReturnValue({ id: 'str1' });
      const res = await d.service.decide(
        'q1',
        {
          decision: 'REMOVED',
          subjectProfileId: 'p9',
          strikeSeverity: 'HIGH',
        } as any,
        actor,
      );
      expect(res).toEqual({
        id: 'dec1',
        strikeId: 'str1',
        decision: 'REMOVED',
      });
      expect(queue.statusConceptId).toBe(COMM.QUEUE_RESOLVED);
    });
  });

  describe('appeal (UC-19-10)', () => {
    it('throws when the decision does not exist', async () => {
      const d = build();
      d.moderationRepo.findDecisionById.mockResolvedValue(null);
      await expect(
        d.service.appeal(
          'missing',
          { appellantProfileId: 'p1', reasonText: 'x' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('rejects a second open appeal for the same decision', async () => {
      const d = build();
      d.moderationRepo.findDecisionById.mockResolvedValue({
        id: 'dec1',
        moderationQueueId: 'q1',
      });
      d.moderationRepo.findOpenAppealForDecision.mockResolvedValue({
        id: 'ap0',
      });
      await expect(
        d.service.appeal(
          'dec1',
          { appellantProfileId: 'p1', reasonText: 'x' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('creates the appeal and re-queues the content', async () => {
      const d = build();
      d.moderationRepo.findDecisionById.mockResolvedValue({
        id: 'dec1',
        moderationQueueId: 'q1',
      });
      d.moderationRepo.findOpenAppealForDecision.mockResolvedValue(null);
      d.moderationRepo.createAppeal.mockReturnValue({ id: 'ap1' });
      d.moderationRepo.findQueueById.mockResolvedValue({
        id: 'q1',
        contentTypeConceptId: 'ct',
        contentRefId: 'post1',
      });
      const res = await d.service.appeal(
        'dec1',
        { appellantProfileId: 'p1', reasonText: 'unfair' },
        actor,
      );
      expect(res).toEqual({ id: 'ap1' });
      expect(d.moderationRepo.createQueue).toHaveBeenCalled();
    });

    it('AG-18: rechaza apelar una decisión que no lo sancionó a él, aunque el perfil sea suyo', async () => {
      const d = build();
      d.moderationRepo.findDecisionById.mockResolvedValue({
        id: 'dec1',
        moderationQueueId: 'q1',
      });
      // El perfil es del actor (assertActsAsProfile pasa), pero esta decisión
      // no lo sancionó a él: ningún strike la vincula con su perfil.
      d.moderationRepo.findStrikeByDecisionAndSubject.mockResolvedValue(null);

      await expect(
        d.service.appeal(
          'dec1',
          {
            appellantProfileId: 'p-ajeno-a-la-sancion',
            reasonText: 'no fui yo',
          },
          actor,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(d.moderationRepo.createAppeal).not.toHaveBeenCalled();
      expect(
        d.moderationRepo.findStrikeByDecisionAndSubject,
      ).toHaveBeenCalledWith(expect.anything(), 'dec1', 'p-ajeno-a-la-sancion');
    });
  });

  /**
   * El apelante no lo elige el cliente. Sin la comprobación, cualquiera podía
   * abrir una apelación en nombre de otro — y como una decisión sólo admite una
   * apelación abierta a la vez, además le quemaba la suya al sancionado.
   *
   * La regla es la misma que gobierna toda escritura del grafo social, así que
   * se usa la compartida: acá se prueba que se pida con el perfil correcto y que
   * su negativa corte la operación.
   */
  describe('propiedad del apelante', () => {
    it('exige la titularidad del perfil que apela', async () => {
      const d = build();
      d.moderationRepo.findDecisionById.mockResolvedValue(null);

      await expect(
        d.service.appeal(
          'dec1',
          { appellantProfileId: 'pp-1', reasonText: 'apelo' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);

      // Llegó hasta buscar la decisión, o sea que la propiedad no lo frenó, y se
      // pidió con el perfil declarado y no con otro.
      expect(d.visibility.assertActsAsProfile).toHaveBeenCalledWith(
        expect.anything(),
        'pp-1',
        actor,
      );
    });

    it('no crea la apelación si el perfil no es del actor', async () => {
      const d = build();
      d.visibility.assertActsAsProfile.mockRejectedValue(
        new ForbiddenException('perfil ajeno'),
      );

      await expect(
        d.service.appeal(
          'dec1',
          { appellantProfileId: 'pp-ajeno', reasonText: 'no fui yo' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(d.moderationRepo.createAppeal).not.toHaveBeenCalled();
    });
  });

  /**
   * Se podía apelar y no había forma de cerrar la apelación: toda apelación
   * quedaba abierta para siempre, y como apelar re-encola el contenido con
   * prioridad alta, esa entrada tampoco tenía salida.
   */
  describe('resolveAppeal (UC-19-10, cierre)', () => {
    it('throws cuando la apelación no existe', async () => {
      const d = build();
      d.moderationRepo.findAppealById.mockResolvedValue(null);

      await expect(
        d.service.resolveAppeal('ap-x', { resolution: 'UPHELD' } as any, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('rechaza resolver una apelación ya resuelta', async () => {
      const d = build();
      d.moderationRepo.findAppealById.mockResolvedValue({
        id: 'ap-1',
        statusConceptId: COMM.APPEAL_UPHELD,
      });

      await expect(
        d.service.resolveAppeal('ap-1', { resolution: 'UPHELD' } as any, actor),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('marca la resolución, quién y cuándo', async () => {
      const d = build();
      const apelacion: any = {
        id: 'ap-1',
        moderationDecisionId: 'dec1',
        statusConceptId: COMM.APPEAL_OPEN,
        updatedAt: new Date(),
      };
      d.moderationRepo.findAppealById.mockResolvedValue(apelacion);
      d.moderationRepo.findDecisionById.mockResolvedValue(null);

      const res = await d.service.resolveAppeal(
        'ap-1',
        { resolution: 'OVERTURNED' } as any,
        actor,
      );

      expect(res).toEqual({ id: 'ap-1' });
      expect(apelacion.statusConceptId).toBe(COMM.APPEAL_OVERTURNED);
      expect(apelacion.resolutionConceptId).toBe(COMM.APPEAL_OVERTURNED);
      expect(apelacion.reviewedByUserId).toBe('mod-1');
      expect(apelacion.resolvedAt).toBeInstanceOf(Date);
    });

    /**
     * Si la entrada re-encolada no se cierra con la apelación, queda pidiendo
     * para siempre una revisión que ya se hizo.
     */
    it('cierra la entrada de cola que la apelación había abierto', async () => {
      const d = build();
      d.moderationRepo.findAppealById.mockResolvedValue({
        id: 'ap-1',
        moderationDecisionId: 'dec1',
        statusConceptId: COMM.APPEAL_OPEN,
        updatedAt: new Date(),
      });
      d.moderationRepo.findDecisionById.mockResolvedValue({
        id: 'dec1',
        moderationQueueId: 'q-original',
      });
      d.moderationRepo.findQueueById.mockResolvedValue({
        id: 'q-original',
        contentRefId: 'post-1',
      });
      const reencolada: any = {
        id: 'q-apelacion',
        statusConceptId: COMM.QUEUE_QUEUED,
        updatedAt: new Date(),
      };
      d.moderationRepo.findOpenQueueForContent.mockResolvedValue(reencolada);

      await d.service.resolveAppeal(
        'ap-1',
        { resolution: 'UPHELD' } as any,
        actor,
      );

      expect(reencolada.statusConceptId).toBe(COMM.QUEUE_RESOLVED);
    });

    /**
     * `OVERTURNED` deja constancia de que la apelación prosperó, pero deshacer
     * la sanción es una política que producto no definió: ejecutarla acá sería
     * inventarla.
     */
    it('no revierte la decisión original ni anula el strike', async () => {
      const d = build();
      d.moderationRepo.findAppealById.mockResolvedValue({
        id: 'ap-1',
        moderationDecisionId: 'dec1',
        statusConceptId: COMM.APPEAL_OPEN,
        updatedAt: new Date(),
      });
      d.moderationRepo.findDecisionById.mockResolvedValue({
        id: 'dec1',
        moderationQueueId: 'q-original',
      });
      d.moderationRepo.findQueueById.mockResolvedValue({
        id: 'q-original',
        contentRefId: 'post-1',
      });
      d.moderationRepo.findOpenQueueForContent.mockResolvedValue(null);

      await d.service.resolveAppeal(
        'ap-1',
        { resolution: 'OVERTURNED' } as any,
        actor,
      );

      expect(d.moderationRepo.createDecision).not.toHaveBeenCalled();
      expect(d.moderationRepo.createStrike).not.toHaveBeenCalled();
    });
  });
});
