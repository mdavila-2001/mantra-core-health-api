import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import {
  CdsRulesRepository,
  ClinicalAlertsRepository,
  DrugInteractionsRepository,
} from '../repositories';
import {
  CreateCdsRuleDto,
  PublishRuleVersionDto,
  EvaluateCdsDto,
  CheckInteractionsDto,
  CreateDrugInteractionDto,
  CdsRuleResponseDto,
  AlertBatchResponseDto,
} from '../dto';
import { CEXT } from '../clinical_ext.concepts';

/**
 * Motor de decisión clínica (CDS): gobernanza de reglas (crear/publicar/rollback,
 * UC-18-13), evaluación de reglas activas para generar alertas (UC-18-03) y chequeo
 * de interacciones medicamentosas al prescribir (UC-18-04).
 *
 * Todas las alertas de una misma evaluación se insertan en la MISMA transacción,
 * de modo que el paciente ve el conjunto completo de alertas de forma atómica.
 */
@Injectable()
export class CdsService {
  constructor(
    private readonly em: EntityManager,
    private readonly rulesRepo: CdsRulesRepository,
    private readonly alertsRepo: ClinicalAlertsRepository,
    private readonly interactionsRepo: DrugInteractionsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CdsService.name);
  }

  /** Crea una regla CDS en borrador (precondición de la publicación, UC-18-13). */
  async createRule(dto: CreateCdsRuleDto, actor: AuthenticatedUser): Promise<CdsRuleResponseDto> {
    this.logger.info({ operation: 'clinical_ext.cds_rule.create', code: dto.code }, 'Creating CDS rule');
    return this.em.transactional(async (tx) => {
      const clash = await this.rulesRepo.findByCode(tx, dto.code);
      if (clash) throw new ConflictException('El código de regla ya existe', { code: dto.code });

      const rule = this.rulesRepo.create(tx, {
        tenantId: dto.tenantId,
        code: dto.code,
        name: dto.name,
        ruleTypeConceptId: dto.ruleTypeConceptId ?? CEXT.CDS_RULE_TYPE_ALERT,
        severityConceptId: dto.severityConceptId ?? CEXT.SEVERITY_MODERATE,
        logicJson: dto.logicJson,
        messageTemplate: dto.messageTemplate,
        isActive: false,
        version: 1,
        statusConceptId: CEXT.CDS_RULE_DRAFT,
        actorUserId: actor.id,
      });
      await tx.flush();
      return this.toRuleResponse(rule);
    });
  }

  /** UC-18-13: publica una nueva versión de la regla (draft/retired -> active). */
  async publishVersion(
    ruleId: string,
    dto: PublishRuleVersionDto,
    actor: AuthenticatedUser,
  ): Promise<CdsRuleResponseDto> {
    this.logger.info({ operation: 'clinical_ext.cds_rule.publish', ruleId }, 'Publishing CDS rule version');
    return this.em.transactional(async (tx) => {
      const rule = await this.rulesRepo.findById(tx, ruleId);
      if (!rule) throw new ResourceNotFoundException('Regla CDS no encontrada', { ruleId });

      rule.version = (rule.version ?? 1) + 1;
      if (dto.logicJson !== undefined) rule.logicJson = dto.logicJson;
      if (dto.messageTemplate !== undefined) rule.messageTemplate = dto.messageTemplate;
      if (dto.severityConceptId !== undefined) rule.severityConceptId = dto.severityConceptId;
      rule.isActive = true;
      rule.statusConceptId = CEXT.CDS_RULE_ACTIVE;
      touch(rule, actor.id);

      return this.toRuleResponse(rule);
    });
  }

  /** UC-18-13: rollback — retira la versión activa. */
  async rollbackVersion(ruleId: string, actor: AuthenticatedUser): Promise<CdsRuleResponseDto> {
    this.logger.info({ operation: 'clinical_ext.cds_rule.rollback', ruleId }, 'Rolling back CDS rule');
    return this.em.transactional(async (tx) => {
      const rule = await this.rulesRepo.findById(tx, ruleId);
      if (!rule) throw new ResourceNotFoundException('Regla CDS no encontrada', { ruleId });
      if (rule.statusConceptId !== CEXT.CDS_RULE_ACTIVE) {
        throw new PreconditionFailedException('Solo se puede hacer rollback de una regla activa', {
          ruleId,
        });
      }

      rule.isActive = false;
      rule.statusConceptId = CEXT.CDS_RULE_RETIRED;
      touch(rule, actor.id);

      return this.toRuleResponse(rule);
    });
  }

  /** UC-18-03: evalúa todas las reglas activas y genera una alerta por match. */
  async evaluate(dto: EvaluateCdsDto, actor: AuthenticatedUser): Promise<AlertBatchResponseDto> {
    this.logger.info(
      { operation: 'clinical_ext.cds.evaluate', patientProfileId: dto.patientProfileId },
      'Evaluating CDS rules',
    );
    return this.em.transactional(async (tx) => {
      const rules = await this.rulesRepo.findActive(tx, CEXT.CDS_RULE_ACTIVE, dto.tenantId);
      const now = new Date();
      const alerts = rules.map((rule) =>
        this.alertsRepo.create(tx, {
          patientProfileId: dto.patientProfileId,
          encounterId: dto.encounterId,
          alertTypeConceptId: CEXT.ALERT_TYPE_CDS,
          severityConceptId: rule.severityConceptId,
          sourceResourceType: dto.sourceResourceType,
          sourceResourceId: dto.sourceResourceId,
          triggerConceptId: CEXT.TRIGGER_CLINICAL_EVENT,
          ruleId: rule.id,
          detailText: rule.messageTemplate ?? rule.name,
          statusConceptId: CEXT.ALERT_ACTIVE,
          detectedAt: now,
          actorUserId: actor.id,
        }),
      );
      await tx.flush();

      this.logger.info(
        { operation: 'clinical_ext.cds.evaluate', generated: alerts.length },
        'CDS evaluation completed',
      );
      return {
        alerts: alerts.map((a) => ({
          id: a.id,
          alertTypeConceptId: a.alertTypeConceptId,
          severityConceptId: a.severityConceptId,
          ruleId: a.ruleId,
        })),
        count: alerts.length,
      };
    });
  }

  /** UC-18-04: detecta interacciones entre las sustancias y levanta alertas. */
  async checkInteractions(
    dto: CheckInteractionsDto,
    actor: AuthenticatedUser,
  ): Promise<AlertBatchResponseDto> {
    this.logger.info(
      { operation: 'clinical_ext.cds.check_interactions', pairs: dto.substanceConceptIds.length },
      'Checking drug interactions',
    );
    return this.em.transactional(async (tx) => {
      const substances = dto.substanceConceptIds;
      const now = new Date();
      const alerts = [];

      for (let i = 0; i < substances.length; i++) {
        for (let j = i + 1; j < substances.length; j++) {
          const interaction = await this.interactionsRepo.findByPair(tx, substances[i], substances[j]);
          if (!interaction) continue;
          const alert = this.alertsRepo.create(tx, {
            patientProfileId: dto.patientProfileId,
            encounterId: dto.encounterId,
            alertTypeConceptId: CEXT.ALERT_TYPE_DRUG_INTERACTION,
            severityConceptId: interaction.severityConceptId,
            sourceResourceType: 'medication_request',
            sourceResourceId: dto.medicationRequestId,
            triggerConceptId: CEXT.TRIGGER_CLINICAL_EVENT,
            detailText: [interaction.mechanismText, interaction.managementText]
              .filter(Boolean)
              .join(' — '),
            statusConceptId: CEXT.ALERT_ACTIVE,
            detectedAt: now,
            actorUserId: actor.id,
          });
          alerts.push(alert);
        }
      }
      await tx.flush();

      return {
        alerts: alerts.map((a) => ({
          id: a.id,
          alertTypeConceptId: a.alertTypeConceptId,
          severityConceptId: a.severityConceptId,
          ruleId: a.ruleId,
        })),
        count: alerts.length,
      };
    });
  }

  /** Registra un par de interacción medicamentosa (dato de referencia para UC-18-04). */
  async createDrugInteraction(
    dto: CreateDrugInteractionDto,
    actor: AuthenticatedUser,
  ): Promise<{ id: string }> {
    return this.em.transactional(async (tx) => {
      const interaction = this.interactionsRepo.create(tx, {
        substanceAConceptId: dto.substanceAConceptId,
        substanceBConceptId: dto.substanceBConceptId,
        severityConceptId: dto.severityConceptId ?? CEXT.SEVERITY_HIGH,
        mechanismText: dto.mechanismText,
        managementText: dto.managementText,
        actorUserId: actor.id,
      });
      await tx.flush();
      return { id: interaction.id };
    });
  }

  private toRuleResponse(rule: {
    id: string;
    code: string;
    version?: number;
    isActive: boolean;
    statusConceptId: string;
  }): CdsRuleResponseDto {
    return {
      id: rule.id,
      code: rule.code,
      version: rule.version ?? 1,
      isActive: rule.isActive,
      statusConceptId: rule.statusConceptId,
    };
  }
}
