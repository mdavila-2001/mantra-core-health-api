import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { ActivityEventSchemaDefinitions } from '../entities';

/** Datos de alta de un esquema de evento de actividad (UC-28-02). */
export interface CreateEventSchemaData {
  /**
   * Valor de event name mantenido por la instancia.
   */
  eventName: string;
  /**
   * Valor de schema version mantenido por la instancia.
   */
  schemaVersion: number;
  /**
   * Identificador asociado a purpose definition.
   */
  purposeDefinitionId: string;
  /**
   * Identificador asociado a portal type concept.
   */
  portalTypeConceptId: string;
  /**
   * Valor de property schema json mantenido por la instancia.
   */
  propertySchemaJson?: unknown;
  /**
   * Valor de prohibited property patterns json mantenido por la instancia.
   */
  prohibitedPropertyPatternsJson?: unknown;
  /**
   * Identificador asociado a pii classification concept.
   */
  piiClassificationConceptId?: string;
  /**
   * Valor de phi allowed mantenido por la instancia.
   */
  phiAllowed?: boolean;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Valor de effective from mantenido por la instancia.
   */
  effectiveFrom: Date;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a `telemetry.activity_event_schema_definitions`. */
@Injectable()
export class ActivityEventSchemaDefinitionsRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<ActivityEventSchemaDefinitions | null>`.
   */
  findById(
    em: EntityManager,
    id: string,
  ): Promise<ActivityEventSchemaDefinitions | null> {
    return em.findOne(ActivityEventSchemaDefinitions, { id });
  }

  /**
   * Obtiene find by name version.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param eventName - Valor de event name requerido por la operación.
   * @param schemaVersion - Valor de schema version requerido por la operación.
   * @returns Resultado de find by name version conforme al contrato `Promise<ActivityEventSchemaDefinitions | null>`.
   */
  findByNameVersion(
    em: EntityManager,
    eventName: string,
    schemaVersion: number,
  ): Promise<ActivityEventSchemaDefinitions | null> {
    return em.findOne(ActivityEventSchemaDefinitions, {
      eventName,
      schemaVersion,
    });
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `ActivityEventSchemaDefinitions`.
   */
  create(
    em: EntityManager,
    data: CreateEventSchemaData,
  ): ActivityEventSchemaDefinitions {
    return em.create(
      ActivityEventSchemaDefinitions,
      {
        eventName: data.eventName,
        schemaVersion: data.schemaVersion,
        purposeDefinitionId: data.purposeDefinitionId,
        portalTypeConceptId: data.portalTypeConceptId,
        propertySchemaJson: data.propertySchemaJson,
        prohibitedPropertyPatternsJson: data.prohibitedPropertyPatternsJson,
        piiClassificationConceptId: data.piiClassificationConceptId,
        phiAllowed: data.phiAllowed,
        statusConceptId: data.statusConceptId,
        effectiveFrom: data.effectiveFrom,
        createdAt: new Date(),
        createdByUserId: data.actorUserId,
      },
      { partial: true },
    );
  }
}
