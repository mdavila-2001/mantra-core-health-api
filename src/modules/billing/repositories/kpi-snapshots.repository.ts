import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { FinancialKpiSnapshots } from '../entities';

/** Snapshot de KPI financiero (tabla LOG, append-only). */
export interface CreateKpiSnapshotData {
  /**
   * Identificador asociado a practice.
   */
  practiceId: string;
  /**
   * Identificador asociado a fiscal period.
   */
  fiscalPeriodId?: string;
  /**
   * Valor de kpi code mantenido por la instancia.
   */
  kpiCode: string;
  /**
   * Valor de value numeric mantenido por la instancia.
   */
  valueNumeric: string;
  /**
   * Valor de dimension json mantenido por la instancia.
   */
  dimensionJson?: unknown;
  /**
   * Valor de computed at mantenido por la instancia.
   */
  computedAt?: Date;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `billing.financial_kpi_snapshots` (append-only, sin updated_at). */
@Injectable()
export class KpiSnapshotsRepository {
  /** Idempotencia: busca un snapshot ya calculado para la misma clave lógica. */
  findExisting(
    em: EntityManager,
    practiceId: string,
    kpiCode: string,
    computedAt: Date,
    fiscalPeriodId?: string,
  ): Promise<FinancialKpiSnapshots | null> {
    return em.findOne(FinancialKpiSnapshots, {
      practiceId,
      kpiCode,
      computedAt,
      fiscalPeriodId: fiscalPeriodId ?? null,
    });
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `FinancialKpiSnapshots`.
   */
  create(
    em: EntityManager,
    data: CreateKpiSnapshotData,
  ): FinancialKpiSnapshots {
    const now = new Date();
    return em.create(
      FinancialKpiSnapshots,
      {
        practiceId: data.practiceId,
        fiscalPeriodId: data.fiscalPeriodId,
        kpiCode: data.kpiCode,
        valueNumeric: data.valueNumeric,
        dimensionJson: data.dimensionJson,
        computedAt: data.computedAt ?? now,
        recordedAt: now,
        recordedByUserId: data.actorUserId,
      },
      { partial: true },
    );
  }
}
