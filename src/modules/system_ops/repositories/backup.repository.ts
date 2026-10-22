import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { BackupPolicies, RestoreTestRuns } from '../entities';
import { createdBy } from '../../../common';
import { RestoreObjectiveStatus } from '../policies';

/**
 * Acceso a datos de políticas de backup (UC-11-09) y pruebas de restauración
 * append-only (UC-11-10).
 */
@Injectable()
export class BackupRepository {
  /**
   * Obtiene find policy by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find policy by id conforme al contrato `Promise<BackupPolicies | null>`.
   */
  findPolicyById(
    em: EntityManager,
    id: string,
  ): Promise<BackupPolicies | null> {
    return em.findOne(BackupPolicies, { id });
  }

  /**
   * Obtiene find active policy by scope.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Identificador de tenant.
   * @param resourceScopeConceptId - Identificador de resource scope concept.
   * @param statusConceptId - Identificador de status concept.
   * @returns Resultado de find active policy by scope conforme al contrato `Promise<BackupPolicies | null>`.
   */
  findActivePolicyByScope(
    em: EntityManager,
    tenantId: string,
    resourceScopeConceptId: string,
    statusConceptId: string,
  ): Promise<BackupPolicies | null> {
    return em.findOne(BackupPolicies, {
      tenantId,
      resourceScopeConceptId,
      statusConceptId,
    });
  }

  /**
   * Crea create policy.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create policy conforme al contrato `BackupPolicies`.
   */
  createPolicy(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a tenant.
       */
      tenantId: string;
      /**
       * Identificador asociado a resource scope concept.
       */
      resourceScopeConceptId: string;
      /**
       * Identificador asociado a backup type concept.
       */
      backupTypeConceptId: string;
      /**
       * Valor de rpo seconds mantenido por la instancia.
       */
      rpoSeconds: number;
      /**
       * Valor de rto seconds mantenido por la instancia.
       */
      rtoSeconds: number;
      /**
       * Valor de retention days mantenido por la instancia.
       */
      retentionDays?: number;
      /**
       * Valor de immutable copy required mantenido por la instancia.
       */
      immutableCopyRequired?: boolean;
      /**
       * Valor de encryption required mantenido por la instancia.
       */
      encryptionRequired?: boolean;
      /**
       * Valor de restore test frequency days mantenido por la instancia.
       */
      restoreTestFrequencyDays?: number;
      /**
       * Identificador asociado a status concept.
       */
      statusConceptId: string;
      /**
       * Identificador asociado a actor user.
       */
      actorUserId?: string;
    },
  ): BackupPolicies {
    const { actorUserId, ...rest } = data;
    return em.create(
      BackupPolicies,
      { ...rest, ...createdBy(actorUserId) },
      { partial: true },
    );
  }

  /**
   * Crea create test run.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create test run conforme al contrato `RestoreTestRuns`.
   */
  createTestRun(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a backup policy.
       */
      backupPolicyId: string;
      /**
       * Valor de backup reference mantenido por la instancia.
       */
      backupReference?: string;
      /**
       * Identificador asociado a outcome concept.
       */
      outcomeConceptId: string;
      /**
       * Valor de measured rpo seconds mantenido por la instancia.
       */
      measuredRpoSeconds?: number;
      /**
       * Valor de measured rto seconds mantenido por la instancia.
       */
      measuredRtoSeconds?: number;
      /**
       * Valor de integrity check passed mantenido por la instancia.
       */
      integrityCheckPassed?: boolean;
      /**
       * Evaluación trivalente contra los objetivos de la política (MCH-023).
       * La calcula el servicio; nunca la aporta quien llama al endpoint.
       */
      objectiveStatus: RestoreObjectiveStatus;
      /**
       * Identificador asociado a evidence file.
       */
      evidenceFileId?: string;
      /**
       * Valor de started at mantenido por la instancia.
       */
      startedAt: Date;
      /**
       * Valor de finished at mantenido por la instancia.
       */
      finishedAt?: Date;
      /**
       * Identificador asociado a recorded by user.
       */
      recordedByUserId?: string;
    },
  ): RestoreTestRuns {
    return em.create(RestoreTestRuns, { ...data }, { partial: true });
  }
}
