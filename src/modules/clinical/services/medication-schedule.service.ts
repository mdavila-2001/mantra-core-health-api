import { BadRequestException, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import { MedicationRequestsRepository } from '../repositories';
import type { MedicationRequests } from '../entities';
import { ClinicalReadService } from './clinical-read.service';
import {
  InvalidMedicationTimingError,
  isValidTimeZone,
  resolveMedicationSchedule,
} from './medication-schedule';
import {
  buildMedicationScheduleIcs,
  EmptyMedicationScheduleError,
} from './medication-schedule-ics';
import { timingOf } from './medication-timing.mapper';

/** El .ics listo para enviar. */
export interface MedicationScheduleIcsFile {
  /** Texto iCalendar (CRLF). */
  readonly content: string;
  /** Nombre sugerido: genérico, sin el fármaco. */
  readonly fileName: string;
}

/**
 * Exportación del cronograma de tomas de una receta a iCalendar (patch
 * v4.2.35).
 *
 * La autorización es la del PDF oficial (`PrescriptionPdfService`): el
 * prescriptor pasa siempre, y el resto por `assertPuedeLeerHistoria`
 * (titular, representante, quien atiende o relación asistencial vigente).
 * 404 antes de autorizar, igual que el PDF y los adjuntos.
 */
@Injectable()
export class MedicationScheduleService {
  /**
   * @param em - Contexto de persistencia.
   * @param requestsRepo - Lectura de la receta.
   * @param clinicalRead - Puerta de lectura del expediente.
   * @param logger - Logger estructurado.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly requestsRepo: MedicationRequestsRepository,
    private readonly clinicalRead: ClinicalReadService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(MedicationScheduleService.name);
  }

  /**
   * Construye el .ics de una receta.
   *
   * @param requestId - Receta.
   * @param actor - Quien lo pide.
   * @param timeZone - Zona a usar si la receta no declara la suya.
   * @param now - Instante de generación (DTSTAMP); inyectable para pruebas.
   * @returns El calendario y su nombre de archivo.
   * @throws ResourceNotFoundException si la receta no existe.
   * @throws ForbiddenException si el actor no puede leerla.
   * @throws BadRequestException si `timeZone` no es una zona IANA.
   * @throws PreconditionFailedException (422) si la receta no tiene tomas
   *   programadas (PRN, duración 0, sin posología estructurada).
   */
  async exportIcs(
    requestId: string,
    actor: AuthenticatedUser,
    timeZone?: string,
    now: Date = new Date(),
  ): Promise<MedicationScheduleIcsFile> {
    if (timeZone !== undefined && !isValidTimeZone(timeZone)) {
      throw new BadRequestException(
        `tz debe ser una zona horaria IANA (p. ej. America/La_Paz)`,
      );
    }

    const request = await this.requestsRepo.findById(this.em, requestId);
    if (!request) {
      throw new ResourceNotFoundException('Receta no encontrada', {
        requestId,
      });
    }
    await this.assertPuedeVerLaReceta(request, actor);

    const timing = timingOf(request);
    try {
      const schedule = resolveMedicationSchedule(
        { ...timing, timeZone: timing.timeZone ?? timeZone },
        {
          validFrom: request.validFrom,
          validTo: request.validTo,
          issuedAt: request.issuedAt,
        },
      );
      const content = buildMedicationScheduleIcs({
        requestId: request.id,
        schedule,
        now,
      });
      this.logger.info(
        { operation: 'clinical.medication.schedule_ics', requestId },
        'Medication schedule exported to iCalendar',
      );
      return { content, fileName: 'tomas-de-medicamento.ics' };
    } catch (error) {
      if (error instanceof EmptyMedicationScheduleError) {
        throw new PreconditionFailedException(error.message, {
          requestId,
          reason: error.reason,
        });
      }
      if (error instanceof InvalidMedicationTimingError) {
        throw new PreconditionFailedException(
          `La posología guardada es incoherente: ${error.message}`,
          { requestId, reason: error.code },
        );
      }
      throw error;
    }
  }

  /** Mismo criterio que `PrescriptionPdfService.assertPuedeVerLaReceta`. */
  private async assertPuedeVerLaReceta(
    request: MedicationRequests,
    actor: AuthenticatedUser,
  ): Promise<void> {
    if (
      actor.practitionerProfileId &&
      request.prescriberProfileId === actor.practitionerProfileId
    ) {
      return;
    }
    await this.clinicalRead.assertPuedeLeerHistoria(
      request.patientProfileId,
      actor,
    );
  }
}
