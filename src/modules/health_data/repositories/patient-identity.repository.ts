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

  /**
   * Obtiene find candidate by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find candidate by id conforme al contrato `Promise<PatientMatchCandidates | null>`.
   */
  findCandidateById(
    em: EntityManager,
    id: string,
  ): Promise<PatientMatchCandidates | null> {
    return em.findOne(PatientMatchCandidates, { id });
  }

  /**
   * Obtiene find candidate for update.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find candidate for update conforme al contrato `Promise<PatientMatchCandidates | null>`.
   */
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
      /**
       * Identificador asociado a patient match candidate.
       */
      patientMatchCandidateId: string;
      /**
       * Identificador asociado a decision concept.
       */
      decisionConceptId: string;
      /**
       * Identificador asociado a decided by user.
       */
      decidedByUserId: string;
      /**
       * Valor de reason text mantenido por la instancia.
       */
      reasonText?: string;
      /**
       * Identificador asociado a resulting cluster.
       */
      resultingClusterId?: string;
      /**
       * Valor de evidence json mantenido por la instancia.
       */
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

  /**
   * Obtiene find decision by candidate.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param patientMatchCandidateId - Identificador de patient match candidate.
   * @returns Resultado de find decision by candidate conforme al contrato `Promise<PatientMatchDecisions | null>`.
   */
  findDecisionByCandidate(
    em: EntityManager,
    patientMatchCandidateId: string,
  ): Promise<PatientMatchDecisions | null> {
    return em.findOne(PatientMatchDecisions, { patientMatchCandidateId });
  }

  // --- Clústeres y miembros (UC-52-09, 13) ---

  /**
   * Crea create cluster.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create cluster conforme al contrato `PatientIdentityClusters`.
   */
  createCluster(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a tenant.
       */
      tenantId?: string;
      /**
       * Valor de cluster identifier mantenido por la instancia.
       */
      clusterIdentifier: string;
      /**
       * Identificador asociado a master patient profile.
       */
      masterPatientProfileId: string;
      /**
       * Identificador asociado a status concept.
       */
      statusConceptId: string;
      /**
       * Valor de confidence score mantenido por la instancia.
       */
      confidenceScore?: string;
      /**
       * Identificador asociado a actor user.
       */
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

  /**
   * Obtiene find cluster for update.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find cluster for update conforme al contrato `Promise<PatientIdentityClusters | null>`.
   */
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

  /**
   * Crea create member.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create member conforme al contrato `PatientIdentityMembers`.
   */
  createMember(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a patient identity cluster.
       */
      patientIdentityClusterId: string;
      /**
       * Identificador asociado a patient profile.
       */
      patientProfileId: string;
      /**
       * Identificador asociado a source system.
       */
      sourceSystemId?: string;
      /**
       * Valor de source patient identifier mantenido por la instancia.
       */
      sourcePatientIdentifier?: string;
      /**
       * Identificador asociado a member role concept.
       */
      memberRoleConceptId?: string;
      /**
       * Identificador asociado a match status concept.
       */
      matchStatusConceptId: string;
      /**
       * Valor de confidence score mantenido por la instancia.
       */
      confidenceScore?: string;
      /**
       * Valor de effective from mantenido por la instancia.
       */
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

  /**
   * Obtiene find member for update.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param patientIdentityClusterId - Identificador de patient identity cluster.
   * @param patientProfileId - Identificador de patient profile.
   * @returns Resultado de find member for update conforme al contrato `Promise<PatientIdentityMembers | null>`.
   */
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

  /**
   * Obtiene find live membership by profile.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param patientProfileId - Identificador de patient profile.
   * @returns Resultado de find live membership by profile conforme al contrato `Promise<PatientIdentityMembers | null>`.
   */
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
      /**
       * Identificador asociado a custodian tenant.
       */
      custodianTenantId?: string;
      /**
       * Identificador asociado a patient profile.
       */
      patientProfileId: string;
      /**
       * Valor de event time mantenido por la instancia.
       */
      eventTime: Date;
      /**
       * Identificador asociado a event type concept.
       */
      eventTypeConceptId: string;
      /**
       * Identificador asociado a source entity type concept.
       */
      sourceEntityTypeConceptId: string;
      /**
       * Identificador asociado a source entity.
       */
      sourceEntityId: string;
      /**
       * Identificador asociado a encounter.
       */
      encounterId?: string;
      /**
       * Identificador asociado a organization.
       */
      organizationId?: string;
      /**
       * Valor de title mantenido por la instancia.
       */
      title?: string;
      /**
       * Valor de summary redacted mantenido por la instancia.
       */
      summaryRedacted?: string;
      /**
       * Identificador asociado a clinical priority concept.
       */
      clinicalPriorityConceptId?: string;
      /**
       * Identificador asociado a patient visibility concept.
       */
      patientVisibilityConceptId?: string;
      /**
       * Valor de security labels json mantenido por la instancia.
       */
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
