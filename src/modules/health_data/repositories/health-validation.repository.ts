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

  findProfileVersionById(
    em: EntityManager,
    id: string,
  ): Promise<FhirProfileVersions | null> {
    return em.findOne(FhirProfileVersions, { id });
  }

  // --- Corridas de validación (UC-52-07) ---

  createValidationRun(
    em: EntityManager,
    data: {
      tenantId?: string;
      canonicalHealthResourceVersionId: string;
      fhirProfileVersionId: string;
      validatorVersion: string;
      startedAt: Date;
      resultConceptId: string;
      issueCount: number;
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

  createValidationIssue(
    em: EntityManager,
    data: {
      fhirValidationRunId: string;
      severityConceptId: string;
      issueCode?: string;
      expressionPath?: string;
      diagnosticsText?: string;
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
      },
      { partial: true },
    );
  }

  // --- Reglas de calidad (UC-52-08) ---

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

  createQualityRun(
    em: EntityManager,
    data: {
      tenantId?: string;
      healthDataQualityRuleSetId: string;
      healthIngestionBatchId?: string;
      canonicalResourceId?: string;
      startedAt: Date;
      resultConceptId: string;
      recordsEvaluated: string;
      issuesDetected: string;
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
      },
      { partial: true },
    );
  }

  createQualityIssue(
    em: EntityManager,
    data: {
      healthDataQualityRunId: string;
      healthDataQualityRuleId: string;
      canonicalHealthResourceId?: string;
      canonicalResourceVersionId?: string;
      fieldPath?: string;
      observedValueHash?: string;
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
        fieldPath: data.fieldPath,
        observedValueHash: data.observedValueHash,
        statusConceptId: data.statusConceptId,
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
