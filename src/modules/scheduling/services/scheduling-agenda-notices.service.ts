import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { SchedulingNoticeRepository } from '../repositories/scheduling-notice.repository';
import {
  AGENDA_NOTICE_PORT,
  type AgendaNotice,
  type AgendaNoticePort,
} from '../ports/agenda-notice.port';
import {
  avisoDeCupoLiberado,
  avisoDeRecordatorio,
} from '../notices/agenda-notices';

/**
 * Los avisos que dispara un worker: cupo liberado y recordatorio de cita (P8).
 *
 * ## Por qué no viven dentro de `SchedulingWaitlistService`
 *
 * Porque ese servicio es el piloto de la migración a puertos (§47, Fase 5): no
 * inyecta el `EntityManager` ni conoce ninguna entidad, y meterle las lecturas
 * que un aviso necesita —el cupo, el recurso, la persona detrás del perfil—
 * sería devolverle exactamente lo que la migración le quitó.
 *
 * Así, la lista de espera declara **a quién** hay que avisarle (los candidatos
 * que acaba de promover) y este servicio resuelve **con qué texto** y **a qué
 * cuenta**. Es la misma separación que hay entre el caso de uso y el puerto.
 *
 * ## Ninguno de estos métodos lanza
 *
 * Un worker que reintenta el lote no puede quedarse trabado porque un paciente
 * no tenga cuenta de portal. Devuelven cuántos avisos llegaron y dejan el resto
 * en el log.
 */
@Injectable()
export class SchedulingAgendaNoticesService {
  constructor(
    private readonly em: EntityManager,
    private readonly noticeRepo: SchedulingNoticeRepository,
    @Inject(AGENDA_NOTICE_PORT)
    private readonly notices: AgendaNoticePort,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(SchedulingAgendaNoticesService.name);
  }

  /**
   * (1) «Se liberó un horario»: aviso a los candidatos que acaban de
   * promoverse sobre un slot con cupo.
   *
   * @param slotId - Cupo que quedó libre.
   * @param waitlistEntryIds - Entradas de la lista de espera ya marcadas como
   * cubiertas. No se vuelven a leer para decidir nada: sólo para saber de qué
   * paciente es cada una.
   * @returns Cuántos avisos llegaron efectivamente a una bandeja.
   */
  async avisarCupoLiberado(
    slotId: string,
    waitlistEntryIds: readonly string[],
  ): Promise<number> {
    if (waitlistEntryIds.length === 0) return 0;

    const em = this.em.fork();
    const slot = await this.noticeRepo.describeSlot(em, slotId);
    if (!slot) {
      this.logger.warn(
        { operation: 'scheduling.notice.slot-released', slotId },
        'El cupo promovido ya no existe: no se avisa',
      );
      return 0;
    }

    const candidatos = await this.noticeRepo.findWaitlistPatients(
      em,
      waitlistEntryIds,
    );
    const avisos: AgendaNotice[] = candidatos.map((candidato) =>
      avisoDeCupoLiberado(slot, candidato.patientProfileId, candidato.tenantId),
    );

    const resultados = await this.notices.emitMany(avisos);
    const entregados = resultados.filter(
      (resultado) => resultado.delivered,
    ).length;

    this.logger.info(
      {
        operation: 'scheduling.notice.slot-released',
        slotId,
        candidates: candidatos.length,
        delivered: entregados,
      },
      'Avisos de cupo liberado emitidos',
    );
    return entregados;
  }

  /**
   * (3) «Mañana tenés turno»: entrega por el canal in-app los recordatorios que
   * el worker acaba de marcar como despachados.
   *
   * El estado del recordatorio ya lo movió la lista de espera; acá sólo se
   * entrega. Si el aviso falla, el recordatorio **sigue** marcado como enviado:
   * volver a marcarlo pendiente lo reintentaría en el próximo tick y llenaría
   * la campana de duplicados. El rebote por `debounceKey` protege igual.
   *
   * @returns Cuántos avisos llegaron efectivamente a una bandeja.
   */
  async avisarRecordatorios(reminderIds: readonly string[]): Promise<number> {
    if (reminderIds.length === 0) return 0;

    const em = this.em.fork();
    const recordatorios = await this.noticeRepo.findBookingIdsForReminders(
      em,
      reminderIds,
    );

    const avisos: AgendaNotice[] = [];
    for (const recordatorio of recordatorios) {
      const booking = await this.noticeRepo.describeBooking(
        em,
        recordatorio.bookingId,
      );
      if (!booking) continue;
      avisos.push(avisoDeRecordatorio(booking, recordatorio.offsetMinutes));
    }

    const resultados = await this.notices.emitMany(avisos);
    const entregados = resultados.filter(
      (resultado) => resultado.delivered,
    ).length;

    this.logger.info(
      {
        operation: 'scheduling.notice.reminder',
        reminders: recordatorios.length,
        delivered: entregados,
      },
      'Recordatorios entregados por el canal in-app',
    );
    return entregados;
  }
}
