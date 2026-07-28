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
  /**
   * Valor de namespace uri mantenido por la instancia.
   */
  namespaceUri: string;
  /**
   * Valor de code mantenido por la instancia.
   */
  code: string;
  /**
   * Valor de name mantenido por la instancia.
   */
  name: string;
  /**
   * Identificador asociado a owner tenant.
   */
  ownerTenantId?: string;
  /**
   * Identificador asociado a target domain concept.
   */
  targetDomainConceptId?: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Alta de una versión de set (fila inmutable salvo la transición de publicación). */
export interface CreateVersionData {
  /**
   * Identificador asociado a definition set.
   */
  definitionSetId: string;
  /**
   * Valor de semantic version mantenido por la instancia.
   */
  semanticVersion: string;
  /**
   * Valor de schema hash mantenido por la instancia.
   */
  schemaHash: string;
  /**
   * Identificador asociado a publication status concept.
   */
  publicationStatusConceptId: string;
  /**
   * Identificador asociado a compatibility concept.
   */
  compatibilityConceptId?: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Alta de un miembro del set (campo asociado a una versión). */
export interface CreateMemberData {
  /**
   * Identificador asociado a definition set version.
   */
  definitionSetVersionId: string;
  /**
   * Identificador asociado a field.
   */
  fieldId: string;
  /**
   * Identificador asociado a section.
   */
  sectionId?: string;
  /**
   * Valor de required mantenido por la instancia.
   */
  required?: boolean;
  /**
   * Valor de ordinal mantenido por la instancia.
   */
  ordinal?: number;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Acceso a datos de `forms.field_definition_sets`, sus versiones y miembros.
 * Stateless: el `EntityManager` activo llega como primer parámetro para que el
 * servicio controle la transacción.
 */
@Injectable()
export class DefinitionSetsRepository {
  /**
   * Obtiene find set by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find set by id conforme al contrato `Promise<FieldDefinitionSets | null>`.
   */
  findSetById(
    em: EntityManager,
    id: string,
  ): Promise<FieldDefinitionSets | null> {
    return em.findOne(FieldDefinitionSets, { id });
  }

  /**
   * Obtiene find set by namespace.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param namespaceUri - Valor de namespace uri requerido por la operación.
   * @returns Resultado de find set by namespace conforme al contrato `Promise<FieldDefinitionSets | null>`.
   */
  findSetByNamespace(
    em: EntityManager,
    namespaceUri: string,
  ): Promise<FieldDefinitionSets | null> {
    return em.findOne(FieldDefinitionSets, { namespaceUri });
  }

  /**
   * Crea create set.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create set conforme al contrato `FieldDefinitionSets`.
   */
  createSet(em: EntityManager, data: CreateSetData): FieldDefinitionSets {
    const { actorUserId, ...rest } = data;
    return em.create(
      FieldDefinitionSets,
      { ...rest, ...createdBy(actorUserId) },
      { partial: true },
    );
  }

  /**
   * Obtiene find version by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find version by id conforme al contrato `Promise<FieldDefinitionSetVersions | null>`.
   */
  findVersionById(
    em: EntityManager,
    id: string,
  ): Promise<FieldDefinitionSetVersions | null> {
    return em.findOne(FieldDefinitionSetVersions, { id });
  }

  /**
   * Crea create version.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create version conforme al contrato `FieldDefinitionSetVersions`.
   */
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

  /**
   * Crea create member.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create member conforme al contrato `FieldSetMembers`.
   */
  createMember(em: EntityManager, data: CreateMemberData): FieldSetMembers {
    const { actorUserId, ...rest } = data;
    return em.create(
      FieldSetMembers,
      { ...rest, createdAt: new Date(), createdByUserId: actorUserId },
      { partial: true },
    );
  }
}
