import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import { CoverageRepository, CatalogRepository } from '../repositories';
import { INS } from '../insurance.concepts';
import {
  CreateCoverageDto,
  CreateEligibilityRequestDto,
  CreateCobDto,
  CreatedResourceDto,
  ResourceStatusDto,
} from '../dto';

const RELATIONSHIP_CONCEPT: Record<string, string> = {
  SPOUSE: INS.RELATIONSHIP_SPOUSE,
  CHILD: INS.RELATIONSHIP_CHILD,
};

/**
 * Casos de uso de coberturas: alta de cobertura + dependientes (UC-26-02),
 * solicitud/resolución de elegibilidad 270/271 (UC-26-03) y determinación de
 * coordinación de beneficios COB (UC-26-09).
 */
@Injectable()
export class CoverageService {
  constructor(
    private readonly em: EntityManager,
    private readonly repo: CoverageRepository,
    private readonly catalog: CatalogRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CoverageService.name);
  }

  /** UC-26-02: registrar cobertura del paciente y sus dependientes. */
  async enrollCoverage(dto: CreateCoverageDto, actor: AuthenticatedUser): Promise<ResourceStatusDto> {
    this.logger.info({ operation: 'insurance.coverage.enroll', actorId: actor.id }, 'Enrolling coverage');
    return this.em.transactional(async (tx) => {
      const plan = await this.catalog.findPlan(tx, dto.insurancePlanId);
      if (!plan) throw new ResourceNotFoundException('Plan no encontrado', { planId: dto.insurancePlanId });
      if (plan.statusConceptId !== INS.PLAN_ACTIVE) {
        throw new PreconditionFailedException('El plan no está activo', { planId: dto.insurancePlanId });
      }

      const clash = await this.repo.findByMemberAndPlan(tx, dto.memberIdentifier, dto.insurancePlanId);
      if (clash) {
        throw new ConflictException('El afiliado ya tiene cobertura en ese plan', {
          memberIdentifier: dto.memberIdentifier,
        });
      }

      const coverage = this.repo.createCoverage(tx, {
        patientProfileId: dto.patientProfileId,
        insurancePlanId: dto.insurancePlanId,
        insuranceBrokerId: dto.insuranceBrokerId,
        memberIdentifier: dto.memberIdentifier,
        policyIdentifier: dto.policyIdentifier,
        coverageOrder: dto.coverageOrder ?? 1,
        relationshipToSubscriberConceptId: INS.RELATIONSHIP_SELF,
        verificationStatusConceptId: INS.VERIFY_PENDING,
        statusConceptId: INS.COVERAGE_ACTIVE,
        actorUserId: actor.id,
      });
      // La cobertura es padre de los dependientes (FK forzada) → flush primero.
      await tx.flush();

      for (const dep of dto.dependents ?? []) {
        this.repo.createDependent(tx, {
          patientCoverageId: coverage.id,
          dependentPatientProfileId: dep.dependentPatientProfileId,
          relationshipConceptId: dep.relationship
            ? RELATIONSHIP_CONCEPT[dep.relationship]
            : INS.RELATIONSHIP_CHILD,
          statusConceptId: INS.DEPENDENT_ACTIVE,
          actorUserId: actor.id,
        });
      }

      if (dto.insuranceBrokerId) {
        this.repo.createBrokerClient(tx, {
          insuranceBrokerId: dto.insuranceBrokerId,
          patientProfileId: dto.patientProfileId,
          clientTypeConceptId: INS.CLIENT_TYPE_INDIVIDUAL,
          statusConceptId: INS.COVERAGE_ACTIVE,
          actorUserId: actor.id,
        });
      }

      this.logger.info({ operation: 'insurance.coverage.enroll', coverageId: coverage.id }, 'Coverage enrolled');
      return { id: coverage.id, status: coverage.statusConceptId, createdAt: coverage.createdAt };
    });
  }

  /** UC-26-03: solicitar elegibilidad y registrar la respuesta inmutable in_force. */
  async requestEligibility(dto: CreateEligibilityRequestDto, actor: AuthenticatedUser): Promise<CreatedResourceDto> {
    this.logger.info({ operation: 'insurance.eligibility.request', actorId: actor.id }, 'Requesting eligibility');
    return this.em.transactional(async (tx) => {
      const coverage = await this.repo.findCoverage(tx, dto.patientCoverageId);
      if (!coverage) {
        throw new ResourceNotFoundException('Cobertura no encontrada', { coverageId: dto.patientCoverageId });
      }

      if (dto.idempotencyKey) {
        const existing = await this.repo.findRequestByIdempotency(tx, dto.idempotencyKey);
        if (existing) throw new ConflictException('Solicitud de elegibilidad duplicada', { idempotencyKey: dto.idempotencyKey });
      }

      const request = this.repo.createEligibilityRequest(tx, {
        patientCoverageId: dto.patientCoverageId,
        requestingProviderTypeConceptId: INS.ELIG_PROVIDER_TYPE_PRACTICE,
        serviceDate: dto.serviceDate ? new Date(dto.serviceDate) : undefined,
        idempotencyKey: dto.idempotencyKey,
        statusConceptId: INS.ELIG_REQUESTED,
        requestedAt: new Date(),
        actorUserId: actor.id,
      });
      await tx.flush();

      // La respuesta 271 es inmutable; primera versión in_force=true.
      this.repo.createEligibilityResponse(tx, {
        coverageEligibilityRequestId: request.id,
        responseVersion: 1,
        inForce: true,
        benefitSummaryJson: dto.benefitSummary ?? undefined,
        outcomeConceptId: INS.ELIG_OUTCOME_ACTIVE,
        respondedAt: new Date(),
        respondedByUserId: actor.id,
      });
      request.statusConceptId = INS.ELIG_RESOLVED;

      return { id: request.id };
    });
  }

  /** UC-26-09: determinar coordinación de beneficios (nueva versión supersede la vigente). */
  async determineCob(dto: CreateCobDto, actor: AuthenticatedUser): Promise<CreatedResourceDto> {
    this.logger.info({ operation: 'insurance.cob.determine', actorId: actor.id }, 'Determining COB');
    return this.em.transactional(async (tx) => {
      const primary = await this.repo.findCoverage(tx, dto.primaryPatientCoverageId);
      if (!primary) {
        throw new ResourceNotFoundException('Cobertura primaria no encontrada', {
          coverageId: dto.primaryPatientCoverageId,
        });
      }
      if (!dto.secondaryPatientCoverageId) {
        throw new PreconditionFailedException('COB requiere al menos una cobertura secundaria', {});
      }

      const previous = await this.repo.latestActiveCob(tx, dto.patientProfileId);
      const nextVersion = (previous?.determinationVersion ?? 0) + 1;
      if (previous) {
        previous.effectiveTo = new Date();
      }

      const cob = this.repo.createCob(tx, {
        patientProfileId: dto.patientProfileId,
        primaryPatientCoverageId: dto.primaryPatientCoverageId,
        secondaryPatientCoverageId: dto.secondaryPatientCoverageId,
        tertiaryPatientCoverageId: dto.tertiaryPatientCoverageId,
        cobRuleConceptId: INS.COB_RULE_STANDARD,
        determinationVersion: nextVersion,
        effectiveFrom: dto.effectiveFrom ? new Date(dto.effectiveFrom) : new Date(),
        statusConceptId: INS.COB_ACTIVE,
        actorUserId: actor.id,
      });
      await tx.flush();
      return { id: cob.id };
    });
  }
}
