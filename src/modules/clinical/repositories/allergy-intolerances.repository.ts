import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { AllergyIntolerances, AllergyReactions } from '../entities';
import { createdBy } from '../../../common';

/**
 * Describe el contrato estructural de create allergy data.
 */
export interface CreateAllergyData {
  /**
   * Identificador asociado a custodian tenant.
   */
  custodianTenantId: string;
  /**
   * Identificador asociado a patient profile.
   */
  patientProfileId: string;
  /**
   * Encuentro en el que se detectó (opcional).
   */
  encounterId?: string;
  /**
   * Identificador asociado a substance concept.
   */
  substanceConceptId: string;
  /**
   * Identificador asociado a type concept.
   */
  typeConceptId?: string;
  /**
   * Identificador asociado a category concept.
   */
  categoryConceptId?: string;
  /**
   * Identificador asociado a criticality concept.
   */
  criticalityConceptId?: string;
  /**
   * Identificador asociado a clinical status concept.
   */
  clinicalStatusConceptId?: string;
  /**
   * Identificador asociado a verification status concept.
   */
  verificationStatusConceptId?: string;
  /**
   * Identificador asociado a recorded by user.
   */
  recordedByUserId?: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Describe el contrato estructural de create reaction data.
 */
export interface CreateReactionData {
  /**
   * Identificador asociado a allergy.
   */
  allergyId: string;
  /**
   * Identificador asociado a manifestation concept.
   */
  manifestationConceptId: string;
  /**
   * Identificador asociado a severity concept.
   */
  severityConceptId?: string;
  /**
   * Valor de description mantenido por la instancia.
   */
  description?: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos del agregado alergia/reacciones (stateless). */
@Injectable()
export class AllergyIntolerancesRepository {
  /**
   * Alergias e intolerancias del paciente, de la más reciente a la más antigua.
   *
   * Es parte de la cara de lectura del módulo (UC-39-20): sin ella se podían
   * registrar datos clínicos pero no volver a leerlos, así que ninguna pantalla
   * podía mostrar el historial del paciente.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param patientProfileId - Paciente cuyo historial se lee.
   * @param limit - Tope de filas.
   * @returns Filas del paciente, ordenadas de la más reciente a la más antigua.
   */
  findByPatient(
    em: EntityManager,
    patientProfileId: string,
    limit: number,
  ): Promise<AllergyIntolerances[]> {
    return em.find(
      AllergyIntolerances,
      { patientProfileId },
      { orderBy: { createdAt: 'DESC' }, limit },
    );
  }

  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<AllergyIntolerances | null>`.
   */
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

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `AllergyIntolerances`.
   */
  create(em: EntityManager, data: CreateAllergyData): AllergyIntolerances {
    return em.create(
      AllergyIntolerances,
      {
        custodianTenantId: data.custodianTenantId,
        patientProfileId: data.patientProfileId,
        encounterId: data.encounterId,
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

  /**
   * Crea create reaction.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create reaction conforme al contrato `AllergyReactions`.
   */
  createReaction(
    em: EntityManager,
    data: CreateReactionData,
  ): AllergyReactions {
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
