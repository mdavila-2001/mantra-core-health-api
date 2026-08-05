import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { DrugInteractions } from '../entities';
import { createdBy } from '../../../common';

/** Datos para registrar un par de interacción medicamentosa (dato de referencia). */
export interface CreateDrugInteractionData {
  /**
   * Identificador asociado a substance aconcept.
   */
  substanceAConceptId: string;
  /**
   * Identificador asociado a substance bconcept.
   */
  substanceBConceptId: string;
  /**
   * Identificador asociado a severity concept.
   */
  severityConceptId: string;
  /**
   * Valor de mechanism text mantenido por la instancia.
   */
  mechanismText?: string;
  /**
   * Valor de management text mantenido por la instancia.
   */
  managementText?: string;
  /**
   * Identificador asociado a evidence level concept.
   */
  evidenceLevelConceptId?: string;
  /**
   * Valor de source mantenido por la instancia.
   */
  source?: string;
  /**
   * Valor de source version mantenido por la instancia.
   */
  sourceVersion?: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `clinical_ext.drug_interactions`. */
@Injectable()
export class DrugInteractionsRepository {
  /** Busca la interacción de un par de sustancias en cualquier orden (A,B) o (B,A). */
  findByPair(
    em: EntityManager,
    aId: string,
    bId: string,
  ): Promise<DrugInteractions | null> {
    return em.findOne(DrugInteractions, {
      $or: [
        { substanceAConceptId: aId, substanceBConceptId: bId },
        { substanceAConceptId: bId, substanceBConceptId: aId },
      ],
    });
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `DrugInteractions`.
   */
  create(em: EntityManager, data: CreateDrugInteractionData): DrugInteractions {
    return em.create(
      DrugInteractions,
      {
        substanceAConceptId: data.substanceAConceptId,
        substanceBConceptId: data.substanceBConceptId,
        severityConceptId: data.severityConceptId,
        mechanismText: data.mechanismText,
        managementText: data.managementText,
        evidenceLevelConceptId: data.evidenceLevelConceptId,
        source: data.source,
        sourceVersion: data.sourceVersion,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
