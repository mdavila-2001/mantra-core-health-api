import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  PatientMatchCandidates,
  PatientMatchDecisions,
  PatientIdentityClusters,
  PatientIdentityMembers,
  PatientTimelineEntries,
} from '../entities';
import { createdBy } from '../../../common';

/**
 * Acceso a la identidad longitudinal de `health_data.*`: candidatos de
 * emparejamiento, decisiones inmutables, clústeres con sus miembros y la línea
 * de tiempo del paciente.
 */
@Injectable()
export class PatientIdentityRepository {
  // --- Candidatos y decisiones (UC-52-09) ---

  findCandidateById(
    em: EntityManager,
    id: string,
  ): Promise<PatientMatchCandidates | null> {
    return em.findOne(PatientMatchCandidates, { id });
  }

  findCandidateForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<PatientMatchCandidates | null> {
    return em.findOne(
      PatientMatchCandidates,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /** Decisión inmutable: una por candidato, y revertir es decidir de nuevo sobre otro. */
  createDecision(
    em: EntityManager,
    data: {
      patientMatchCandidateId: string;
      decisionConceptId: string;
      decidedByUserId: string;
      reasonText?: string;
      resultingClusterId?: string;
      evidenceJson?: unknown;
    },
  ): PatientMatchDecisions {
    return em.create(
      PatientMatchDecisions,
      {
        patientMatchCandidateId: data.patientMatchCandidateId,
        decisionConceptId: data.decisionConceptId,
        decidedByUserId: data.decidedByUserId,
        decidedAt: new Date(),
        reasonText: data.reasonText,
        resultingClusterId: data.resultingClusterId,
        evidenceJson: data.evidenceJson,
      },
      { partial: true },
    );
  }

  findDecisionByCandidate(
    em: EntityManager,
    patientMatchCandidateId: string,
  ): Promise<PatientMatchDecisions | null> {
    return em.findOne(PatientMatchDecisions, { patientMatchCandidateId });
  }

  // --- Clústeres y miembros (UC-52-09, 13) ---

  createCluster(
    em: EntityManager,
    data: {
      tenantId?: string;
      clusterIdentifier: string;
      masterPatientProfileId: string;
      statusConceptId: string;
      confidenceScore?: string;
      actorUserId?: string;
    },
  ): PatientIdentityClusters {
    return em.create(
      PatientIdentityClusters,
      {
        tenantId: data.tenantId,
        clusterIdentifier: data.clusterIdentifier,
        masterPatientProfileId: data.masterPatientProfileId,
        statusConceptId: data.statusConceptId,
        confidenceScore: data.confidenceScore,
        lastResolvedAt: new Date(),
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  findClusterForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<PatientIdentityClusters | null> {
    return em.findOne(
      PatientIdentityClusters,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /** Clúster vivo que ya contiene a ese perfil: es al que se suma el otro lado. */
  findClusterByMemberForUpdate(
    em: EntityManager,
    patientProfileId: string,
    activeStatusConceptId: string,
  ): Promise<PatientIdentityClusters | null> {
    return em
      .findOne(
        PatientIdentityMembers,
        { patientProfileId, effectiveTo: null },
        { orderBy: { createdAt: 'DESC' } },
      )
      .then((member) =>
        member
          ? em.findOne(
              PatientIdentityClusters,
              {
                id: member.patientIdentityClusterId,
                statusConceptId: activeStatusConceptId,
              },
              { lockMode: LockMode.PESSIMISTIC_WRITE },
            )
          : null,
      );
  }

  createMember(
    em: EntityManager,
    data: {
      patientIdentityClusterId: string;
      patientProfileId: string;
      sourceSystemId?: string;
      sourcePatientIdentifier?: string;
      memberRoleConceptId?: string;
      matchStatusConceptId: string;
      confidenceScore?: string;
      effectiveFrom: Date;
    },
  ): PatientIdentityMembers {
    return em.create(
      PatientIdentityMembers,
      {
        patientIdentityClusterId: data.patientIdentityClusterId,
        patientProfileId: data.patientProfileId,
        sourceSystemId: data.sourceSystemId,
        sourcePatientIdentifier: data.sourcePatientIdentifier,
        memberRoleConceptId: data.memberRoleConceptId,
        matchStatusConceptId: data.matchStatusConceptId,
        confidenceScore: data.confidenceScore,
        effectiveFrom: data.effectiveFrom,
      },
      { partial: true },
    );
  }

  findMemberForUpdate(
    em: EntityManager,
    patientIdentityClusterId: string,
    patientProfileId: string,
  ): Promise<PatientIdentityMembers | null> {
    return em.findOne(
      PatientIdentityMembers,
      { patientIdentityClusterId, patientProfileId, effectiveTo: null },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /** Perfiles vivos del clúster: es lo que expande el `$everything` entre orígenes. */
  findLiveMembers(
    em: EntityManager,
    patientIdentityClusterId: string,
  ): Promise<PatientIdentityMembers[]> {
    return em.find(PatientIdentityMembers, {
      patientIdentityClusterId,
      effectiveTo: null,
    });
  }

  findLiveMembershipByProfile(
    em: EntityManager,
    patientProfileId: string,
  ): Promise<PatientIdentityMembers | null> {
    return em.findOne(PatientIdentityMembers, {
      patientProfileId,
      effectiveTo: null,
    });
  }

  // --- Línea de tiempo (UC-52-10, 13) ---

  /** Entrada append-only de la línea de tiempo del paciente. */
  createTimelineEntry(
    em: EntityManager,
    data: {
      custodianTenantId?: string;
      patientProfileId: string;
      eventTime: Date;
      eventTypeConceptId: string;
      sourceEntityTypeConceptId: string;
      sourceEntityId: string;
      encounterId?: string;
      organizationId?: string;
      title?: string;
      summaryRedacted?: string;
      clinicalPriorityConceptId?: string;
      patientVisibilityConceptId?: string;
      securityLabelsJson?: unknown;
    },
  ): PatientTimelineEntries {
    return em.create(
      PatientTimelineEntries,
      {
        custodianTenantId: data.custodianTenantId,
        patientProfileId: data.patientProfileId,
        eventTime: data.eventTime,
        eventTypeConceptId: data.eventTypeConceptId,
        sourceEntityTypeConceptId: data.sourceEntityTypeConceptId,
        sourceEntityId: data.sourceEntityId,
        encounterId: data.encounterId,
        organizationId: data.organizationId,
        title: data.title,
        summaryRedacted: data.summaryRedacted,
        clinicalPriorityConceptId: data.clinicalPriorityConceptId,
        patientVisibilityConceptId: data.patientVisibilityConceptId,
        securityLabelsJson: data.securityLabelsJson,
      },
      { partial: true },
    );
  }

  /**
   * Idempotencia de la proyección: la misma entidad de origen y el mismo tipo
   * de evento son la misma entrada, aunque el worker reciba el evento dos veces.
   */
  findTimelineEntryBySource(
    em: EntityManager,
    sourceEntityTypeConceptId: string,
    sourceEntityId: string,
    eventTypeConceptId: string,
  ): Promise<PatientTimelineEntries | null> {
    return em.findOne(PatientTimelineEntries, {
      sourceEntityTypeConceptId,
      sourceEntityId,
      eventTypeConceptId,
    });
  }
}
