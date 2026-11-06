import { HttpException, Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { getCurrentTenantId, type AuthenticatedUser } from '../../../common';
import { CompleteLinkedBookingUseCase } from '../../scheduling/application/bookings/use-cases/complete-linked-booking.use-case';
import type {
  ClosedEncounterRef,
  EncounterClosedPort,
} from '../ports/encounter-closed.port';

/**
 * Puerto del fin de la consulta contra `scheduling`: le pide completar el turno
 * que el encuentro atendía (y, con eso, emitir la encuesta al paciente).
 *
 * Resuelve el caso de uso de agenda de forma perezosa con `ModuleRef`, como
 * `ClinicalPatientHistoryAdapter` de `profiles`: `SchedulingModule` ya depende
 * de `ClinicalModule` por `community`, e importarlo desde acá cerraría el ciclo.
 *
 * Corre en un savepoint de la transacción en curso (la de la petición con
 * `RLS_ENFORCE=true`; si no hay, una propia): iniciar y completar el turno
 * quedan juntos, y un fallo descarta sólo el savepoint, nunca el cierre.
 *
 * No lanza nunca. Lo esperable (quien cerró no opera esa agenda, el turno ya
 * cambió de estado por otra vía) queda en `warn`; lo inesperado, en `error`.
 * Siempre con identificadores, nunca datos del paciente.
 */
@Injectable()
export class SchedulingEncounterClosedAdapter implements EncounterClosedPort {
  constructor(
    private readonly moduleRef: ModuleRef,
    private readonly em: EntityManager,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(SchedulingEncounterClosedAdapter.name);
  }

  async onEncounterClosed(
    encounter: ClosedEncounterRef,
    actor: AuthenticatedUser,
  ): Promise<void> {
    // Un encuentro abierto sin cita (consulta espontánea) no tiene turno.
    const appointmentId = encounter.appointmentId;
    if (!appointmentId) return;
    try {
      const linked = this.moduleRef.get(CompleteLinkedBookingUseCase, {
        strict: false,
      });
      await this.em
        .fork({ keepTransactionContext: true })
        .transactional(() => linked.execute(appointmentId, actor));
    } catch (error) {
      const expected =
        error instanceof HttpException && error.getStatus() < 500;
      const log = {
        operation: 'clinical.encounter.complete_booking',
        encounterId: encounter.encounterId,
        appointmentId,
        tenantId: getCurrentTenantId(),
        reason: error instanceof Error ? error.message : String(error),
      };
      if (expected) {
        this.logger.warn(log, 'El turno de la consulta cerrada no se completó');
      } else {
        this.logger.error(
          { ...log, err: error },
          'No se pudo completar el turno de la consulta cerrada',
        );
      }
    }
  }
}
