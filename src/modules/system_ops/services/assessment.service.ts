import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { AssessmentRepository } from '../repositories';
import { SYSOPS } from '../system_ops.concepts';
import {
  CreateFindingDto,
  CreateRemediationPlanDto,
  CreateWorkloadAssessmentDto,
  FindingResponseDto,
  FrameworkResponseDto,
  IdResultDto,
  PutControlResultsDto,
  RemediationPlanResponseDto,
  StatusResultDto,
  UpdateFindingDto,
  VerifyRemediationActionDto,
} from '../dto';
import { CreateFrameworkDto } from '../dto';

/**
 * Ciclo de assurance operativo:
 *  - UC-11-11 publicar framework y controles (jerárquicos).
 *  - UC-11-12 iniciar evaluación de workload y registrar resultados de control.
 *  - UC-11-13 abrir hallazgo y crear plan + acciones de remediación.
 *  - UC-11-14 verificar acción y cerrar hallazgo / completar plan.
 *
 * Todo transaccional con `flush` padre-antes-de-hijo. El cierre de un hallazgo y
 * la finalización de un plan son condicionales a la agregación de acciones
 * verificadas.
 */
@Injectable()
export class AssessmentService {
  constructor(
    private readonly em: EntityManager,
    private readonly repo: AssessmentRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AssessmentService.name);
  }

  /** UC-11-11: publica un framework operativo con sus controles. */
  async publishFramework(dto: CreateFrameworkDto, actor: AuthenticatedUser): Promise<FrameworkResponseDto> {
    return this.em.transactional(async (tx) => {
      if (await this.repo.findFrameworkByCodeVersion(tx, dto.code, dto.version)) {
        throw new ConflictException('Ya existe un framework con ese code+version', {
          code: dto.code,
          version: dto.version,
        });
      }
      const framework = this.repo.createFramework(tx, {
        code: dto.code,
        name: dto.name,
        providerConceptId: dto.providerConceptId,
        version: dto.version,
        sourceUrl: dto.sourceUrl,
        publishedAt: new Date(),
        stateConceptId: CONCEPTS.STATE_ACTIVE,
        actorUserId: actor.id,
      });
      await tx.flush();

      // Primera pasada: crear todos los controles (sin padre) y mapear code -> id.
      const byCode = new Map<string, { id: string; parentCode?: string }>();
      const controls = dto.controls.map((c) => {
        const control = this.repo.createControl(tx, {
          operationalFrameworkId: framework.id,
          controlCode: c.controlCode,
          title: c.title,
          pillarConceptId: c.pillarConceptId,
          objectiveText: c.objectiveText,
          evidenceRequirementsJson: c.evidenceRequirementsJson,
          assessmentGuidanceJson: c.assessmentGuidanceJson,
          stateConceptId: CONCEPTS.STATE_ACTIVE,
          actorUserId: actor.id,
        });
        byCode.set(c.controlCode, { id: control.id, parentCode: c.parentControlCode });
        return { entity: control, def: c };
      });
      await tx.flush();

      // Segunda pasada: enlazar jerarquía (el padre ya está persistido).
      for (const { entity, def } of controls) {
        if (def.parentControlCode) {
          const parent = byCode.get(def.parentControlCode);
          if (!parent) {
            throw new PreconditionFailedException('parentControlCode no existe en el framework', {
              parentControlCode: def.parentControlCode,
            });
          }
          entity.parentControlId = parent.id;
        }
      }
      await tx.flush();

      this.logger.info({ operation: 'sysops.framework.publish', frameworkId: framework.id }, 'Framework published');
      return {
        id: framework.id,
        code: framework.code,
        version: framework.version,
        controlIds: controls.map((c) => c.entity.id),
      };
    });
  }

  /** UC-11-12: inicia una evaluación de workload sobre un framework publicado. */
  async createAssessment(
    dto: CreateWorkloadAssessmentDto,
    actor: AuthenticatedUser,
  ): Promise<IdResultDto> {
    return this.em.transactional(async (tx) => {
      const framework = await this.repo.findFrameworkById(tx, dto.operationalFrameworkId);
      if (!framework) {
        throw new ResourceNotFoundException('Framework no encontrado', {
          operationalFrameworkId: dto.operationalFrameworkId,
        });
      }
      if (framework.stateConceptId !== CONCEPTS.STATE_ACTIVE) {
        throw new PreconditionFailedException('El framework no está publicado (ACTIVE)', {
          operationalFrameworkId: dto.operationalFrameworkId,
        });
      }
      const assessment = this.repo.createAssessment(tx, {
        tenantId: dto.tenantId,
        operationalFrameworkId: framework.id,
        workloadCode: dto.workloadCode,
        workloadName: dto.workloadName,
        assessmentTypeConceptId: dto.assessmentTypeConceptId,
        statusConceptId: SYSOPS.ASSESS_IN_PROGRESS,
        assessmentPeriodStart: dto.assessmentPeriodStart ? new Date(dto.assessmentPeriodStart) : undefined,
        assessmentPeriodEnd: dto.assessmentPeriodEnd ? new Date(dto.assessmentPeriodEnd) : undefined,
        facilitatorUserId: dto.facilitatorUserId,
        actorUserId: actor.id,
      });
      await tx.flush();
      return { id: assessment.id };
    });
  }

  /** UC-11-12: registra (UPSERT) resultados de control de una evaluación. */
  async putControlResults(
    assessmentId: string,
    dto: PutControlResultsDto,
    actor: AuthenticatedUser,
  ): Promise<StatusResultDto> {
    return this.em.transactional(async (tx) => {
      const assessment = await this.repo.findAssessmentById(tx, assessmentId);
      if (!assessment) throw new ResourceNotFoundException('Evaluación no encontrada', { assessmentId });

      for (const item of dto.results) {
        const existing = await this.repo.findControlResult(tx, assessmentId, item.operationalFrameworkControlId);
        if (existing) {
          existing.resultConceptId = item.resultConceptId;
          existing.maturityLevelConceptId = item.maturityLevelConceptId;
          existing.evidenceSummary = item.evidenceSummary;
          existing.evidenceLinksJson = item.evidenceLinksJson;
          existing.assessorUserId = actor.id;
          existing.assessedAt = new Date();
          touch(existing, actor.id);
        } else {
          this.repo.createControlResult(tx, {
            workloadAssessmentId: assessmentId,
            operationalFrameworkControlId: item.operationalFrameworkControlId,
            resultConceptId: item.resultConceptId,
            maturityLevelConceptId: item.maturityLevelConceptId,
            evidenceSummary: item.evidenceSummary,
            evidenceLinksJson: item.evidenceLinksJson,
            assessorUserId: actor.id,
            actorUserId: actor.id,
          });
        }
      }
      await tx.flush();
      return { ok: true };
    });
  }

  /** UC-11-13: abre un hallazgo sobre una evaluación (finding_code único). */
  async createFinding(
    assessmentId: string,
    dto: CreateFindingDto,
    actor: AuthenticatedUser,
  ): Promise<FindingResponseDto> {
    return this.em.transactional(async (tx) => {
      const assessment = await this.repo.findAssessmentById(tx, assessmentId);
      if (!assessment) throw new ResourceNotFoundException('Evaluación no encontrada', { assessmentId });
      if (await this.repo.findFindingByCode(tx, assessmentId, dto.findingCode)) {
        throw new ConflictException('Ya existe un hallazgo con ese finding_code', {
          findingCode: dto.findingCode,
        });
      }
      const finding = this.repo.createFinding(tx, {
        workloadAssessmentId: assessmentId,
        assessmentControlResultId: dto.assessmentControlResultId,
        findingCode: dto.findingCode,
        title: dto.title,
        description: dto.description,
        severityConceptId: dto.severityConceptId,
        statusConceptId: SYSOPS.FINDING_OPEN,
        ownerTeam: dto.ownerTeam,
        dueAt: dto.dueAt ? new Date(dto.dueAt) : undefined,
        actorUserId: actor.id,
      });
      await tx.flush();
      return { id: finding.id, statusConceptId: finding.statusConceptId };
    });
  }

  /** UC-11-13: crea un plan de remediación con sus acciones sobre una evaluación. */
  async createRemediationPlan(
    assessmentId: string,
    dto: CreateRemediationPlanDto,
    actor: AuthenticatedUser,
  ): Promise<RemediationPlanResponseDto> {
    return this.em.transactional(async (tx) => {
      const assessment = await this.repo.findAssessmentById(tx, assessmentId);
      if (!assessment) throw new ResourceNotFoundException('Evaluación no encontrada', { assessmentId });
      const finding = await this.repo.findFindingById(tx, dto.assessmentFindingId);
      if (!finding) {
        throw new ResourceNotFoundException('Hallazgo no encontrado', {
          assessmentFindingId: dto.assessmentFindingId,
        });
      }
      if (await this.repo.findPlanByCode(tx, assessment.tenantId, dto.code)) {
        throw new ConflictException('Ya existe un plan con ese code para el tenant', { code: dto.code });
      }
      const plan = this.repo.createPlan(tx, {
        tenantId: assessment.tenantId,
        workloadAssessmentId: assessmentId,
        code: dto.code,
        name: dto.name,
        statusConceptId: SYSOPS.PLAN_OPEN,
        ownerUserId: dto.ownerUserId,
        targetCompletionAt: dto.targetCompletionAt ? new Date(dto.targetCompletionAt) : undefined,
        actorUserId: actor.id,
      });
      await tx.flush();
      const actionIds: string[] = [];
      for (const a of dto.actions) {
        const action = this.repo.createAction(tx, {
          remediationPlanId: plan.id,
          assessmentFindingId: finding.id,
          actionCode: a.actionCode,
          description: a.description,
          statusConceptId: SYSOPS.ACTION_OPEN,
          assignedUserId: a.assignedUserId,
          assignedTeam: a.assignedTeam,
          dueAt: a.dueAt ? new Date(a.dueAt) : undefined,
          actorUserId: actor.id,
        });
        actionIds.push(action.id);
      }
      await tx.flush();
      this.logger.info({ operation: 'sysops.remediation.plan', planId: plan.id }, 'Remediation plan created');
      return { id: plan.id, actionIds };
    });
  }

  /** UC-11-14: verifica una acción y cierra hallazgo / completa plan si procede. */
  async verifyAction(
    actionId: string,
    dto: VerifyRemediationActionDto,
    actor: AuthenticatedUser,
  ): Promise<StatusResultDto> {
    return this.em.transactional(async (tx) => {
      const action = await this.repo.findActionById(tx, actionId);
      if (!action) throw new ResourceNotFoundException('Acción de remediación no encontrada', { actionId });
      if (action.statusConceptId === SYSOPS.ACTION_VERIFIED) {
        throw new PreconditionFailedException('La acción ya está verificada', { actionId });
      }
      // Segregación de funciones: el verificador no puede ser el asignado.
      if (action.assignedUserId && action.assignedUserId === actor.id) {
        throw new PreconditionFailedException('El verificador no puede ser el asignado', { actionId });
      }

      action.statusConceptId = SYSOPS.ACTION_VERIFIED;
      action.completedAt = action.completedAt ?? new Date();
      action.verificationUserId = actor.id;
      action.verificationAt = new Date();
      action.verificationEvidenceJson = dto.verificationEvidenceJson;
      touch(action, actor.id);

      // Cerrar el hallazgo si todas sus acciones están verificadas.
      const openFindingActions = await this.repo.countFindingActionsNotIn(tx, action.assessmentFindingId, [
        SYSOPS.ACTION_VERIFIED,
      ]);
      if (openFindingActions === 0) {
        const finding = await this.repo.findFindingById(tx, action.assessmentFindingId);
        if (finding && finding.statusConceptId !== SYSOPS.FINDING_CLOSED) {
          finding.statusConceptId = SYSOPS.FINDING_CLOSED;
          finding.closedAt = new Date();
          touch(finding, actor.id);
        }
      }

      // Completar el plan si no quedan acciones abiertas.
      const openPlanActions = await this.repo.countActionsNotIn(tx, action.remediationPlanId, [
        SYSOPS.ACTION_VERIFIED,
      ]);
      if (openPlanActions === 0) {
        const plan = await this.repo.findPlanById(tx, action.remediationPlanId);
        if (plan && plan.statusConceptId !== SYSOPS.PLAN_COMPLETED) {
          plan.statusConceptId = SYSOPS.PLAN_COMPLETED;
          plan.approvedByUserId = actor.id;
          plan.approvedAt = new Date();
          touch(plan, actor.id);
        }
      }
      this.logger.info({ operation: 'sysops.remediation.verify', actionId }, 'Remediation action verified');
      return { ok: true };
    });
  }

  /** UC-11-14: actualiza un hallazgo (estado / owner). */
  async updateFinding(
    findingId: string,
    dto: UpdateFindingDto,
    actor: AuthenticatedUser,
  ): Promise<StatusResultDto> {
    return this.em.transactional(async (tx) => {
      const finding = await this.repo.findFindingById(tx, findingId);
      if (!finding) throw new ResourceNotFoundException('Hallazgo no encontrado', { findingId });
      if (dto.statusConceptId !== undefined) {
        finding.statusConceptId = dto.statusConceptId;
        if (dto.statusConceptId === SYSOPS.FINDING_CLOSED) finding.closedAt = new Date();
      }
      if (dto.ownerTeam !== undefined) finding.ownerTeam = dto.ownerTeam;
      touch(finding, actor.id);
      return { ok: true };
    });
  }
}
