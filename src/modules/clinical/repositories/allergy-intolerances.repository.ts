import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { AllergyIntolerances, AllergyReactions } from '../entities';
import { createdBy } from '../../../common';

export interface CreateAllergyData {
  custodianTenantId: string;
  patientProfileId: string;
  substanceConceptId: string;
  typeConceptId?: string;
  categoryConceptId?: string;
  criticalityConceptId?: string;
  clinicalStatusConceptId?: string;
  verificationStatusConceptId?: string;
  recordedByUserId?: string;
  actorUserId?: string;
}

export interface CreateReactionData {
  allergyId: string;
  manifestationConceptId: string;
  severityConceptId?: string;
  description?: string;
  actorUserId?: string;
}

/** Acceso a datos del agregado alergia/reacciones (stateless). */
@Injectable()
export class AllergyIntolerancesRepository {
  findById(em: EntityManager, id: string): Promise<AllergyIntolerances | null> {
    return em.findOne(AllergyIntolerances, { id });
  }

  /** Alergia activa del paciente para la misma sustancia (evita duplicados). */
  findActiveBySubstance(
    em: EntityManager,
    custodianTenantId: string,
    patientProfileId: string,
    substanceConceptId: string,
    activeStatusConceptId: string,
  ): Promise<AllergyIntolerances | null> {
    return em.findOne(AllergyIntolerances, {
      custodianTenantId,
      patientProfileId,
      substanceConceptId,
      clinicalStatusConceptId: activeStatusConceptId,
    });
  }

  create(em: EntityManager, data: CreateAllergyData): AllergyIntolerances {
    return em.create(
      AllergyIntolerances,
      {
        custodianTenantId: data.custodianTenantId,
        patientProfileId: data.patientProfileId,
        substanceConceptId: data.substanceConceptId,
        typeConceptId: data.typeConceptId,
        categoryConceptId: data.categoryConceptId,
        criticalityConceptId: data.criticalityConceptId,
        clinicalStatusConceptId: data.clinicalStatusConceptId,
        verificationStatusConceptId: data.verificationStatusConceptId,
        recordedByUserId: data.recordedByUserId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  createReaction(em: EntityManager, data: CreateReactionData): AllergyReactions {
    return em.create(
      AllergyReactions,
      {
        allergyId: data.allergyId,
        manifestationConceptId: data.manifestationConceptId,
        severityConceptId: data.severityConceptId,
        description: data.description,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
