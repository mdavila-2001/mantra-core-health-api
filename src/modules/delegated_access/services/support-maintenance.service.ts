import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { EffectiveSupportAccessService } from './effective-support-access.service';
import { EngagementRequestsService } from './engagement-requests.service';
import { SupportEngagementsService } from './support-engagements.service';

/** Resultado del barrido de solicitudes. */
export interface RequestExpiryResult {
  /** Solicitudes vencidas en esta pasada. */
  readonly expiredRequests: number;
}

/** Resultado del barrido de recertificación. */
export interface RecertificationSweepResult {
  /** Vínculos suspendidos por no confirmar a tiempo. */
  readonly suspendedEngagements: number;
}

/** Resultado del recálculo del acceso efectivo. */
export interface EffectiveRefreshAllResult {
  /** Organizaciones recalculadas. */
  readonly tenants: number;
  /** Filas escritas en total. */
  readonly rows: number;
  /** Delegaciones abiertas, pendientes de aceptación. */
  readonly delegationsCreated: number;
}

/**
 * Tareas periódicas del personal de apoyo que dispara el worker: vencer
 * solicitudes a los 15 días, suspender vínculos sin recertificar y recalcular
 * el acceso efectivo cuando cambian permisos, estructura o vínculos.
 */
@Injectable()
export class SupportMaintenanceService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param requests - Solicitudes de vínculo.
   * @param engagements - Vínculos de apoyo.
   * @param effective - Acceso efectivo derivado.
   * @param logger - Logger estructurado.
   */
  constructor(
    private readonly requests: EngagementRequestsService,
    private readonly engagements: SupportEngagementsService,
    private readonly effective: EffectiveSupportAccessService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(SupportMaintenanceService.name);
  }

  /**
   * Vence las solicitudes pendientes pasados los 15 días.
   *
   * @returns Cuántas se vencieron.
   */
  async expireRequests(): Promise<RequestExpiryResult> {
    const expiredRequests = await this.requests.expireOverdue();
    this.logger.info(
      {
        operation: 'delegated_access.support.expire_requests',
        expiredRequests,
      },
      'Support engagement requests expired',
    );
    return { expiredRequests };
  }

  /**
   * Suspende los vínculos a los 15 días de su recertificación sin confirmar.
   *
   * @returns Cuántos se suspendieron.
   */
  async sweepRecertification(): Promise<RecertificationSweepResult> {
    const suspendedEngagements =
      await this.engagements.suspendLapsedRecertifications();
    this.logger.info(
      {
        operation: 'delegated_access.support.recertification_sweep',
        suspendedEngagements,
      },
      'Support recertification sweep completed',
    );
    return { suspendedEngagements };
  }

  /**
   * Recalcula el acceso efectivo de todas las organizaciones con vínculos.
   *
   * @returns Organizaciones, filas y delegaciones abiertas.
   */
  async refreshEffectiveAccess(): Promise<EffectiveRefreshAllResult> {
    const tenants = await this.effective.tenantsWithEngagements();
    let rows = 0;
    let delegationsCreated = 0;
    for (const tenantId of tenants) {
      const result = await this.effective.refreshTenant(tenantId);
      rows += result.rows;
      delegationsCreated += result.delegationsCreated;
    }
    this.logger.info(
      {
        operation: 'delegated_access.support.refresh_effective',
        tenants: tenants.length,
        rows,
        delegationsCreated,
      },
      'Effective support access refreshed',
    );
    return { tenants: tenants.length, rows, delegationsCreated };
  }
}
