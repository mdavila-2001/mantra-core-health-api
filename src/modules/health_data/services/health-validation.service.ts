import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  PreconditionFailedException,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import {
  CanonicalResourcesRepository,
  HealthValidationRepository,
} from '../repositories';
import {
  ValidateVersionDto,
  ValidationRunResponseDto,
  RecordQualityRunDto,
  QualityRunResponseDto,
  type IssueSeverity,
} from '../dto';

const ISSUE_SEVERITY_CONCEPT: Readonly<Record<IssueSeverity, string>> = {
  FATAL: CONCEPTS.ISSUE_SEV_FATAL,
  ERROR: CONCEPTS.ISSUE_SEV_ERROR,
  WARNING: CONCEPTS.ISSUE_SEV_WARNING,
  INFORMATION: CONCEPTS.ISSUE_SEV_INFORMATION,
};

/** Severidades que hacen fallar la validación y mandan el recurso a cuarentena. */
const BLOCKING_SEVERITIES: readonly IssueSeverity[] = ['FATAL', 'ERROR'];

/**
 * Validación de datos de salud: corridas contra perfiles FHIR R5 y corridas de
 * reglas de calidad con apertura de incidencias (UC-52-07, UC-52-08).
 */
@Injectable()
export class HealthValidationService {
  constructor(
    private readonly em: EntityManager,
    private readonly validationRepo: HealthValidationRepository,
    private readonly resourcesRepo: CanonicalResourcesRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(HealthValidationService.name);
  }

  /**
   * UC-52-07: registrar la validación de una versión contra un perfil FHIR.
   *
   * El resultado se **deriva** de las severidades halladas, no lo declara quien
   * llama: dejar que el validador se ponga la nota permitiría publicar como
   * válido algo que él mismo marcó con errores. Un resultado con error manda el
   * recurso a cuarentena, que es lo que impide seguir sirviéndolo.
   */
  async validateVersion(
    versionId: string,
    dto: ValidateVersionDto,
  ): Promise<ValidationRunResponseDto> {
    this.logger.info(
      { operation: 'health-data.version.validate', versionId },
      'Validating canonical resource version against FHIR profile',
    );

    return this.em.transactional(async (tx) => {
      const version = await this.resourcesRepo.findVersionById(tx, versionId);
      if (!version) {
        throw new ResourceNotFoundException('Versión canónica no encontrada', {
          versionId,
        });
      }

      const profileVersion = await this.validationRepo.findProfileVersionById(
        tx,
        dto.fhirProfileVersionId,
      );
      if (!profileVersion) {
        throw new ResourceNotFoundException(
          'Versión del perfil FHIR no encontrada',
          {
            fhirProfileVersionId: dto.fhirProfileVersionId,
          },
        );
      }
      if (profileVersion.stateConceptId !== CONCEPTS.STATE_ACTIVE) {
        throw new PreconditionFailedException(
          'La versión del perfil no está activa',
          {
            fhirProfileVersionId: dto.fhirProfileVersionId,
          },
        );
      }

      const existing = await this.validationRepo.findValidationRun(
        tx,
        versionId,
        dto.fhirProfileVersionId,
        dto.validatorVersion,
      );
      if (existing) {
        return {
          id: existing.id,
          resultConceptId: existing.resultConceptId,
          issueCount: existing.issueCount ?? 0,
          quarantined: false,
          duplicate: true,
        };
      }

      const issues = dto.issues ?? [];
      const blocking = issues.some((issue) =>
        BLOCKING_SEVERITIES.includes(issue.severity),
      );
      const warning = issues.some((issue) => issue.severity === 'WARNING');
      const resultConceptId = blocking
        ? CONCEPTS.VALIDATION_RESULT_ERROR
        : warning
          ? CONCEPTS.VALIDATION_RESULT_WARNING
          : CONCEPTS.VALIDATION_RESULT_PASS;

      const resource = await this.resourcesRepo.findResourceForUpdate(
        tx,
        version.canonicalHealthResourceId,
      );
      if (!resource) {
        throw new ResourceNotFoundException('Recurso canónico no encontrado', {
          resourceId: version.canonicalHealthResourceId,
        });
      }

      const run = this.validationRepo.createValidationRun(tx, {
        tenantId: resource.custodianTenantId,
        canonicalHealthResourceVersionId: versionId,
        fhirProfileVersionId: dto.fhirProfileVersionId,
        validatorVersion: dto.validatorVersion,
        startedAt: new Date(dto.startedAt),
        resultConceptId,
        issueCount: issues.length,
        summaryJson: dto.summaryJson,
      });

      for (const issue of issues) {
        this.validationRepo.createValidationIssue(tx, {
          fhirValidationRunId: run.id,
          severityConceptId: ISSUE_SEVERITY_CONCEPT[issue.severity],
          issueCode: issue.issueCode,
          expressionPath: issue.expressionPath,
          diagnosticsText: issue.diagnosticsText,
          locationJson: issue.locationJson,
        });
      }

      // Un recurso ya retirado no vuelve a cuarentena: su ciclo terminó.
      const quarantined =
        blocking &&
        resource.lifecycleStatusConceptId === CONCEPTS.RESOURCE_ACTIVE;
      if (quarantined) {
        resource.lifecycleStatusConceptId = CONCEPTS.RESOURCE_QUARANTINED;
        resource.updatedAt = new Date();

        this.logger.warn(
          {
            operation: 'health-data.version.validate',
            versionId,
            resourceId: resource.id,
          },
          'Canonical resource quarantined after failing FHIR validation',
        );
      }

      return {
        id: run.id,
        resultConceptId,
        issueCount: issues.length,
        quarantined,
        duplicate: false,
      };
    });
  }

  /**
   * UC-52-08: registrar la corrida de reglas de calidad y abrir las incidencias
   * que deja. Una incidencia idéntica ya abierta —misma regla, mismo recurso,
   * mismo campo y mismo valor observado— no se duplica: es la misma queja, y
   * duplicarla sepultaría el trabajo del responsable bajo ruido.
   */
  async recordQualityRun(
    dto: RecordQualityRunDto,
    actor: AuthenticatedUser,
  ): Promise<QualityRunResponseDto> {
    this.logger.info(
      {
        operation: 'health-data.quality.run',
        ruleSetId: dto.healthDataQualityRuleSetId,
        actorUserId: actor.id,
      },
      'Recording data quality run',
    );

    // Una corrida sin ámbito no se podría interpretar después: ni se sabría qué
    // se evaluó ni contra qué comparar la siguiente.
    if (!dto.healthIngestionBatchId && !dto.canonicalResourceId) {
      throw new PreconditionFailedException(
        'La corrida necesita un ámbito: lote de ingesta o recurso canónico',
        { ruleSetId: dto.healthDataQualityRuleSetId },
      );
    }

    return this.em.transactional(async (tx) => {
      const ruleSet = await this.validationRepo.findRuleSetById(
        tx,
        dto.healthDataQualityRuleSetId,
      );
      if (!ruleSet) {
        throw new ResourceNotFoundException(
          'Conjunto de reglas no encontrado',
          {
            ruleSetId: dto.healthDataQualityRuleSetId,
          },
        );
      }
      if (ruleSet.stateConceptId !== CONCEPTS.STATE_ACTIVE) {
        throw new PreconditionFailedException(
          'El conjunto de reglas no está activo',
          {
            ruleSetId: dto.healthDataQualityRuleSetId,
          },
        );
      }

      const rules = await this.validationRepo.findActiveRules(
        tx,
        dto.healthDataQualityRuleSetId,
        CONCEPTS.STATE_ACTIVE,
      );
      const byId = new Map(rules.map((rule) => [rule.id, rule]));

      const findings = dto.findings ?? [];
      for (const finding of findings) {
        if (!byId.has(finding.healthDataQualityRuleId)) {
          throw new PreconditionFailedException(
            'El hallazgo apunta a una regla que no está activa en el conjunto',
            {
              ruleSetId: dto.healthDataQualityRuleSetId,
              ruleId: finding.healthDataQualityRuleId,
            },
          );
        }
      }

      const severities = findings.map(
        (finding) =>
          byId.get(finding.healthDataQualityRuleId)?.severityConceptId,
      );
      const resultConceptId = this.qualityResult(findings.length, severities);

      const run = this.validationRepo.createQualityRun(tx, {
        tenantId: ruleSet.tenantId,
        healthDataQualityRuleSetId: dto.healthDataQualityRuleSetId,
        healthIngestionBatchId: dto.healthIngestionBatchId,
        canonicalResourceId: dto.canonicalResourceId,
        startedAt: new Date(dto.startedAt),
        resultConceptId,
        recordsEvaluated: dto.recordsEvaluated,
        issuesDetected: String(findings.length),
        summaryJson: dto.summaryJson,
      });

      let issuesDetected = 0;
      let duplicatesSkipped = 0;
      for (const finding of findings) {
        const open = await this.validationRepo.findOpenIssue(
          tx,
          finding.healthDataQualityRuleId,
          finding.canonicalHealthResourceId,
          finding.fieldPath,
          finding.observedValueHash,
          CONCEPTS.QUALITY_ISSUE_OPEN,
        );
        if (open) {
          duplicatesSkipped += 1;
          continue;
        }

        this.validationRepo.createQualityIssue(tx, {
          healthDataQualityRunId: run.id,
          healthDataQualityRuleId: finding.healthDataQualityRuleId,
          canonicalHealthResourceId: finding.canonicalHealthResourceId,
          canonicalResourceVersionId: finding.canonicalResourceVersionId,
          fieldPath: finding.fieldPath,
          observedValueHash: finding.observedValueHash,
          statusConceptId: CONCEPTS.QUALITY_ISSUE_OPEN,
        });
        issuesDetected += 1;
      }

      run.issuesDetected = String(issuesDetected);

      if (resultConceptId === CONCEPTS.QUALITY_RESULT_FAIL) {
        this.logger.warn(
          {
            operation: 'health-data.quality.run',
            runId: run.id,
            issuesDetected,
          },
          'Data quality run failed',
        );
      }

      return { id: run.id, resultConceptId, issuesDetected, duplicatesSkipped };
    });
  }

  // --- Apoyo ---

  /**
   * El desenlace de la corrida sale de la severidad **de las reglas** que se
   * incumplen, no del número de hallazgos: cien avisos siguen siendo avisos, y
   * un solo incumplimiento crítico ya es un fallo.
   */
  private qualityResult(
    findingCount: number,
    severities: (string | undefined)[],
  ): string {
    if (findingCount === 0) return CONCEPTS.QUALITY_RESULT_PASS;
    const blocking = severities.some(
      (severity) =>
        severity === CONCEPTS.ISSUE_SEV_FATAL ||
        severity === CONCEPTS.ISSUE_SEV_ERROR,
    );
    return blocking
      ? CONCEPTS.QUALITY_RESULT_FAIL
      : CONCEPTS.QUALITY_RESULT_WARNING;
  }
}
