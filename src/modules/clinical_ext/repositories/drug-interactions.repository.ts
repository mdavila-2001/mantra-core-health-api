import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { DrugInteractions } from '../entities';
import { createdBy } from '../../../common';

/** Datos para registrar un par de interacción medicamentosa (dato de referencia). */
export interface CreateDrugInteractionData {
  substanceAConceptId: string;
  substanceBConceptId: string;
  severityConceptId: string;
  mechanismText?: string;
  managementText?: string;
  evidenceLevelConceptId?: string;
  source?: string;
  sourceVersion?: string;
  actorUserId?: string;
}

/** Acceso a datos de `clinical_ext.drug_interactions`. */
@Injectable()
export class DrugInteractionsRepository {
  /** Busca la interacción de un par de sustancias en cualquier orden (A,B) o (B,A). */
  findByPair(em: EntityManager, aId: string, bId: string): Promise<DrugInteractions | null> {
    return em.findOne(DrugInteractions, {
      $or: [
        { substanceAConceptId: aId, substanceBConceptId: bId },
        { substanceAConceptId: bId, substanceBConceptId: aId },
      ],
    });
  }

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
