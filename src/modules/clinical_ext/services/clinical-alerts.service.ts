import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { ClinicalAlertsRepository } from '../repositories';
import { OverrideAlertDto, ClinicalAlertResponseDto } from '../dto';
import { CEXT } from '../clinical_ext.concepts';

/**
 * Ciclo de vida de las alertas clínicas (UC-18-05): reconocer (acknowledge) u
 * override, ambos desde el estado activo. El override de alertas de alta severidad
 * exige un motivo por gobernanza.
 */
@Injectable()
export class ClinicalAlertsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param alertsRepo - Valor de alerts repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly alertsRepo: ClinicalAlertsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ClinicalAlertsService.name);
  }

  /** UC-18-05: reconoce la alerta (active -> acknowledged). */
  async acknowledge(
    alertId: string,
    actor: AuthenticatedUser,
  ): Promise<ClinicalAlertResponseDto> {
    this.logger.info(
      { operation: 'clinical_ext.alert.acknowledge', alertId },
      'Acknowledging alert',
    );
    return this.em.transactional(async (tx) => {
      const alert = await this.loadActive(tx, alertId);
      alert.statusConceptId = CEXT.ALERT_ACKNOWLEDGED;
      touch(alert, actor.id);
      return {
        id: alert.id,
        statusConceptId: alert.statusConceptId,
        overriddenAt: undefined,
      };
    });
  }

  /** UC-18-05: override de la alerta (active -> overridden) con motivo si es alta severidad. */
  async override(
    alertId: string,
    dto: OverrideAlertDto,
    actor: AuthenticatedUser,
  ): Promise<ClinicalAlertResponseDto> {
    this.logger.info(
      { operation: 'clinical_ext.alert.override', alertId },
      'Overriding alert',
    );
    return this.em.transactional(async (tx) => {
      const alert = await this.loadActive(tx, alertId);

      if (
        alert.severityConceptId === CEXT.SEVERITY_HIGH &&
        !dto.reason?.trim()
      ) {
        throw new PreconditionFailedException(
          'El override de una alerta de alta severidad requiere un motivo',
          { alertId },
        );
      }

      alert.statusConceptId = CEXT.ALERT_OVERRIDDEN;
      alert.overriddenByUserId = actor.id;
      alert.overrideReason = dto.reason;
      alert.overriddenAt = new Date();
      touch(alert, actor.id);

      return {
        id: alert.id,
        statusConceptId: alert.statusConceptId,
        overriddenAt: alert.overriddenAt,
      };
    });
  }

  /**
   * Obtiene load active.
   *
   * @param tx - Contexto de persistencia o transacción activa.
   * @param alertId - Identificador de alert.
   * @returns Resultado de load active.
   * @throws Error de dominio cuando no se cumplen las precondiciones de la operación.
   */
  private async loadActive(tx: EntityManager, alertId: string) {
    const alert = await this.alertsRepo.findById(tx, alertId);
    if (!alert)
      throw new ResourceNotFoundException('Alerta clínica no encontrada', {
        alertId,
      });
    if (alert.statusConceptId !== CEXT.ALERT_ACTIVE) {
      throw new PreconditionFailedException('La alerta no está activa', {
        alertId,
      });
    }
    return alert;
  }
}
