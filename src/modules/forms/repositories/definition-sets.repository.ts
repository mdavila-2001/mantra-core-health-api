import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  FieldDefinitionSets,
  FieldDefinitionSetVersions,
  FieldSetMembers,
} from '../entities';
import { createdBy } from '../../../common';

/** Alta de un set de definiciones (padre inmutable de sus versiones). */
export interface CreateSetData {
  namespaceUri: string;
  code: string;
  name: string;
  ownerTenantId?: string;
  targetDomainConceptId?: string;
  statusConceptId: string;
  actorUserId?: string;
}

/** Alta de una versión de set (fila inmutable salvo la transición de publicación). */
export interface CreateVersionData {
  definitionSetId: string;
  semanticVersion: string;
  schemaHash: string;
  publicationStatusConceptId: string;
  compatibilityConceptId?: string;
  actorUserId?: string;
}

/** Alta de un miembro del set (campo asociado a una versión). */
export interface CreateMemberData {
  definitionSetVersionId: string;
  fieldId: string;
  sectionId?: string;
  required?: boolean;
  ordinal?: number;
  actorUserId?: string;
}

/**
 * Acceso a datos de `forms.field_definition_sets`, sus versiones y miembros.
 * Stateless: el `EntityManager` activo llega como primer parámetro para que el
 * servicio controle la transacción.
 */
@Injectable()
export class DefinitionSetsRepository {
  findSetById(
    em: EntityManager,
    id: string,
  ): Promise<FieldDefinitionSets | null> {
    return em.findOne(FieldDefinitionSets, { id });
  }

  findSetByNamespace(
    em: EntityManager,
    namespaceUri: string,
  ): Promise<FieldDefinitionSets | null> {
    return em.findOne(FieldDefinitionSets, { namespaceUri });
  }

  createSet(em: EntityManager, data: CreateSetData): FieldDefinitionSets {
    const { actorUserId, ...rest } = data;
    return em.create(
      FieldDefinitionSets,
      { ...rest, ...createdBy(actorUserId) },
      { partial: true },
    );
  }

  findVersionById(
    em: EntityManager,
    id: string,
  ): Promise<FieldDefinitionSetVersions | null> {
    return em.findOne(FieldDefinitionSetVersions, { id });
  }

  createVersion(
    em: EntityManager,
    data: CreateVersionData,
  ): FieldDefinitionSetVersions {
    const { actorUserId, ...rest } = data;
    return em.create(
      FieldDefinitionSetVersions,
      { ...rest, recordedAt: new Date(), recordedByUserId: actorUserId },
      { partial: true },
    );
  }

  createMember(em: EntityManager, data: CreateMemberData): FieldSetMembers {
    const { actorUserId, ...rest } = data;
    return em.create(
      FieldSetMembers,
      { ...rest, createdAt: new Date(), createdByUserId: actorUserId },
      { partial: true },
    );
  }
}
