import { randomUUID } from 'node:crypto';
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
import { PatientIdentityRepository } from '../repositories';
import {
  ResolveMatchCandidateDto,
  MatchDecisionResponseDto,
  ProjectTimelineEntryDto,
  TimelineEntryResponseDto,
} from '../dto';

/**
 * Identidad longitudinal del paciente (MPI) y proyección de su línea de tiempo
 * (UC-52-09, UC-52-10).
 *
 * **Nunca hay fusión automática**: un candidato lo resuelve una persona, y su
 * decisión queda registrada de forma inmutable. Unir dos historias clínicas por
 * error es de las cosas más caras de deshacer que hay.
 */
@Injectable()
export class PatientIdentityService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param identityRepo - Valor de identity repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly identityRepo: PatientIdentityRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(PatientIdentityService.name);
  }

  /**
   * UC-52-09: resolver un candidato de emparejamiento. Con `MATCH` los dos
   * perfiles quedan en el mismo clúster —reutilizando el que ya tuviera alguno
   * de ellos—; con `NO_MATCH` sólo se registra la decisión.
   */
  async resolveCandidate(
    candidateId: string,
    dto: ResolveMatchCandidateDto,
    actor: AuthenticatedUser,
  ): Promise<MatchDecisionResponseDto> {
    this.logger.info(
      {
        operation: 'health-data.identity.decide',
        candidateId,
        decision: dto.decision,
      },
      'Resolving patient match candidate',
    );

    return this.em.transactional(async (tx) => {
      const candidate = await this.identityRepo.findCandidateForUpdate(
        tx,
        candidateId,
      );
      if (!candidate) {
        throw new ResourceNotFoundException('Candidato no encontrado', {
          candidateId,
        });
      }
      if (candidate.statusConceptId !== CONCEPTS.MATCH_PENDING) {
        throw new PreconditionFailedException('El candidato ya está resuelto', {
          candidateId,
        });
      }

      const previous = await this.identityRepo.findDecisionByCandidate(
        tx,
        candidateId,
      );
      if (previous) {
        throw new ConflictException('El candidato ya tiene decisión', {
          candidateId,
          decisionId: previous.id,
        });
      }

      if (dto.decision === 'NO_MATCH') {
        const decision = this.identityRepo.createDecision(tx, {
          patientMatchCandidateId: candidateId,
          decisionConceptId: CONCEPTS.MATCH_DECISION_NO_MATCH,
          decidedByUserId: actor.id,
          reasonText: dto.reasonText,
          evidenceJson: dto.evidenceJson,
        });
        candidate.statusConceptId = CONCEPTS.MATCH_RESOLVED;

        return {
          id: decision.id,
          candidateStatusConceptId: CONCEPTS.MATCH_RESOLVED,
          clusterCreated: false,
          addedMemberIds: [],
        };
      }

      // Si alguno de los dos perfiles ya está en un clúster vivo, se une al
      // existente. Crear uno nuevo partiría en dos la misma identidad.
      let cluster = await this.identityRepo.findClusterByMemberForUpdate(
        tx,
        candidate.leftPatientProfileId,
        CONCEPTS.STATE_ACTIVE,
      );
      cluster ??= await this.identityRepo.findClusterByMemberForUpdate(
        tx,
        candidate.rightPatientProfileId,
        CONCEPTS.STATE_ACTIVE,
      );

      const clusterCreated = cluster === null;
      if (!cluster) {
        cluster = this.identityRepo.createCluster(tx, {
          tenantId: candidate.tenantId,
          clusterIdentifier: `MPI-${randomUUID()}`,
          masterPatientProfileId: candidate.leftPatientProfileId,
          statusConceptId: CONCEPTS.STATE_ACTIVE,
          confidenceScore: candidate.matchScore,
          actorUserId: actor.id,
        });
      }

      const now = new Date();
      const addedMemberIds: string[] = [];
      for (const patientProfileId of [
        candidate.leftPatientProfileId,
        candidate.rightPatientProfileId,
      ]) {
        const existing = await this.identityRepo.findMemberForUpdate(
          tx,
          cluster.id,
          patientProfileId,
        );
        if (existing) continue;

        const member = this.identityRepo.createMember(tx, {
          patientIdentityClusterId: cluster.id,
          patientProfileId,
          memberRoleConceptId: dto.memberRoleConceptId,
          matchStatusConceptId: CONCEPTS.MATCH_DECISION_MATCH,
          confidenceScore: candidate.matchScore,
          effectiveFrom: now,
        });
        addedMemberIds.push(member.id);
      }

      const decision = this.identityRepo.createDecision(tx, {
        patientMatchCandidateId: candidateId,
        decisionConceptId: CONCEPTS.MATCH_DECISION_MATCH,
        decidedByUserId: actor.id,
        reasonText: dto.reasonText,
        resultingClusterId: cluster.id,
        evidenceJson: dto.evidenceJson,
      });

      candidate.statusConceptId = CONCEPTS.MATCH_RESOLVED;
      cluster.lastResolvedAt = now;
      touch(cluster, actor.id);

      this.logger.warn(
        {
          operation: 'health-data.identity.decide',
          candidateId,
          clusterId: cluster.id,
          addedMembers: addedMemberIds.length,
        },
        'Patient profiles merged into an identity cluster',
      );

      return {
        id: decision.id,
        candidateStatusConceptId: CONCEPTS.MATCH_RESOLVED,
        clusterId: cluster.id,
        clusterCreated,
        addedMemberIds,
      };
    });
  }

  /**
   * UC-52-10: proyectar una entrada de la línea de tiempo del paciente.
   *
   * Es idempotente por `(entidad de origen, tipo de evento)`: el worker de
   * proyección puede recibir el mismo evento dos veces, y la historia del
   * paciente no debe mostrar el mismo hecho duplicado.
   */
  async projectTimelineEntry(
    dto: ProjectTimelineEntryDto,
  ): Promise<TimelineEntryResponseDto> {
    return this.em.transactional(async (tx) => {
      const existing = await this.identityRepo.findTimelineEntryBySource(
        tx,
        dto.sourceEntityTypeConceptId,
        dto.sourceEntityId,
        dto.eventTypeConceptId,
      );
      if (existing) {
        return { id: existing.id, duplicate: true };
      }

      const entry = this.identityRepo.createTimelineEntry(tx, {
        custodianTenantId: dto.custodianTenantId,
        patientProfileId: dto.patientProfileId,
        eventTime: new Date(dto.eventTime),
        eventTypeConceptId: dto.eventTypeConceptId,
        sourceEntityTypeConceptId: dto.sourceEntityTypeConceptId,
        sourceEntityId: dto.sourceEntityId,
        encounterId: dto.encounterId,
        organizationId: dto.organizationId,
        title: dto.title,
        summaryRedacted: dto.summaryRedacted,
        clinicalPriorityConceptId: dto.clinicalPriorityConceptId,
        patientVisibilityConceptId: dto.patientVisibilityConceptId,
        securityLabelsJson: dto.securityLabelsJson,
      });

      return { id: entry.id, duplicate: false };
    });
  }
}
