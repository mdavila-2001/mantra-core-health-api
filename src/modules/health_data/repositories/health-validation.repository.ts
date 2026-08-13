import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  FhirProfileVersions,
  FhirValidationRuns,
  FhirValidationIssues,
  HealthDataQualityRuleSets,
  HealthDataQualityRules,
  HealthDataQualityRuns,
  HealthDataQualityIssues,
} from '../entities';

/**
 * Acceso a la validación de `health_data.*`: perfiles FHIR con sus versiones,
 * corridas de validación con sus hallazgos, y conjuntos de reglas de calidad
 * con sus corridas e incidencias.
 *
 * Las corridas y sus hallazgos son append-only: una validación es la foto de un
 * momento, y corregirla a posteriori la haría inútil como evidencia.
 */
@Injectable()
export class HealthValidationRepository {
  // --- Perfiles FHIR (UC-52-07) ---

  /**
   * Obtiene find profile version by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find profile version by id conforme al contrato `Promise<FhirProfileVersions | null>`.
   */
  findProfileVersionById(
    em: EntityManager,
    id: string,
  ): Promise<FhirProfileVersions | null> {
    return em.findOne(FhirProfileVersions, { id });
  }

  // --- Corridas de validación (UC-52-07) ---

  /**
   * Crea create validation run.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create validation run conforme al contrato `FhirValidationRuns`.
   */
  createValidationRun(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a tenant.
       */
      tenantId?: string;
      /**
       * Identificador asociado a canonical health resource version.
       */
      canonicalHealthResourceVersionId: string;
      /**
       * Identificador asociado a fhir profile version.
       */
      fhirProfileVersionId: string;
      /**
       * Valor de validator version mantenido por la instancia.
       */
      validatorVersion: string;
      /**
       * Valor de started at mantenido por la instancia.
       */
      startedAt: Date;
      /**
       * Identificador asociado a result concept.
       */
      resultConceptId: string;
      /**
       * Valor de issue count mantenido por la instancia.
       */
      issueCount: number;
      /**
       * Valor de summary json mantenido por la instancia.
       */
      summaryJson?: unknown;
    },
  ): FhirValidationRuns {
    return em.create(
      FhirValidationRuns,
      {
        tenantId: data.tenantId,
        canonicalHealthResourceVersionId: data.canonicalHealthResourceVersionId,
        fhirProfileVersionId: data.fhirProfileVersionId,
        validatorVersion: data.validatorVersion,
        startedAt: data.startedAt,
        completedAt: new Date(),
        resultConceptId: data.resultConceptId,
        issueCount: data.issueCount,
        summaryJson: data.summaryJson,
        // Columna NOT NULL sin default en el esquema.
        createdAt: new Date(),
      },
      { partial: true },
    );
  }

  /** Una corrida por versión, perfil y versión del validador: repetirla no aporta. */
  findValidationRun(
    em: EntityManager,
    canonicalHealthResourceVersionId: string,
    fhirProfileVersionId: string,
    validatorVersion: string,
  ): Promise<FhirValidationRuns | null> {
    return em.findOne(FhirValidationRuns, {
      canonicalHealthResourceVersionId,
      fhirProfileVersionId,
      validatorVersion,
    });
  }

  /**
   * Crea create validation issue.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create validation issue conforme al contrato `FhirValidationIssues`.
   */
  createValidationIssue(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a fhir validation run.
       */
      fhirValidationRunId: string;
      /**
       * Identificador asociado a severity concept.
       */
      severityConceptId: string;
      /**
       * Valor de issue code mantenido por la instancia.
       */
      issueCode?: string;
      /**
       * Valor de expression path mantenido por la instancia.
       */
      expressionPath?: string;
      /**
       * Valor de diagnostics text mantenido por la instancia.
       */
      diagnosticsText?: string;
      /**
       * Valor de location json mantenido por la instancia.
       */
      locationJson?: unknown;
    },
  ): FhirValidationIssues {
    return em.create(
      FhirValidationIssues,
      {
        fhirValidationRunId: data.fhirValidationRunId,
        severityConceptId: data.severityConceptId,
        issueCode: data.issueCode,
        expressionPath: data.expressionPath,
        diagnosticsText: data.diagnosticsText,
        locationJson: data.locationJson,
        // Columna NOT NULL sin default en el esquema.
        createdAt: new Date(),
      },
      { partial: true },
    );
  }

  // --- Reglas de calidad (UC-52-08) ---

  /**
   * Obtiene find rule set by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find rule set by id conforme al contrato `Promise<HealthDataQualityRuleSets | null>`.
   */
  findRuleSetById(
    em: EntityManager,
    id: string,
  ): Promise<HealthDataQualityRuleSets | null> {
    return em.findOne(HealthDataQualityRuleSets, { id });
  }

  /** Reglas activas del conjunto: son las que la corrida evalúa. */
  findActiveRules(
    em: EntityManager,
    healthDataQualityRuleSetId: string,
    activeStateConceptId: string,
  ): Promise<HealthDataQualityRules[]> {
    return em.find(HealthDataQualityRules, {
      healthDataQualityRuleSetId,
      stateConceptId: activeStateConceptId,
    });
  }

  /**
   * Crea create quality run.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create quality run conforme al contrato `HealthDataQualityRuns`.
   */
  createQualityRun(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a tenant.
       */
      tenantId?: string;
      /**
       * Identificador asociado a health data quality rule set.
       */
      healthDataQualityRuleSetId: string;
      /**
       * Identificador asociado a health ingestion batch.
       */
      healthIngestionBatchId?: string;
      /**
       * Identificador asociado a canonical resource.
       */
      canonicalResourceId?: string;
      /**
       * Valor de started at mantenido por la instancia.
       */
      startedAt: Date;
      /**
       * Identificador asociado a result concept.
       */
      resultConceptId: string;
      /**
       * Valor de records evaluated mantenido por la instancia.
       */
      recordsEvaluated: string;
      /**
       * Valor de issues detected mantenido por la instancia.
       */
      issuesDetected: string;
      /**
       * Valor de summary json mantenido por la instancia.
       */
      summaryJson?: unknown;
    },
  ): HealthDataQualityRuns {
    return em.create(
      HealthDataQualityRuns,
      {
        tenantId: data.tenantId,
        healthDataQualityRuleSetId: data.healthDataQualityRuleSetId,
        healthIngestionBatchId: data.healthIngestionBatchId,
        canonicalResourceId: data.canonicalResourceId,
        startedAt: data.startedAt,
        completedAt: new Date(),
        resultConceptId: data.resultConceptId,
        recordsEvaluated: data.recordsEvaluated,
        issuesDetected: data.issuesDetected,
        summaryJson: data.summaryJson,
        // Columna NOT NULL sin default en el esquema.
        createdAt: new Date(),
      },
      { partial: true },
    );
  }

  /**
   * Crea create quality issue.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create quality issue conforme al contrato `HealthDataQualityIssues`.
   */
  createQualityIssue(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a health data quality run.
       */
      healthDataQualityRunId: string;
      /**
       * Identificador asociado a health data quality rule.
       */
      healthDataQualityRuleId: string;
      /**
       * Identificador asociado a canonical health resource.
       */
      canonicalHealthResourceId?: string;
      /**
       * Identificador asociado a canonical resource version.
       */
      canonicalResourceVersionId?: string;
      /**
       * Valor de field path mantenido por la instancia.
       */
      fieldPath?: string;
      /**
       * Valor de observed value hash mantenido por la instancia.
       */
      observedValueHash?: string;
      /**
       * Identificador asociado a status concept.
       */
      statusConceptId: string;
    },
  ): HealthDataQualityIssues {
    return em.create(
      HealthDataQualityIssues,
      {
        healthDataQualityRunId: data.healthDataQualityRunId,
        healthDataQualityRuleId: data.healthDataQualityRuleId,
        canonicalHealthResourceId: data.canonicalHealthResourceId,
        canonicalResourceVersionId: data.canonicalResourceVersionId,
        // NOT NULL: un problema que no señala un campo concreto afecta al
        // recurso entero, y así se registra.
        fieldPath: data.fieldPath ?? '$',
        // NOT NULL: sin huella del valor observado se guarda vacío; el valor
        // en claro nunca se registra, que es el motivo de que sea un hash.
        observedValueHash: data.observedValueHash ?? '',
        statusConceptId: data.statusConceptId,
        // Columna NOT NULL sin default en el esquema.
        createdAt: new Date(),
      },
      { partial: true },
    );
  }

  /**
   * Incidencia abierta idéntica —misma regla, mismo recurso, mismo campo y
   * mismo valor observado—: no se duplica, porque es la misma queja.
   */
  findOpenIssue(
    em: EntityManager,
    healthDataQualityRuleId: string,
    canonicalHealthResourceId: string | undefined,
    fieldPath: string | undefined,
    observedValueHash: string | undefined,
    openStatusConceptId: string,
  ): Promise<HealthDataQualityIssues | null> {
    return em.findOne(HealthDataQualityIssues, {
      healthDataQualityRuleId,
      canonicalHealthResourceId,
      fieldPath,
      observedValueHash,
      statusConceptId: openStatusConceptId,
    });
  }
}
