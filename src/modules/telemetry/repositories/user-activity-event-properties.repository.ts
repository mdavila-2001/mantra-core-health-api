import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { UserActivityEventProperties } from '../entities';

/** Datos de una propiedad de evento (UC-28-07). */
export interface CreateActivityEventPropertyData {
  userActivityEventId: string;
  propertyName: string;
  valueTypeConceptId: string;
  valueString?: string;
  valueNumber?: string;
  valueBoolean?: boolean;
  valueTimestamp?: Date;
  valueConceptId?: string;
  valueHash?: string;
  dataClassificationConceptId: string;
}

/** Acceso a `telemetry.user_activity_event_properties`. */
@Injectable()
export class UserActivityEventPropertiesRepository {
  create(
    em: EntityManager,
    data: CreateActivityEventPropertyData,
  ): UserActivityEventProperties {
    return em.create(
      UserActivityEventProperties,
      {
        userActivityEventId: data.userActivityEventId,
        propertyName: data.propertyName,
        valueTypeConceptId: data.valueTypeConceptId,
        valueString: data.valueString,
        valueNumber: data.valueNumber,
        valueBoolean: data.valueBoolean,
        valueTimestamp: data.valueTimestamp,
        valueConceptId: data.valueConceptId,
        valueHash: data.valueHash,
        dataClassificationConceptId: data.dataClassificationConceptId,
        createdAt: new Date(),
      },
      { partial: true },
    );
  }
}
