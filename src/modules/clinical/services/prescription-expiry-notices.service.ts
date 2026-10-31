import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import type { AuthenticatedUser } from '../../../common';
import { NotificationsService } from '../../messaging/services';
import { CLIN } from '../clinical.concepts';
import {
  PRESCRIPTION_EXPIRY_DEFAULT_BATCH,
  type PrescriptionExpirySweepResultDto,
} from '../dto/prescription-expiry-notice.dto';
import { PrescriptionExpiryRepository } from '../repositories/prescription-expiry.repository';

/**
 * Cuántos días antes del vencimiento se avisa.
 *
 * ALOVIDA pide «alertas de vencimiento de la receta» (PAC-REC-002) sin fijar la antelación. Se toma
 * una ventana estrecha —la que menos avisos genera— hasta que el negocio defina otra.
 */
export const PRESCRIPTION_EXPIRY_NOTICE_DAYS = 3;

/** Prefijo de la clave de idempotencia del aviso; la receta completa la clave. */
export const PRESCRIPTION_EXPIRY_NOTICE_KEY_PREFIX =
  'clinical:PRESCRIPTION_EXPIRING:';

/** Clave del bloqueo consultivo que impide dos barridos a la vez. */
const SWEEP_LOCK_KEY = 'clinical.prescription-expiry-notices';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * PAC-REC-002 · avisa al paciente, por la bandeja in-app, que una receta suya está por vencer.
 *
 * ## Qué cuenta como «por vencer»
 *
 * Una receta **emitida** (`MR_ISSUED`) con `valid_to` entre ahora y
 * {@link PRESCRIPTION_EXPIRY_NOTICE_DAYS} días. Una sin `valid_to` no vence y nunca avisa; una
 * borrador, invalidada, reemplazada o completada no está vigente para el paciente; una ya vencida
 * dejó de estar «por vencer».
 *
 * ## Una sola vez
 *
 * El aviso lleva la clave de idempotencia `clinical:PRESCRIPTION_EXPIRING:<receta>`, que
 * `NotificationsService.emitInApp` guarda en `messaging.notification_requests` incluso cuando la
 * preferencia del paciente lo suprime. Antes de emitir se excluyen las recetas cuya clave ya
 * existe, de modo que repetir el barrido —o ejecutarlo en dos réplicas— no repite el aviso. Un
 * aviso que falló no deja fila y se reintenta en el barrido siguiente. Dos barridos simultáneos se
 * excluyen con un bloqueo consultivo de transacción.
 *
 * ## Qué dice el aviso
 *
 * No nombra el medicamento ni la dosis: la bandeja no es el lugar de un dato clínico. Lleva al
 * paciente a la receta (`PRESCRIPTION_EXPIRING`, el `id` de la receta).
 */
@Injectable()
export class PrescriptionExpiryNoticesService {
  /**
   * @param em - Contexto de persistencia; el barrido corre en una transacción propia.
   * @param repo - Recetas por vencer sin aviso.
   * @param notifications - Emisor in-app (contrato de P1).
   * @param logger - Registro estructurado; sólo identificadores y conteos.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly repo: PrescriptionExpiryRepository,
    private readonly notifications: NotificationsService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(PrescriptionExpiryNoticesService.name);
  }

  /**
   * Un barrido de avisos.
   *
   * @param actor - Cuenta de servicio que dispara el barrido; firma los avisos.
   * @param limit - Tope de recetas por barrido.
   * @param now - Instante de referencia.
   * @returns Cuántas recetas se consideraron y qué pasó con cada aviso.
   */
  async sweep(
    actor: AuthenticatedUser,
    limit: number = PRESCRIPTION_EXPIRY_DEFAULT_BATCH,
    now: Date = new Date(),
  ): Promise<PrescriptionExpirySweepResultDto> {
    const result = await this.em.transactional(async (tx) => {
      const lock = await tx.execute<{ locked: boolean }[]>(
        'select pg_try_advisory_xact_lock(hashtext(?)) as locked',
        [SWEEP_LOCK_KEY],
      );
      if (!lock[0]?.locked) {
        return {
          scanned: 0,
          notified: 0,
          suppressed: 0,
          failed: 0,
          skipped: true,
        };
      }

      const due = await this.repo.findToNotify(tx, {
        issuedStatusConceptId: CLIN.MEDICATION_REQUEST_ISSUED,
        after: now,
        until: new Date(
          now.getTime() + PRESCRIPTION_EXPIRY_NOTICE_DAYS * MS_PER_DAY,
        ),
        noticeKeyPrefix: PRESCRIPTION_EXPIRY_NOTICE_KEY_PREFIX,
        limit,
      });

      const counts = { notified: 0, suppressed: 0, failed: 0 };
      for (const prescription of due) {
        const emitted = await this.notifications.emitInApp({
          recipientUserId: prescription.recipient_user_id,
          category: 'CLINICAL',
          subject: 'Su receta está por vencer',
          bodyText: `Una de sus recetas vence en los próximos ${PRESCRIPTION_EXPIRY_NOTICE_DAYS} días. Revise su vigencia en su historia clínica.`,
          destination: { type: 'PRESCRIPTION_EXPIRING', id: prescription.id },
          tenantId: prescription.custodian_tenant_id,
          debounceKey: `${PRESCRIPTION_EXPIRY_NOTICE_KEY_PREFIX}${prescription.id}`,
          actorUserId: actor.id,
        });
        if (emitted.failed) counts.failed += 1;
        else if (emitted.suppressed) counts.suppressed += 1;
        else counts.notified += 1;
      }
      return { scanned: due.length, ...counts, skipped: false };
    });

    this.logger.info(
      { operation: 'clinical.prescription-expiry.sweep', ...result },
      'Barrido de avisos de receta por vencer',
    );
    return result;
  }
}
