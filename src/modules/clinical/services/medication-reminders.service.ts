import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { DateTime } from 'luxon';
import { PinoLogger } from 'nestjs-pino';
import { NotificationsService } from '../../messaging/services';
import { PersonAccountLinksRepository } from '../../profiles/repositories';
import {
  MedicationReminderDispatchesRepository,
  MedicationRequestsRepository,
} from '../repositories';
import type { MedicationRequests } from '../entities';
import { CLIN } from '../clinical.concepts';
import {
  MEDICATION_REMINDER_BATCH_LIMIT,
  MEDICATION_REMINDER_WINDOW_MINUTES,
  type DispatchMedicationRemindersResultDto,
} from '../dto/medication-reminders.dto';
import {
  InvalidMedicationTimingError,
  medicationDosesBetween,
  resolveMedicationSchedule,
} from './medication-schedule';
import { timingOf } from './medication-timing.mapper';

/** Estados de receta que cuentan como «en efecto» para recordar tomas. */
const IN_EFFECT_STATUSES = [
  CLIN.MEDICATION_REQUEST_ISSUED,
  CLIN.MEDICATION_REQUEST_ACTIVE,
];

/** Tope de tomas de una misma receta dentro de una ventana (cada 1 min en 60 min). */
const MAX_DOSES_PER_REQUEST = 60;

/** Opciones de una pasada. */
export interface DispatchMedicationRemindersOptions {
  /** Minutos hacia adelante (por defecto 15). */
  readonly windowMinutes?: number;
  /** Tope de recetas examinadas (por defecto 200). */
  readonly limit?: number;
  /** Instante de la pasada; inyectable para pruebas. */
  readonly now?: Date;
}

/**
 * Recordatorios de toma (patch v4.2.35): avisa por la campana (in-app, que el
 * gateway de notificaciones empuja por socket) las tomas de los próximos
 * minutos.
 *
 * ## Una toma, un aviso
 *
 * El worker llama cada minuto con una ventana de 15: la misma toma cae en
 * quince pasadas seguidas. La deduplicación no es el `debounceKey` de
 * mensajería —ese sólo colapsa mientras la primera siga sin entregar, y el
 * in-app se entrega al instante— sino la marca de
 * `clinical.medication_reminder_dispatches`, reclamada con un INSERT atómico
 * contra su UNIQUE: la reclama una sola pasada de un solo proceso.
 *
 * ## Emitir nunca rompe el lote
 *
 * Mismo contrato que `ClinicalNotificationsService`: un paciente sin cuenta no
 * es un error (no hay bandeja donde avisar), y un fallo de emisión libera la
 * marca para que la pasada siguiente lo reintente mientras la toma siga en la
 * ventana, sin cortar el resto de las recetas.
 *
 * ## Sin datos clínicos en el aviso ni en el log
 *
 * El texto no nombra el fármaco: la campana puede mostrarse en pantallas
 * compartidas y el detalle vive en la receta, detrás de la sesión. El log lleva
 * ids y conteos.
 */
@Injectable()
export class MedicationRemindersService {
  /**
   * @param em - Contexto de persistencia.
   * @param requestsRepo - Recetas programables.
   * @param dispatchesRepo - Marca de toma avisada.
   * @param accountLinks - Cuenta del paciente.
   * @param notifications - Emisor in-app.
   * @param logger - Logger estructurado.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly requestsRepo: MedicationRequestsRepository,
    private readonly dispatchesRepo: MedicationReminderDispatchesRepository,
    private readonly accountLinks: PersonAccountLinksRepository,
    private readonly notifications: NotificationsService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(MedicationRemindersService.name);
  }

  /**
   * Una pasada del despacho.
   *
   * @param options - Ventana, tope e instante.
   * @returns Cuántos avisos se crearon y un resumen sin datos clínicos.
   */
  async dispatchDue(
    options: DispatchMedicationRemindersOptions = {},
  ): Promise<DispatchMedicationRemindersResultDto> {
    const now = options.now ?? new Date();
    const windowMinutes =
      options.windowMinutes ?? MEDICATION_REMINDER_WINDOW_MINUTES;
    const windowEnd = new Date(now.getTime() + windowMinutes * 60_000);
    const em = this.em.fork();

    const requests = await this.requestsRepo.findSchedulable(em, {
      statusConceptIds: IN_EFFECT_STATUSES,
      now,
      windowEnd,
      limit: options.limit ?? MEDICATION_REMINDER_BATCH_LIMIT,
    });

    let emitted = 0;
    let alreadyClaimed = 0;
    let withoutAccount = 0;
    let failed = 0;
    let invalid = 0;

    for (const request of requests) {
      let doses: Date[];
      try {
        const schedule = resolveMedicationSchedule(timingOf(request), {
          validFrom: request.validFrom,
          validTo: request.validTo,
          issuedAt: request.issuedAt,
        });
        doses = medicationDosesBetween(
          schedule,
          now,
          windowEnd,
          MAX_DOSES_PER_REQUEST,
        );
      } catch (error) {
        if (!(error instanceof InvalidMedicationTimingError)) throw error;
        invalid++;
        this.logger.warn(
          {
            operation: 'clinical.medication.reminders',
            requestId: request.id,
            reason: error.code,
          },
          'Posología incoherente: la receta se saltea',
        );
        continue;
      }
      if (doses.length === 0) continue;

      const recipientUserId = await this.recipientOf(em, request);
      for (const doseAt of doses) {
        const dispatchId = await this.dispatchesRepo.claim(
          em,
          request.id,
          doseAt,
        );
        if (!dispatchId) {
          alreadyClaimed++;
          continue;
        }
        if (!recipientUserId) {
          // La marca queda: no hay a quién avisar, y reintentarlo en cada
          // pasada sólo produciría ruido.
          withoutAccount++;
          continue;
        }
        const ok = await this.emit(
          em,
          request,
          doseAt,
          recipientUserId,
          dispatchId,
        );
        if (ok) emitted++;
        else failed++;
      }
    }

    const detail =
      `recetas=${requests.length} avisos=${emitted} ya_avisados=${alreadyClaimed} ` +
      `sin_cuenta=${withoutAccount} fallidos=${failed} incoherentes=${invalid}`;
    if (emitted > 0 || failed > 0 || invalid > 0) {
      this.logger.info(
        {
          operation: 'clinical.medication.reminders',
          examined: requests.length,
          emitted,
          alreadyClaimed,
          withoutAccount,
          failed,
          invalid,
        },
        'Medication reminders dispatched',
      );
    }
    return { processed: emitted, detail };
  }

  /** Cuenta activa del paciente, o `undefined` si todavía no la activó. */
  private async recipientOf(
    em: EntityManager,
    request: MedicationRequests,
  ): Promise<string | undefined> {
    // `patient_profiles.profile_id` ES el id de la persona (mismo criterio que
    // `ClinicalNotificationsService.emitToPatient`).
    const link = await this.accountLinks.findActiveByPerson(
      em,
      request.patientProfileId,
    );
    return link?.userId;
  }

  /**
   * Emite el aviso de una toma ya reclamada. Nunca lanza.
   *
   * @returns `true` si la solicitud in-app quedó creada (entregada o
   *   suprimida por preferencia); `false` si falló y se liberó la marca.
   */
  private async emit(
    em: EntityManager,
    request: MedicationRequests,
    doseAt: Date,
    recipientUserId: string,
    dispatchId: string,
  ): Promise<boolean> {
    const zone = request.timingTimeZone ?? 'America/La_Paz';
    const hora = DateTime.fromJSDate(doseAt, { zone }).toFormat('HH:mm');
    try {
      const result = await this.notifications.emitInApp({
        recipientUserId,
        category: 'CLINICAL',
        subject: 'Hora de tu medicamento',
        bodyText: `Tenés una toma programada a las ${hora}. Abrí tu receta para ver la dosis.`,
        destination: { type: 'PRESCRIPTION', id: request.id },
        tenantId: request.custodianTenantId,
        debounceKey: `medrem:${request.id}:${doseAt.toISOString()}`,
        payloadJson: { doseAt: doseAt.toISOString() },
      });
      if (result.failed || !result.requestId) {
        await this.dispatchesRepo.release(em, dispatchId);
        return false;
      }
      await this.dispatchesRepo.attachNotification(
        em,
        dispatchId,
        result.requestId,
      );
      return true;
    } catch (error) {
      this.logger.error(
        {
          operation: 'clinical.medication.reminders',
          requestId: request.id,
          err: error instanceof Error ? error.name : 'unknown',
        },
        'La emisión del recordatorio falló; se reintenta en la próxima pasada',
      );
      await this.dispatchesRepo.release(em, dispatchId).catch(() => undefined);
      return false;
    }
  }
}
