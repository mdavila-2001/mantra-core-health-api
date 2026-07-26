import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { ActivityEventSchemaDefinitions } from '../entities';

/** Datos de alta de un esquema de evento de actividad (UC-28-02). */
export interface CreateEventSchemaData {
  eventName: string;
  schemaVersion: number;
  purposeDefinitionId: string;
  portalTypeConceptId: string;
  propertySchemaJson?: unknown;
  prohibitedPropertyPatternsJson?: unknown;
  piiClassificationConceptId?: string;
  phiAllowed?: boolean;
  statusConceptId: string;
  effectiveFrom: Date;
  actorUserId?: string;
}

/** Acceso a `telemetry.activity_event_schema_definitions`. */
@Injectable()
export class ActivityEventSchemaDefinitionsRepository {
  findById(em: EntityManager, id: string): Promise<ActivityEventSchemaDefinitions | null> {
    return em.findOne(ActivityEventSchemaDefinitions, { id });
  }

  findByNameVersion(
    em: EntityManager,
    eventName: string,
    schemaVersion: number,
  ): Promise<ActivityEventSchemaDefinitions | null> {
    return em.findOne(ActivityEventSchemaDefinitions, { eventName, schemaVersion });
  }

  create(em: EntityManager, data: CreateEventSchemaData): ActivityEventSchemaDefinitions {
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
